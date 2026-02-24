import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
        type: { type: String, enum: ['sos_alert', 'resolved'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        sub: { type: String, default: '' },
        sosId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOS', default: null },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
