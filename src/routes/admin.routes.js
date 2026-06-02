const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

// Todas estas rutas requieren rol super_admin
router.use(isAdmin);

router.get('/users', adminController.getUsers);
router.patch('/users/:uid/approve', adminController.approveUser);
router.post('/users/:uid/reject', adminController.rejectUser);

router.get('/reset-requests', adminController.getResetRequests);
router.post('/reset-requests/:id/approve', adminController.approveResetRequest);
router.post('/reset-requests/:id/reject', adminController.rejectResetRequest);

module.exports = router;
