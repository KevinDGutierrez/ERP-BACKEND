const { admin } = require('../config/firebase');
const db = admin.firestore();
const AccountModel = require('../models/account.model');

/**
 * List all companies (public for registration dropdown)
 */
const listCompanies = async (req, res) => {
    try {
        const snapshot = await db.collection('companies')
            .where('status', '==', 'active')
            .get();
        
        const companies = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        res.json({ companies });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * List ALL companies for admin panel (includes inactive)
 */
const listAllCompanies = async (req, res) => {
    try {
        const snapshot = await db.collection('companies').get();
        const companies = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to ISO strings
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null
            };
        });
        res.json({ companies });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create a new company
 */
const createCompany = async (req, res) => {
    try {
        const { name, legalName, nit, email, phone } = req.body;
        if (!name) return res.status(400).json({ message: 'El nombre es requerido' });

        const companyRef = await db.collection('companies').add({
            name,
            legalName: legalName || '',
            nit: nit || '',
            email: email || '',
            phone: phone || '',
            status: 'active',
            createdAt: new Date().toISOString()
        });

        // Seed default accounts for the new company
        await AccountModel.seed(companyRef.id);

        res.status(201).json({ 
            id: companyRef.id, 
            message: 'Empresa creada y catálogo de cuentas inicializado' 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update a company
 */
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, legalName, nit, email, phone, status } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (legalName !== undefined) updateData.legalName = legalName;
        if (nit !== undefined) updateData.nit = nit;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (status !== undefined) updateData.status = status;
        updateData.updatedAt = new Date().toISOString();

        await db.collection('companies').doc(id).update(updateData);
        res.json({ message: 'Empresa actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get users by companyId (for admin_empresa)
 */
const getCompanyUsers = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Security: if not super_admin, only allow access to own company
        if (req.user.role !== 'super_admin' && req.user.companyId !== companyId) {
            return res.status(403).json({ message: 'No tienes acceso a esta empresa' });
        }

        const snapshot = await db.collection('users')
            .where('companyId', '==', companyId)
            .get();

        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get brand config for the current user's company
 */
const getBrand = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ message: 'Usuario sin empresa asignada' });

        const docSnap = await db.collection('companies').doc(companyId).get();
        if (!docSnap.exists) return res.status(404).json({ message: 'Empresa no encontrada' });

        const data = docSnap.data();
        res.json({
            name: data.name || '',
            logo: data.logo || null,
            theme: data.theme || 'dark',
            nit: data.nit || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            slogan: data.slogan || ''
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update brand config — only admin_empresa of that company
 */
const BRAND_FIELDS = ['name', 'logo', 'theme', 'nit', 'address', 'phone', 'email', 'slogan'];

const updateBrandConfig = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ message: 'Usuario sin empresa asignada' });

        // Only admin_empresa or super_admin can update brand
        if (req.user.role !== 'admin_empresa' && req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'No tienes permisos para editar la configuración' });
        }

        // Filter to only brand-safe fields
        const brandData = {};
        BRAND_FIELDS.forEach(key => {
            if (req.body[key] !== undefined) brandData[key] = req.body[key];
        });
        brandData.updatedAt = new Date().toISOString();

        await db.collection('companies').doc(companyId).update(brandData);
        res.json({ message: 'Configuración de marca actualizada', brand: brandData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    listCompanies,
    listAllCompanies,
    createCompany,
    updateCompany,
    getCompanyUsers,
    getBrand,
    updateBrandConfig
};
