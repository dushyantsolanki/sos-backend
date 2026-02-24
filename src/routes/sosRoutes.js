import express from 'express';
import { body } from 'express-validator';
import {
    triggerSOS, getAllSOS, getActiveSOS,
    resolveSOS, driverResolveSOS, getSOSById, getMySOSHistory,
} from '../controllers/sosController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.post(
    '/trigger',
    protect,
    authorizeRoles('driver'),
    [
        body('latitude').isFloat().withMessage('Valid latitude required'),
        body('longitude').isFloat().withMessage('Valid longitude required'),
    ],
    validate,
    triggerSOS
);

router.get('/my-history', protect, authorizeRoles('driver'), getMySOSHistory);
router.get('/all', protect, authorizeRoles('superadmin'), getAllSOS);
router.get('/active', protect, authorizeRoles('superadmin'), getActiveSOS);
router.put('/:id/resolve', protect, authorizeRoles('superadmin'), resolveSOS);
router.put('/:id/driver-resolve', protect, authorizeRoles('driver'), driverResolveSOS);
router.get('/:id', protect, getSOSById);

export default router;
