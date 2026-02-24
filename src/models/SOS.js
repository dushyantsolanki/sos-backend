import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema(
    {
        driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        status: { type: String, enum: ['active', 'resolved'], default: 'active' },
        resolvedAt: { type: Date, default: null },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
        nearbyDriversNotified: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
    },
    { timestamps: true }
);

sosSchema.index({ location: '2dsphere' });

export default mongoose.model('SOS', sosSchema);
