import express from 'express';
import { getAllDrivers, getDriverById } from '../controllers/driverController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('superadmin'), getAllDrivers);
router.get('/:id', protect, authorizeRoles('superadmin'), getDriverById);

export default router;
