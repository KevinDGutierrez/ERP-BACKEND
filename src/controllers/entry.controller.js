const AccountingService = require('../services/accounting.service');
const EntryModel = require('../models/entry.model');

const createEntry = async (req, res) => {
    try {
        const { date, description, type, details } = req.body;

        if (!date || !description || !details || !Array.isArray(details)) {
            return res.status(400).json({ message: 'Datos de la partida incompletos o inválidos' });
        }

        const entryId = await AccountingService.createEntry({ date, description, type }, details);
        
        res.status(201).json({ 
            id: entryId, 
            message: 'Partida contable registrada y saldos actualizados exitosamente' 
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDailyBook = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const entries = await EntryModel.getDailyBook(startDate, endDate);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrialBalance = async (req, res) => {
    try {
        const balance = await AccountingService.getTrialBalance();
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfitAndLoss = async (req, res) => {
    try {
        const report = await AccountingService.getProfitAndLoss();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBalanceSheet = async (req, res) => {
    try {
        const report = await AccountingService.getBalanceSheet();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLedger = async (req, res) => {
    try {
        const { accountId, accountCode } = req.query;
        let account;

        if (accountCode) {
            const AccountModel = require('../models/account.model');
            account = await AccountModel.getByCode(accountCode);
        } else if (accountId) {
            const AccountModel = require('../models/account.model');
            account = await AccountModel.getById(accountId);
        }

        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }

        const movements = await EntryModel.getLedgerByAccount(account.id, account.nature);
        res.json({
            account: {
                code: account.code,
                name: account.name,
                nature: account.nature
            },
            movements
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdjustedTrialBalance = async (req, res) => {
    try {
        const balance = await AccountingService.getAdjustedTrialBalance();
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createEntry,
    getDailyBook,
    getTrialBalance,
    getProfitAndLoss,
    getBalanceSheet,
    getLedger,
    getAdjustedTrialBalance
};
