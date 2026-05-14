const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

router.post('/sales', transactionController.postSale);
router.post('/purchases', transactionController.postPurchase);
router.post('/payroll', transactionController.postPayroll);
router.post('/depreciation', transactionController.postDepreciation);
router.post('/opening-entry', transactionController.postOpeningEntry);
router.post('/credit-payment', transactionController.postCreditPayment);
router.post('/iva-settlement', transactionController.postIVASettlement);

module.exports = router;
