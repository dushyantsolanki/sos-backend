import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import Admin from '../models/Admin.js';

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'driver') {
            const driver = await Driver.findById(decoded.id);
            if (!driver) return res.status(401).json({ success: false, message: 'Driver not found.' });
            req.user = driver;
            req.userRole = 'driver';
        } else if (decoded.role === 'superadmin') {
            const admin = await Admin.findById(decoded.id);
            if (!admin) return res.status(401).json({ success: false, message: 'Admin not found.' });
            req.user = admin;
            req.userRole = 'superadmin';
        } else {
            return res.status(401).json({ success: false, message: 'Invalid token role.' });
        }

        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.userRole}' is not authorized to access this route.`,
            });
        }
        next();
    };
};

export { protect, authorizeRoles };
