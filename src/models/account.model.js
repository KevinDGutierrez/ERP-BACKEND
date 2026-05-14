const { db } = require('../config/firebase');

const ACCOUNTS_COLLECTION = 'accounts';

class AccountModel {
    /**
     * Obtiene todas las cuentas del catálogo filtradas por empresa
     */
    static async getAll(companyId) {
        if (!companyId) throw new Error('Se requiere companyId');
        
        // Obtenemos las cuentas filtradas por empresa
        const snapshot = await db.collection(ACCOUNTS_COLLECTION)
            .where('companyId', '==', companyId)
            .get();
        
        // Mapeamos los datos
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ordenamos en memoria para evitar el error de "index required" de Firestore temporalmente
        // Nota: Es recomendable crear el índice compuesto en la consola de Firebase para mejor rendimiento.
        return accounts.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
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

    /**
     * Semilla de catálogo base para nuevas empresas
     */
    static async seed(companyId) {
        const defaultAccounts = [
            { code: '1', name: 'ACTIVO', type: 'ACTIVO', nature: 'DEUDORA', level: 1 },
            { code: '1.1', name: 'ACTIVO CORRIENTE', type: 'ACTIVO', nature: 'DEUDORA', level: 2 },
            { code: '1.1.01', name: 'Caja y Bancos', type: 'ACTIVO', nature: 'DEUDORA', level: 3 },
            { code: '1.1.01.01', name: 'Caja General', type: 'ACTIVO', nature: 'DEUDORA', level: 4 },
            { code: '2', name: 'PASIVO', type: 'PASIVO', nature: 'ACREEDORA', level: 1 },
            { code: '2.1', name: 'PASIVO CORRIENTE', type: 'PASIVO', nature: 'ACREEDORA', level: 2 },
            { code: '3', name: 'PATRIMONIO', type: 'PATRIMONIO', nature: 'ACREEDORA', level: 1 },
            { code: '4', name: 'INGRESOS', type: 'INGRESO', nature: 'ACREEDORA', level: 1 },
            { code: '5', name: 'GASTOS', type: 'GASTO', nature: 'DEUDORA', level: 1 },
        ];

        const batch = db.batch();
        defaultAccounts.forEach(acc => {
            const ref = db.collection(ACCOUNTS_COLLECTION).doc();
            batch.set(ref, {
                ...acc,
                companyId,
                balance: 0,
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();
        return true;
    }
}

module.exports = AccountModel;
