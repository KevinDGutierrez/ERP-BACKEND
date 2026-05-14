const express = require('express');
const router = express.Router();

const accountRoutes = require('./account.routes');
const entryRoutes = require('./entry.routes');
const transactionRoutes = require('./transaction.routes');
const adminRoutes = require('./admin.routes');
const { authenticate } = require('../middlewares/auth.middleware');

// Aplicar autenticación global
router.use(authenticate);

// Rutas contables y de negocio
router.use('/accounts', accountRoutes);
router.use('/entries', entryRoutes);
router.use('/transactions', transactionRoutes);

// Rutas administrativas (Super Admin)
router.use('/admin', adminRoutes);

module.exports = router;
