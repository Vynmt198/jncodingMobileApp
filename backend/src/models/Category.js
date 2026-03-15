const mongoose = require('mongoose');

/**
 * Category - Danh mục khóa học (BR5, UC05)
 * Python, Web Dev, JavaScript, Java, HTML/CSS, SQL...
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            default: null, // URL or icon name
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

categorySchema.pre('save', function () {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }
});

module.exports = mongoose.model('Category', categorySchema);
