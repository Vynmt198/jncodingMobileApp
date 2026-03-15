const Category = require('../models/Category');

const listCategories = async (req, res, next) => {
    try {
        const categories = await Category.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'categoryId',
                    as: 'courses',
                },
            },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    description: 1,
                    icon: 1,
                    courseCount: {
                        $size: {
                            $filter: {
                                input: '$courses',
                                as: 'course',
                                cond: { $eq: ['$$course.status', 'active'] },
                            },
                        },
                    },
                },
            },
            { $sort: { name: 1 } },
        ]);
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// Admin / Instructor: create new category
const createCategory = async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required.',
            });
        }

        const exists = await Category.findOne({ name: name.trim() });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Danh mục này đã tồn tại.',
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description?.trim() || '',
            icon: icon || null,
        });

        return res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { listCategories, createCategory };
