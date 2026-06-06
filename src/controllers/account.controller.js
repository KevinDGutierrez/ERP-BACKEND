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
            return res.status(403).json({ success: false, message: 'No puedes crear cuentas sin una empresa asignada' });
        }

        const { code, name, type, nature, parentId } = req.body;

        if (!name || !type || !nature) {
            return res.status(400).json({ success: false, message: 'Nombre, tipo y naturaleza son obligatorios' });
        }

        // Validar si el código ya existe
        if (code) {
            const existing = await AccountModel.getByCode(code, companyId);
            if (existing) {
                return res.status(400).json({ success: false, message: 'El código de cuenta ya existe en tu catálogo' });
            }
        }

        // Validar que la cuenta padre pertenezca al mismo companyId
        if (parentId) {
            const parent = await AccountModel.getById(parentId);
            if (!parent || parent.companyId !== companyId) {
                return res.status(400).json({ success: false, message: 'La cuenta superior no es válida o pertenece a otra empresa' });
            }
        }

        const id = await AccountModel.create({ 
            code, 
            name, 
            type, 
            nature,
            parentId,
            companyId 
        });
        res.status(201).json({ success: true, id, message: 'Cuenta creada exitosamente' });
    } catch (error) {
        console.error('Error createAccount:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllAccounts,
    createAccount
};
