const AccountingService = require('../services/accounting.service');

const postOpeningEntry = async (req, res) => {
    try {
        const { companyId } = req.user;
        const entryId = await AccountingService.registerOpeningEntry(companyId, req.body);
        res.status(201).json({ id: entryId, message: 'Partida de apertura registrada exitosamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const postCreditPayment = async (req, res) => {
    try {
        const { companyId } = req.user;
        const entryId = await AccountingService.payCreditSale(companyId, req.body);
        res.status(201).json({ id: entryId, message: 'Pago de cliente registrado correctamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const postIVASettlement = async (req, res) => {
    try {
        const { companyId } = req.user;
        const entryId = await AccountingService.settleIVA(companyId);
        res.status(201).json({ id: entryId, message: 'Liquidación de IVA procesada correctamente' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const postSale = async (req, res) => {
    try {
        const { companyId } = req.user;
        const saleData = req.body;
        if (!saleData.total || !saleData.clientName) {
            return res.status(400).json({ message: 'Faltan datos obligatorios para la venta' });
        }

        const entryId = await AccountingService.registerSale(companyId, saleData);
        res.status(201).json({ id: entryId, message: 'Venta registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postPurchase = async (req, res) => {
    try {
        const { companyId } = req.user;
        const purchaseData = req.body;
        if (!purchaseData.total || !purchaseData.supplierName) {
            return res.status(400).json({ message: 'Faltan datos obligatorios para la compra' });
        }

        const entryId = await AccountingService.registerPurchase(companyId, purchaseData);
        res.status(201).json({ id: entryId, message: 'Compra registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postPayroll = async (req, res) => {
    try {
        const { companyId } = req.user;
        const payrollData = req.body;
        if (!payrollData.grossSalary || !payrollData.employeeName) {
            return res.status(400).json({ message: 'Faltan datos para la nómina' });
        }

        const entryId = await AccountingService.registerPayroll(companyId, payrollData);
        res.status(201).json({ id: entryId, message: 'Nómina procesada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postDepreciation = async (req, res) => {
    try {
        const { companyId } = req.user;
        const depData = req.body;
        const entryId = await AccountingService.registerDepreciation(companyId, depData);
        res.status(201).json({ id: entryId, message: 'Depreciación registrada correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    postSale,
    postPurchase,
    postPayroll,
    postDepreciation,
    postOpeningEntry,
    postCreditPayment,
    postIVASettlement
};
