const { db, admin } = require('../config/firebase');

const ENTRIES_COLLECTION = 'journal_entries';

class EntryModel {
    /**
     * Registra una nueva partida contable en una transacción de base de datos
     * para asegurar la integridad de los saldos.
     */
    static async create(entryData, details) {
        const { companyId } = entryData;
        if (!companyId) throw new Error('Se requiere companyId para registrar partida');

        const batch = db.batch();
        const entryRef = db.collection(ENTRIES_COLLECTION).doc();

        // 1. Registrar la cabecera de la partida
        batch.set(entryRef, {
            ...entryData,
            createdAt: new Date().toISOString(),
            status: 'POSTED'
        });

        // 2. Registrar los detalles y actualizar saldos de cuentas
        for (const detail of details) {
            const detailRef = entryRef.collection('details').doc();
            // Denormalizar companyId en detalles para facilitar reportes por collectionGroup
            batch.set(detailRef, { ...detail, companyId });

            const accountRef = db.collection('accounts').doc(detail.accountId);
            const amount = (Number(detail.debit) || 0) - (Number(detail.credit) || 0);
            
            batch.update(accountRef, {
                balance: admin.firestore.FieldValue.increment(amount),
                updatedAt: new Date().toISOString()
            });
        }

        await batch.commit();
        return entryRef.id;
    }

    /**
     * Obtiene el libro diario (partidas en orden cronológico) filtrado por empresa
     */
    static async getDailyBook(companyId, startDate, endDate) {
        if (!companyId) throw new Error('Se requiere companyId');
        
        let query = db.collection(ENTRIES_COLLECTION)
            .where('companyId', '==', companyId)
            .orderBy('date', 'asc');

        if (startDate && endDate) {
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }

        const snapshot = await query.get();
        const entries = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const detailsSnapshot = await doc.ref.collection('details').get();
            const details = detailsSnapshot.docs.map(d => d.data());
            entries.push({ id: doc.id, ...data, details });
        }

        return entries;
    }

    /**
     * Obtiene el Libro Mayor de una cuenta específica filtrado por empresa
     */
    static async getLedgerByAccount(companyId, accountId, accountNature) {
        if (!companyId) throw new Error('Se requiere companyId');

        // Usamos collectionGroup filtrando por companyId denormalizado
        const snapshot = await db.collectionGroup('details')
            .where('companyId', '==', companyId)
            .where('accountId', '==', accountId)
            .get();

        if (snapshot.empty) return [];

        const movements = [];
        for (const doc of snapshot.docs) {
            const detailData = doc.data();
            const entryRef = doc.ref.parent.parent;
            const entrySnapshot = await entryRef.get();
            const entryData = entrySnapshot.data();

            movements.push({
                date: entryData.date,
                description: entryData.description,
                referenceId: entryRef.id,
                debit: detailData.debit || 0,
                credit: detailData.credit || 0
            });
        }

        // Ordenar por fecha
        movements.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calcular saldo acumulado
        let runningBalance = 0;
        return movements.map(m => {
            const movement = m.debit - m.credit;
            runningBalance += (accountNature === 'ACREEDORA' ? -movement : movement);
            return { ...m, balance: runningBalance };
        });
    }
}

module.exports = EntryModel;
