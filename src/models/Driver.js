import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
        password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
        phone: { type: String, required: [true, 'Phone number is required'], trim: true },
        role: { type: String, default: 'driver', enum: ['driver'] },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
        },
        isActive: { type: Boolean, default: true },
        socketId: { type: String, default: null },
    },
    { timestamps: true }
);

driverSchema.index({ location: '2dsphere' });

driverSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

driverSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Driver', driverSchema);
