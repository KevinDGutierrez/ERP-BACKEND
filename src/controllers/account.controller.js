const AccountModel = require('../models/account.model');

const getAllAccounts = async (req, res) => {
    try {
        const accounts = await AccountModel.getAll();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAccount = async (req, res) => {
    try {
        const { code, name, type, nature } = req.body;
        
        // Validar si el código ya existe
        const existing = await AccountModel.getByCode(code);
        if (existing) {
            return res.status(400).json({ message: 'El código de cuenta ya existe' });
        }

        const id = await AccountModel.create({ code, name, type, nature });
        res.status(201).json({ id, message: 'Cuenta creada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllAccounts,
    createAccount
};
