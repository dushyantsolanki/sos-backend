import Notification from '../models/Notification.js';

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
        res.json({ success: true, notifications, unreadCount });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
        res.json({ success: true });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.json({ success: true });
    } catch {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

export { getMyNotifications, markAllRead, clearAll };
