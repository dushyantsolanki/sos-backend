import Driver from '../models/Driver.js';

const getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: drivers.length, drivers });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
        res.status(200).json({ success: true, driver });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

export { getAllDrivers, getDriverById };
