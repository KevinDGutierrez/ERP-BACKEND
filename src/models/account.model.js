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
     * Genera el siguiente código disponible para una subcuenta
     */
    static async generateNextCode(companyId, type, parentId = null) {
        let parentCode = '';
        if (parentId) {
            const parent = await this.getById(parentId);
            if (parent) parentCode = parent.code;
        } else {
            const baseCodes = {
                'ACTIVO': '1',
                'PASIVO': '2',
                'PATRIMONIO': '3',
                'CAPITAL': '3',
                'INGRESO': '4',
                'COSTO': '5',
                'GASTO': '6'
            };
            if (!type) throw new Error('El tipo de cuenta es requerido para generar código automáticamente');
            parentCode = baseCodes[type.toUpperCase().replace(/S$/, '')] || '9';
        }

        // Buscar cuentas de la empresa para evitar el error de índice compuesto de Firestore
        const snapshot = await db.collection(ACCOUNTS_COLLECTION)
            .where('companyId', '==', companyId)
            .get();

        const siblings = snapshot.docs
            .map(doc => doc.data().code)
            .filter(code => {
                if (!code || !code.startsWith(parentCode + '.')) return false;
                const parentSegments = parentCode.split('.').length;
                const segments = code.split('.').length;
                return segments === parentSegments + 1;
            });

        if (siblings.length === 0) {
            return `${parentCode}.01`;
        }

        // Obtener el último segmento más alto
        const lastSegments = siblings.map(code => {
            const parts = code.split('.');
            return parseInt(parts[parts.length - 1]);
        });

        const nextNumber = Math.max(...lastSegments) + 1;
        const formattedNumber = nextNumber.toString().padStart(2, '0');
        
        return `${parentCode}.${formattedNumber}`;
    }

    /**
     * Crea una nueva cuenta asociada a una empresa
     */
    static async create(accountData) {
        const { companyId, type, parentId } = accountData;
        if (!companyId) throw new Error('Se requiere companyId para crear cuenta');
        
        let { code } = accountData;
        
        // Si no viene código, lo generamos automáticamente
        if (!code) {
            code = await this.generateNextCode(companyId, type, parentId);
        }

        const docRef = await db.collection(ACCOUNTS_COLLECTION).add({
            ...accountData,
            code,
            balance: 0,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    }

    static async seed(companyId) {
        const seedAccounts = require('../utils/seed');
        return await seedAccounts(companyId);
    }
}

module.exports = AccountModel;
