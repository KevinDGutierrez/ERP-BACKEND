const { admin } = require('../config/firebase');
const db = admin.firestore();
const AccountModel = require('../models/account.model');

const getUsers = async (req, res) => {
    const { status } = req.query;
    try {
        let query = db.collection('users');
        if (status && status !== 'all') {
            query = query.where('status', '==', status);
        }
        
        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const approveUser = async (req, res) => {
    const { uid } = req.params;
    const { companyId, role, companyName } = req.body;
    
    try {
        let finalCompanyId = companyId;
        let isNewCompany = false;
        
        if (companyName && !companyId) {
            // Crear empresa si se solicitó una nueva
            const companyRef = await db.collection('companies').add({
                name: companyName,
                status: 'active',
                createdAt: new Date().toISOString()
            });
            finalCompanyId = companyRef.id;
            isNewCompany = true;
        }

        // Si es una empresa nueva o existente sin cuentas, sembrar el catálogo
        if (finalCompanyId) {
            const accountsSnapshot = await db.collection('accounts')
                .where('companyId', '==', finalCompanyId)
                .limit(1)
                .get();
            
            if (accountsSnapshot.empty) {
                console.log(`Sembrando catálogo de cuentas para la empresa: ${finalCompanyId}`);
                await AccountModel.seed(finalCompanyId);
            }
        }

        await db.collection('users').doc(uid).update({
            status: 'active',
            companyId: finalCompanyId || 'master_company',
            role: role || 'usuario',
            updatedAt: new Date().toISOString()
        });
        
        res.json({ 
            message: 'Usuario aprobado y catálogo configurado', 
            companyId: finalCompanyId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectUser = async (req, res) => {
    const { uid } = req.params;
    
    try {
        await db.collection('users').doc(uid).update({
            status: 'rejected',
            updatedAt: new Date().toISOString()
        });
        
        res.json({ message: 'Usuario rechazado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    approveUser,
    rejectUser
};
