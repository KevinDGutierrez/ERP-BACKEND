const AccountingService = require('../services/accounting.service');
const EntryModel = require('../models/entry.model');

const createEntry = async (req, res) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(403).json({ message: 'No tienes una empresa asignada' });

        const { date, description, type, details } = req.body;

        if (!date || !description || !details || !Array.isArray(details)) {
            return res.status(400).json({ message: 'Datos de la partida incompletos o inválidos' });
        }

        const entryId = await AccountingService.createEntry({ 
            date, 
            description, 
            type, 
            companyId 
        }, details);
        
        res.status(201).json({ 
            id: entryId, 
            message: 'Partida contable registrada exitosamente' 
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getDailyBook = async (req, res) => {
    try {
        const { companyId } = req.user;
        const { startDate, endDate } = req.query;
        const entries = await EntryModel.getDailyBook(companyId, startDate, endDate);
        res.json(entries);
    } catch (error) {
        console.error('Error in getDailyBook:', error);
        res.status(500).json({ 
            message: 'Error al obtener el libro diario. Si es la primera vez, verifica la consola del servidor para crear el índice de Firestore necesario.',
            details: error.message 
        });
    }
};

const getTrialBalance = async (req, res) => {
    try {
        const { companyId } = req.user;
        const balance = await AccountingService.getTrialBalance(companyId);
        res.json(balance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfitAndLoss = async (req, res) => {
    try {
        const { companyId } = req.user;
        const report = await AccountingService.getProfitAndLoss(companyId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBalanceSheet = async (req, res) => {
    try {
        const { companyId } = req.user;
        const report = await AccountingService.getBalanceSheet(companyId);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLedger = async (req, res) => {
    try {
        const { companyId } = req.user;
        const { accountId, accountCode } = req.query;
        let account;

        if (accountCode) {
            const AccountModel = require('../models/account.model');
            account = await AccountModel.getByCode(accountCode, companyId);
        } else if (accountId) {
            const AccountModel = require('../models/account.model');
            account = await AccountModel.getById(accountId);
        }

        if (!account || (account.companyId && account.companyId !== companyId)) {
            return res.status(404).json({ message: 'Cuenta no encontrada o fuera de acceso' });
        }

        const movements = await EntryModel.getLedgerByAccount(companyId, account.id, account.nature);
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
        const { companyId } = req.user;
        const balance = await AccountingService.getAdjustedTrialBalance(companyId);
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
