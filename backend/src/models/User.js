const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: false,
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        googleId: {
            type: String,
            default: null,
            index: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters'],
        },
        role: {
            type: String,
            enum: ['learner', 'instructor', 'admin'],
            default: 'learner',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        avatar: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            default: null,
            trim: true,
        },
        bio: {
            type: String,
            default: null,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },
        // Instructor extended profile (optional)
        instructorHeadline: {
            type: String,
            default: null,
            maxlength: [150, 'Headline cannot exceed 150 characters'],
        },
        instructorBio: {
            type: String,
            default: null,
            maxlength: [2000, 'Instructor bio cannot exceed 2000 characters'],
        },
        instructorSkills: {
            type: [String],
            default: [],
        },
        instructorWebsite: {
            type: String,
            default: null,
        },
        instructorFacebook: {
            type: String,
            default: null,
        },
        instructorYoutube: {
            type: String,
            default: null,
        },
        instructorLinkedin: {
            type: String,
            default: null,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function () {

    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
