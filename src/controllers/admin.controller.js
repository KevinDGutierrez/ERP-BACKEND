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

        // Si es una empresa nueva o existente, sembrar el catálogo de forma idempotente
        if (finalCompanyId) {
            console.log(`Verificando y sembrando catálogo de cuentas para la empresa: ${finalCompanyId}`);
            await AccountModel.seed(finalCompanyId);
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

const getResetRequests = async (req, res) => {
    try {
        const snapshot = await db.collection('reset_requests')
            .orderBy('createdAt', 'desc')
            .get();
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const approveResetRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const reqRef = db.collection('reset_requests').doc(id);
        const reqSnap = await reqRef.get();
        
        if (!reqSnap.exists) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        
        const reqData = reqSnap.data();
        if (reqData.status !== 'PENDING') {
            return res.status(400).json({ message: 'La solicitud ya fue procesada' });
        }
        
        const companyId = reqData.companyId;
        
        // 1. Delete journal_entries and their details
        const entriesSnapshot = await db.collection('journal_entries')
            .where('companyId', '==', companyId)
            .get();
            
        let batch = db.batch();
        let opsCount = 0;
        
        const commitBatchIfNeeded = async () => {
            if (opsCount >= 450) {
                await batch.commit();
                batch = db.batch();
                opsCount = 0;
            }
        };

        for (const entryDoc of entriesSnapshot.docs) {
            // Get details subcollection
            const detailsSnapshot = await entryDoc.ref.collection('details').get();
            for (const detailDoc of detailsSnapshot.docs) {
                batch.delete(detailDoc.ref);
                opsCount++;
                await commitBatchIfNeeded();
            }
            batch.delete(entryDoc.ref);
            opsCount++;
            await commitBatchIfNeeded();
        }
        
        // 2. Reset accounts balance to 0
        const accountsSnapshot = await db.collection('accounts')
            .where('companyId', '==', companyId)
            .get();
            
        for (const accountDoc of accountsSnapshot.docs) {
            batch.update(accountDoc.ref, { 
                balance: 0,
                updatedAt: new Date().toISOString()
            });
            opsCount++;
            await commitBatchIfNeeded();
        }
        
        // 3. Mark request as APPROVED
        batch.update(reqRef, {
            status: 'APPROVED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: req.user.uid
        });
        
        if (opsCount > 0) {
            await batch.commit();
        }
        
        res.json({ message: 'ERP reiniciado con éxito. Movimientos eliminados y saldos en cero.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectResetRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const reqRef = db.collection('reset_requests').doc(id);
        const reqSnap = await reqRef.get();
        
        if (!reqSnap.exists) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        
        await reqRef.update({
            status: 'REJECTED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: req.user.uid
        });
        
        res.json({ message: 'Solicitud rechazada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    approveUser,
    rejectUser,
    getResetRequests,
    approveResetRequest,
    rejectResetRequest
};

