import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';

const initSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication token missing'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`Socket connected: ${socket.id} | Role: ${socket.userRole}`);

        if (socket.userRole === 'superadmin') {
            socket.join('admins');
            console.log(`Admin ${socket.userId} joined admin room`);
        }

        if (socket.userRole === 'driver') {
            await Driver.findByIdAndUpdate(socket.userId, { socketId: socket.id });
            socket.join(`driver_${socket.userId}`);
            console.log(`Driver ${socket.userId} joined room: driver_${socket.userId}`);
        }

        socket.on('update_location', async (data) => {
            try {
                const { latitude, longitude } = data;
                if (!latitude || !longitude) return;

                const driver = await Driver.findByIdAndUpdate(
                    socket.userId,
                    { location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] } },
                    { returnDocument: 'after' }
                );

                if (!driver) return;

                io.to('admins').emit('driver_location_update', {
                    driverId: driver._id,
                    name: driver.name,
                    location: driver.location,
                });
            } catch (err) {
                console.error('Socket update_location error:', err.message);
            }
        });

        socket.on('sos_acknowledged', (data) => {
            io.to('admins').emit('driver_sos_acknowledged', { driverId: socket.userId, sosId: data.sosId });
        });

        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date() });
        });

        socket.on('disconnect', async () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.userRole === 'driver') {
                await Driver.findByIdAndUpdate(socket.userId, { socketId: null });
            }
        });
    });
};

export default initSocket;
