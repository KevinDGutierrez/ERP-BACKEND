const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accounting.controller');

router.get('/trial-balance', accountingController.getTrialBalance);
router.get('/profit-loss', accountingController.getProfitLoss);
router.get('/balance-sheet', accountingController.getBalanceSheet);

module.exports = router;
