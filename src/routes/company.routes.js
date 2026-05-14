const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');

router.get('/', companyController.listCompanies);

module.exports = router;
