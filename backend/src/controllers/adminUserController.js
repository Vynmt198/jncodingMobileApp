const User = require('../models/User');

const ALLOWED_ROLES = ['learner', 'instructor', 'admin'];

// GET /api/admin/users
// List users with pagination, search, and filters 
const listUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            isActive,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (role && ALLOWED_ROLES.includes(role)) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [users, total] = await Promise.all([
            User.find(filter).sort(sort).skip(skip).limit(limitNum).select('-password'),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasNextPage: pageNum < Math.ceil(total / limitNum),
                    hasPrevPage: pageNum > 1,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(', ')}`,
            });
        }
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role.',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `User role updated to "${role}".`,
            data: { user: updatedUser },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/users/:id/status
// Lock / unlock user account
const toggleUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own account status.',
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isActive: user.isActive,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
// DELETE /api/admin/users/:id — DISABLED by policy
// Admins are not permitted to permanently delete users.
// Use toggleUserStatus to deactivate accounts instead.
const deleteUser = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Deleting users is not permitted. Use deactivate (toggle status) instead.',
    });
};

module.exports = { listUsers, updateUserRole, toggleUserStatus };
