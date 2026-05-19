const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Public route — used in registration dropdown
router.get('/', companyController.listCompanies);

// Protected routes
router.use(authenticate);

// Brand config — accessible by all company users (read) and admin_empresa (write)
router.get('/brand', companyController.getBrand);
router.patch('/brand', companyController.updateBrandConfig);

// Admin-only company management
router.get('/all', isAdmin, companyController.listAllCompanies);
router.post('/', isAdmin, companyController.createCompany);
router.patch('/:id', isAdmin, companyController.updateCompany);

// Company users — accessible by admin_empresa for their own company
router.get('/:companyId/users', companyController.getCompanyUsers);

module.exports = router;
