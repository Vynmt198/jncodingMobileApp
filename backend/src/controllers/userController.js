const User = require('../models/User');

// GET /api/users/:id/public-profile (no auth – public view of instructor/user profile)
const getPublicProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select(
            'fullName avatar bio role instructorHeadline instructorBio instructorSkills instructorWebsite instructorFacebook instructorYoutube instructorLinkedin'
        ).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    bio: user.bio || null,
                    role: user.role,
                    instructorHeadline: user.instructorHeadline || null,
                    instructorBio: user.instructorBio || null,
                    instructorSkills: user.instructorSkills || [],
                    instructorWebsite: user.instructorWebsite || null,
                    instructorFacebook: user.instructorFacebook || null,
                    instructorYoutube: user.instructorYoutube || null,
                    instructorLinkedin: user.instructorLinkedin || null,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/users/profile
const getProfile = async (req, res, next) => {
    try {
        // req.user is populated by auth middleware
        const user = req.user;
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isActive: user.isActive,
                    avatar: user.avatar,
                    bio: user.bio,
                    instructorHeadline: user.instructorHeadline,
                    instructorBio: user.instructorBio,
                    instructorSkills: user.instructorSkills,
                    instructorWebsite: user.instructorWebsite,
                    instructorFacebook: user.instructorFacebook,
                    instructorYoutube: user.instructorYoutube,
                    instructorLinkedin: user.instructorLinkedin,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLogin: user.lastLogin,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
    try {
        const {
            fullName,
            avatar,
            // instructor profile
            instructorHeadline,
            instructorBio,
            instructorSkills,
            instructorWebsite,
            instructorFacebook,
            instructorYoutube,
            instructorLinkedin,
        } = req.body;

        // Build update object with only allowed fields
        const updates = {};
        if (fullName !== undefined) updates.fullName = fullName;
        if (avatar !== undefined) updates.avatar = avatar;
        if (instructorHeadline !== undefined) updates.instructorHeadline = instructorHeadline;
        if (instructorBio !== undefined) updates.instructorBio = instructorBio;
        if (instructorSkills !== undefined) updates.instructorSkills = instructorSkills;
        if (instructorWebsite !== undefined) updates.instructorWebsite = instructorWebsite;
        if (instructorFacebook !== undefined) updates.instructorFacebook = instructorFacebook;
        if (instructorYoutube !== undefined) updates.instructorYoutube = instructorYoutube;
        if (instructorLinkedin !== undefined) updates.instructorLinkedin = instructorLinkedin;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: {
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    fullName: updatedUser.fullName,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    avatar: updatedUser.avatar,
                    bio: updatedUser.bio,
                    instructorHeadline: updatedUser.instructorHeadline,
                    instructorBio: updatedUser.instructorBio,
                    instructorSkills: updatedUser.instructorSkills,
                    instructorWebsite: updatedUser.instructorWebsite,
                    instructorFacebook: updatedUser.instructorFacebook,
                    instructorYoutube: updatedUser.instructorYoutube,
                    instructorLinkedin: updatedUser.instructorLinkedin,
                    updatedAt: updatedUser.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/change-password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.',
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from your current password.',
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, getPublicProfile, updateProfile, changePassword };
