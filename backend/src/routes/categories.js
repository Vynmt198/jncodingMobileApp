const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleCheck');

router.get('/', categoryController.listCategories);
router.post('/', auth, isInstructor, categoryController.createCategory);

module.exports = router;
