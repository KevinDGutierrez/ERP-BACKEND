const express = require('express');
const router = express.Router();

const accountRoutes = require('./account.routes');
const entryRoutes = require('./entry.routes');
const transactionRoutes = require('./transaction.routes');
const authenticate = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas contables
router.use(authenticate);

router.use('/accounts', accountRoutes);
router.use('/entries', entryRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
