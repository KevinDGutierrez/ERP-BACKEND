const { db } = require('../config/firebase');

const ACCOUNTS_COLLECTION = 'accounts';

class AccountModel {
    /**
     * Obtiene todas las cuentas del catálogo filtradas por empresa
     */
    static async getAll(companyId) {
        if (!companyId) throw new Error('Se requiere companyId');
        const snapshot = await db.collection(ACCOUNTS_COLLECTION)
            .where('companyId', '==', companyId)
            .orderBy('code')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Busca una cuenta por su código dentro de una empresa específica
     */
    static async getByCode(code, companyId) {
        if (!companyId) throw new Error('Se requiere companyId');
        const snapshot = await db.collection(ACCOUNTS_COLLECTION)
            .where('companyId', '==', companyId)
            .where('code', '==', code)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    /**
     * Busca una cuenta por ID
     */
    static async getById(id) {
        const doc = await db.collection(ACCOUNTS_COLLECTION).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }

    /**
     * Crea una nueva cuenta asociada a una empresa
     */
    static async create(accountData) {
        const { companyId } = accountData;
        if (!companyId) throw new Error('Se requiere companyId para crear cuenta');
        
        const docRef = await db.collection(ACCOUNTS_COLLECTION).add({
            ...accountData,
            balance: 0,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }
}

module.exports = AccountModel;
