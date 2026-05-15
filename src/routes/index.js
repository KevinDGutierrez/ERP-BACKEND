const express = require('express');
const router = express.Router();

const accountRoutes = require('./account.routes');
const entryRoutes = require('./entry.routes');
const transactionRoutes = require('./transaction.routes');
const adminRoutes = require('./admin.routes');
const accountingRoutes = require('./accounting.routes');
const companyRoutes = require('./company.routes');
const { authenticate } = require('../middlewares/auth.middleware');

// Rutas públicas
router.use('/companies', companyRoutes);

// Aplicar autenticación para el resto de rutas
router.use(authenticate);

// Rutas contables y de negocio
router.use('/accounts', accountRoutes);
router.use('/entries', entryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/accounting', accountingRoutes);

// Rutas administrativas (Super Admin)
router.use('/admin', adminRoutes);

module.exports = router;
