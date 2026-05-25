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
        
        // Filtramos solo por companyId en Firestore para evitar la necesidad de un índice compuesto
        const query = db.collection(ENTRIES_COLLECTION)
            .where('companyId', '==', companyId);

        const snapshot = await query.get();
        let entries = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            
            // Filtrado manual por fecha en memoria
            if (startDate && new Date(data.date) < new Date(startDate)) continue;
            if (endDate && new Date(data.date) > new Date(endDate)) continue;

            const detailsSnapshot = await docSnap.ref.collection('details').get();
            const details = detailsSnapshot.docs.map(d => d.data());
            entries.push({ id: docSnap.id, ...data, details });
        }

        // Ordenar por fecha ascendentemente en memoria
        entries.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });

        return entries;
    }

    /**
     * Obtiene el Libro Mayor de una cuenta específica filtrado por empresa y rango de fechas.
     * Usa el mismo patrón que getDailyBook para evitar necesidad de índice compuesto en collectionGroup.
     */
    static async getLedgerByAccount(companyId, accountId, accountNature, startDate, endDate) {
        if (!companyId) throw new Error('Se requiere companyId');

        // Obtener todas las partidas de la empresa (mismo approach que getDailyBook)
        const entriesSnapshot = await db.collection(ENTRIES_COLLECTION)
            .where('companyId', '==', companyId)
            .get();

        if (entriesSnapshot.empty) return [];

        const movements = [];

        for (const entryDoc of entriesSnapshot.docs) {
            const entryData = entryDoc.data();

            // Filtrado por fecha
            if (startDate && new Date(entryData.date) < new Date(startDate)) continue;
            if (endDate && new Date(entryData.date) > new Date(endDate)) continue;

            // Obtener detalles de esta partida
            const detailsSnapshot = await entryDoc.ref.collection('details').get();

            for (const detailDoc of detailsSnapshot.docs) {
                const detailData = detailDoc.data();

                // Solo incluir movimientos de la cuenta solicitada
                if (detailData.accountId !== accountId) continue;

                movements.push({
                    date: entryData.date,
                    createdAt: entryData.createdAt,
                    description: entryData.description,
                    type: entryData.type || '',
                    referenceId: entryDoc.id,
                    debit: detailData.debit || 0,
                    credit: detailData.credit || 0
                });
            }
        }

        // Ordenar por fecha
        movements.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });

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
