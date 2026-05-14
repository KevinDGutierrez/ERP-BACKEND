const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entry.controller');

router.post('/', entryController.createEntry);
router.get('/daily-book', entryController.getDailyBook);
router.get('/trial-balance', entryController.getTrialBalance);
router.get('/profit-loss', entryController.getProfitAndLoss);
router.get('/balance-sheet', entryController.getBalanceSheet);
router.get('/ledger', entryController.getLedger);
router.get('/adjusted-trial-balance', entryController.getAdjustedTrialBalance);

module.exports = router;
