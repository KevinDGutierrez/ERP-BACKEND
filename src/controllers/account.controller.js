const AccountModel = require('../models/account.model');

const getAllAccounts = async (req, res) => {
    try {
        const { companyId } = req.user;
        if (!companyId) {
            return res.status(403).json({ message: 'Usuario no tiene una empresa asignada' });
        }
        const accounts = await AccountModel.getAll(companyId);
        res.json(accounts);
    } catch (error) {
        console.error('Error getAllAccounts:', error.message);
        res.status(500).json({ message: error.message });
    }
};

const createAccount = async (req, res) => {
    try {
        const { companyId } = req.user;
        if (!companyId) {
            return res.status(403).json({ message: 'No puedes crear cuentas sin una empresa asignada' });
        }

        const { code, name, type, nature } = req.body;
        
        // Validar si el código ya existe en ESTA empresa
        const existing = await AccountModel.getByCode(code, companyId);
        if (existing) {
            return res.status(400).json({ message: 'El código de cuenta ya existe en tu catálogo' });
        }

        const id = await AccountModel.create({ 
            code, 
            name, 
            type, 
            nature,
            companyId 
        });
        res.status(201).json({ id, message: 'Cuenta creada exitosamente' });
    } catch (error) {
        console.error('Error createAccount:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllAccounts,
    createAccount
};
