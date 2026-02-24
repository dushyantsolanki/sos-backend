import Driver from '../models/Driver.js';
import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';

const registerDriver = async (req, res) => {
    try {
        const { name, email, password, phone, latitude, longitude } = req.body;

        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const driver = await Driver.create({
            name, email, password, phone,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
            },
        });

        const token = generateToken(driver._id, 'driver');

        res.status(201).json({
            success: true,
            message: 'Driver registered successfully.',
            token,
            user: { id: driver._id, name: driver.name, email: driver.email, phone: driver.phone, role: 'driver', location: driver.location },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
    }
};

const loginDriver = async (req, res) => {
    try {
        const { email, password } = req.body;

        const driver = await Driver.findOne({ email }).select('+password');
        if (!driver) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const isMatch = await driver.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const token = generateToken(driver._id, 'driver');

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: driver._id, name: driver.name, email: driver.email, phone: driver.phone, role: 'driver', location: driver.location },
        });
    } catch {
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const token = generateToken(admin._id, 'superadmin');

        res.status(200).json({
            success: true,
            message: 'Admin login successful.',
            token,
            user: { id: admin._id, name: admin.name, email: admin.email, role: 'superadmin' },
        });
    } catch {
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone || null,
                role: req.userRole,
                location: req.user.location || null,
            },
        });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
        }

        const driver = await Driver.findByIdAndUpdate(
            req.user._id,
            { location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] } },
            { new: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.to('admins').emit('driver_location_update', {
                driverId: driver._id,
                name: driver.name,
                location: driver.location,
            });
        }

        res.status(200).json({ success: true, message: 'Location updated.', location: driver.location });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const seedAdmin = async (req, res) => {
    try {
        const existing = await Admin.findOne({ role: 'superadmin' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Super Admin already exists.' });
        }

        const admin = await Admin.create({ name: 'Super Admin', email: 'admin@sos.com', password: 'admin123' });

        res.status(201).json({
            success: true,
            message: 'Super Admin seeded successfully.',
            credentials: { email: admin.email, password: 'admin123' },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error.' });
    }
};

export { registerDriver, loginDriver, loginAdmin, getMe, updateLocation, seedAdmin };
