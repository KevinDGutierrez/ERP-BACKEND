const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

// Todas estas rutas requieren rol super_admin
router.use(isAdmin);

router.get('/users', adminController.getUsers);
router.put('/users/:uid/status', adminController.approveUser);
router.post('/users/:uid/reject', adminController.rejectUser);

module.exports = router;
