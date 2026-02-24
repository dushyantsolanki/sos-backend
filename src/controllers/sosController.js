import SOS from "../models/SOS.js";
import Driver from "../models/Driver.js";
import Notification from "../models/Notification.js";

const triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Latitude and longitude are required.",
        });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    await Driver.findByIdAndUpdate(req.user._id, {
      location: { type: "Point", coordinates: [lng, lat] },
    });

    const sos = await SOS.create({
      driver: req.user._id,
      location: { type: "Point", coordinates: [lng, lat] },
      status: "active",
    });

    const nearbyDrivers = await Driver.find({
      _id: { $ne: req.user._id },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 10000,
        },
      },
    }).select("_id name phone socketId");

    const nearbyDriverIds = nearbyDrivers.map((d) => d._id);
    await SOS.findByIdAndUpdate(sos._id, {
      nearbyDriversNotified: nearbyDriverIds,
    });

    const populatedSOS = await SOS.findById(sos._id).populate(
      "driver",
      "name email phone location"
    );

    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("new_sos_alert", {
        sos: populatedSOS,
        nearbyDriversCount: nearbyDrivers.length,
      });

      nearbyDrivers.forEach((driver) => {
        io.to(`driver_${driver._id}`).emit("sos_nearby_alert", {
          message: `SOS Alert! Driver ${req.user.name} needs help nearby!`,
          sos: populatedSOS,
          triggerDriver: {
            name: req.user.name,
            phone: req.user.phone,
            location: { lat, lng },
          },
        });
      });
    }

    if (nearbyDrivers.length > 0) {
      const notifDocs = nearbyDrivers.map((d) => ({
        recipient: d._id,
        type: "sos_alert",
        title: "Nearby SOS Alert!",
        message: `Driver ${req.user.name} needs emergency help nearby`,
        sub: req.user.phone || "",
        sosId: sos._id,
      }));
      await Notification.insertMany(notifDocs);
    }

    res.status(201).json({
      success: true,
      message: "SOS alert triggered successfully.",
      sos: populatedSOS,
      nearbyDriversNotified: nearbyDrivers.length,
    });
  } catch (error) {
    console.error("Trigger SOS Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error triggering SOS." });
  }
};

const getAllSOS = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const alerts = await SOS.find(filter)
      .populate("driver", "name email phone location")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching SOS alerts." });
  }
};

const getActiveSOS = async (req, res) => {
  try {
    const alerts = await SOS.find({ status: "active" })
      .populate("driver", "name email phone location")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const resolveSOS = async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id).populate(
      "driver",
      "name email phone location"
    );

    if (!sos)
      return res
        .status(404)
        .json({ success: false, message: "SOS alert not found." });
    if (sos.status === "resolved")
      return res
        .status(400)
        .json({ success: false, message: "SOS is already resolved." });

    sos.status = "resolved";
    sos.resolvedAt = new Date();
    sos.resolvedBy = req.user._id;
    await sos.save();

    const populatedSOS = await SOS.findById(sos._id)
      .populate("driver", "name email phone location")
      .populate("resolvedBy", "name email");

    const io = req.app.get("io");
    if (io) {
      const driverId = sos.driver._id.toString();
      io.to(`driver_${driverId}`).emit("sos_resolved", {
        sosId: sos._id,
        resolvedBy: req.user.name,
        sos: populatedSOS,
      });
      io.to("admins").emit("sos_resolved", {
        sosId: sos._id,
        resolvedBy: req.user.name,
        sos: populatedSOS,
      });
    }

    await Notification.create({
      recipient: sos.driver._id,
      type: "resolved",
      title: "Your SOS Resolved",
      message: "Your SOS alert has been resolved by admin",
      sub: `Resolved by: ${req.user.name}`,
      sosId: sos._id,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "SOS resolved successfully.",
        sos: populatedSOS,
      });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Server error resolving SOS." });
  }
};

const getSOSById = async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate("driver", "name email phone location")
      .populate("resolvedBy", "name email")
      .populate("nearbyDriversNotified", "name phone");

    if (!sos)
      return res
        .status(404)
        .json({ success: false, message: "SOS alert not found." });
    res.status(200).json({ success: true, sos });
  } catch {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getMySOSHistory = async (req, res) => {
  try {
    const alerts = await SOS.find({ driver: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const driverResolveSOS = async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate("driver", "name email phone")
      .populate("nearbyDriversNotified", "_id");

    if (!sos)
      return res
        .status(404)
        .json({ success: false, message: "SOS alert not found." });

    if (sos.driver._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only resolve your own SOS.",
        });
    }

    if (sos.status === "resolved")
      return res
        .status(400)
        .json({ success: false, message: "SOS is already resolved." });

    sos.status = "resolved";
    sos.resolvedAt = new Date();
    sos.resolvedBy = req.user._id;
    await sos.save();

    const populatedSOS = await SOS.findById(sos._id)
      .populate("driver", "name email phone location")
      .populate("resolvedBy", "name email phone");

    const io = req.app.get("io");
    if (io) {
      const resolvedByName = `${req.user.name} (Driver)`;
      io.to("admins").emit("sos_resolved", {
        sosId: sos._id,
        resolvedBy: resolvedByName,
        sos: populatedSOS,
      });

      const nearbyIds = sos.nearbyDriversNotified || [];
      nearbyIds.forEach((driver) => {
        const id = driver._id ? driver._id.toString() : driver.toString();
        io.to(`driver_${id}`).emit("sos_resolved", {
          sosId: sos._id,
          resolvedBy: resolvedByName,
          sos: populatedSOS,
        });
      });
    }

    const nearbyIds = (sos.nearbyDriversNotified || []).map((d) =>
      d._id ? d._id.toString() : d.toString()
    );
    if (nearbyIds.length > 0) {
      const notifDocs = nearbyIds.map((driverId) => ({
        recipient: driverId,
        type: "resolved",
        title: "Emergency Resolved",
        message: `${req.user.name} has resolved their SOS emergency`,
        sub: "Driver self-resolved the emergency",
        sosId: sos._id,
      }));
      await Notification.insertMany(notifDocs);
    }

    res
      .status(200)
      .json({
        success: true,
        message: "SOS resolved successfully.",
        sos: populatedSOS,
      });
  } catch {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export {
  triggerSOS,
  getAllSOS,
  getActiveSOS,
  resolveSOS,
  driverResolveSOS,
  getSOSById,
  getMySOSHistory,
};
