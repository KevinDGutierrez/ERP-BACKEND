const AccountingService = require('../services/accounting.service');

const getTrialBalance = async (req, res) => {
    try {
        const { companyId } = req.user;
        const report = await AccountingService.getTrialBalance(companyId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfitLoss = async (req, res) => {
    try {
        const { companyId } = req.user;
        const report = await AccountingService.getProfitAndLoss(companyId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getBalanceSheet = async (req, res) => {
    try {
        const { companyId } = req.user;
        const report = await AccountingService.getBalanceSheet(companyId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getTrialBalance,
    getProfitLoss,
    getBalanceSheet
};
