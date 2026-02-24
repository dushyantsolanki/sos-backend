import express from 'express';
import { body } from 'express-validator';
import {
    registerDriver, loginDriver, loginAdmin,
    getMe, updateLocation, seedAdmin,
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.get('/admin/seed', seedAdmin);

router.post(
    '/driver/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('phone').notEmpty().withMessage('Phone is required'),
    ],
    validate,
    registerDriver
);

router.post(
    '/driver/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    loginDriver
);

router.post(
    '/admin/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    loginAdmin
);

router.get('/me', protect, getMe);

router.put(
    '/driver/location',
    protect,
    authorizeRoles('driver'),
    [
        body('latitude').isFloat().withMessage('Valid latitude required'),
        body('longitude').isFloat().withMessage('Valid longitude required'),
    ],
    validate,
    updateLocation
);

export default router;
