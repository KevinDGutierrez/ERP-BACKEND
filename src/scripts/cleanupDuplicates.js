/**
 * Script de limpieza: Elimina cuentas duplicadas por nombre, conservando
 * siempre la que tiene balance != 0 o la más antigua si ambas tienen 0.
 * 
 * REGLAS:
 * - Nunca borrar una cuenta con balance != 0
 * - Nunca borrar una cuenta que tenga movimientos en journal_entries
 * - Solo borrar duplicados exactos por nombre (case-insensitive)
 * - Solo aplica a master_company (la única afectada)
 */
const { db } = require('../config/firebase');

async function hasMovements(accountId, companyId) {
    // Revisar si algún detalle de partida referencia esta cuenta
    const entries = await db.collection('journal_entries')
        .where('companyId', '==', companyId)
        .get();
    
    for (const entry of entries.docs) {
        const details = await entry.ref.collection('details').get();
        for (const detail of details.docs) {
            if (detail.data().accountId === accountId) {
                return true;
            }
        }
    }
    return false;
}

async function cleanup() {
    const companyId = 'master_company';
    console.log('🧹 Iniciando limpieza de duplicados para master_company...\n');

    const snap = await db.collection('accounts').where('companyId', '==', companyId).get();
    const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Agrupar por nombre (case-insensitive)
    const byName = {};
    for (const acc of accounts) {
        const key = (acc.name || '').toLowerCase().trim();
        if (!byName[key]) byName[key] = [];
        byName[key].push(acc);
    }

    const dupes = Object.entries(byName).filter(([, v]) => v.length > 1);
    let deletedCount = 0;

    for (const [name, accs] of dupes) {
        console.log(`\n🔍 Duplicado: "${name}" (${accs.length} cuentas)`);

        // Identificar cuáles tienen balance o movimientos
        for (const acc of accs) {
            acc._hasMovements = await hasMovements(acc.id, companyId);
            console.log(`  - code: ${acc.code}, balance: ${acc.balance || 0}, movimientos: ${acc._hasMovements ? 'SÍ' : 'NO'}, id: ${acc.id}`);
        }

        // Decidir cuál conservar: la que tiene balance != 0 o movimientos
        const withActivity = accs.filter(a => (a.balance !== 0 && a.balance !== undefined) || a._hasMovements);
        const withoutActivity = accs.filter(a => (a.balance === 0 || a.balance === undefined) && !a._hasMovements);

        if (withActivity.length >= 1) {
            // Conservar las activas, borrar las inactivas
            for (const toDelete of withoutActivity) {
                console.log(`  ❌ ELIMINANDO: code ${toDelete.code} (balance: ${toDelete.balance || 0}, sin movimientos)`);
                await db.collection('accounts').doc(toDelete.id).delete();
                deletedCount++;
            }
            console.log(`  ✅ CONSERVANDO: code ${withActivity.map(a => a.code).join(', ')}`);
        } else {
            // Ambas tienen balance 0 y sin movimientos → conservar la primera (por código más bajo), borrar el resto
            accs.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
            const keep = accs[0];
            console.log(`  ✅ CONSERVANDO: code ${keep.code} (primera por código)`);
            for (let i = 1; i < accs.length; i++) {
                console.log(`  ❌ ELIMINANDO: code ${accs[i].code} (duplicado sin actividad)`);
                await db.collection('accounts').doc(accs[i].id).delete();
                deletedCount++;
            }
        }
    }

    console.log(`\n🏁 Limpieza completada. Cuentas eliminadas: ${deletedCount}`);

    // Verificar conteo final
    const finalSnap = await db.collection('accounts').where('companyId', '==', companyId).get();
    console.log(`📊 Total cuentas restantes en master_company: ${finalSnap.size}`);
    
    process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
