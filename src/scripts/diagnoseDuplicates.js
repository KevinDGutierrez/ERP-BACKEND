/**
 * Script de diagnóstico: Busca cuentas duplicadas por nombre dentro de cada empresa
 */
const { db } = require('../config/firebase');

async function diagnose() {
    console.log('🔍 Buscando cuentas duplicadas...\n');

    const companiesSnap = await db.collection('companies').get();

    for (const compDoc of companiesSnap.docs) {
        const companyId = compDoc.id;
        const companyName = compDoc.data().name;
        console.log(`\n========================================`);
        console.log(`Empresa: ${companyName} (${companyId})`);

        const accountsSnap = await db.collection('accounts')
            .where('companyId', '==', companyId)
            .get();

        const accounts = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`Total cuentas: ${accounts.length}`);

        // Buscar duplicados por nombre (case-insensitive)
        const byName = {};
        for (const acc of accounts) {
            const key = (acc.name || '').toLowerCase().trim();
            if (!byName[key]) byName[key] = [];
            byName[key].push(acc);
        }

        const dupesByName = Object.entries(byName).filter(([, v]) => v.length > 1);
        if (dupesByName.length > 0) {
            console.log(`\n⚠️  Duplicados por NOMBRE:`);
            for (const [name, accs] of dupesByName) {
                console.log(`  "${name}":`);
                for (const a of accs) {
                    console.log(`    - code: ${a.code}, balance: ${a.balance || 0}, id: ${a.id}`);
                }
            }
        }

        // Buscar duplicados por código
        const byCode = {};
        for (const acc of accounts) {
            const key = (acc.code || '').trim();
            if (!byCode[key]) byCode[key] = [];
            byCode[key].push(acc);
        }

        const dupesByCode = Object.entries(byCode).filter(([, v]) => v.length > 1);
        if (dupesByCode.length > 0) {
            console.log(`\n⚠️  Duplicados por CÓDIGO:`);
            for (const [code, accs] of dupesByCode) {
                console.log(`  "${code}":`);
                for (const a of accs) {
                    console.log(`    - name: ${a.name}, balance: ${a.balance || 0}, id: ${a.id}`);
                }
            }
        }

        // Listar cuentas que NO están en el nuevo INITIAL_ACCOUNTS (cuentas huérfanas del seed viejo)
        const SEED_CODES = new Set([
            '1.1.01.01','1.1.01.02','1.1.01.03','1.1.01.04',
            '1.1.02.01','1.1.02.02','1.1.02.03','1.1.02.04','1.1.02.05',
            '1.1.03.01','1.1.03.02','1.1.03.03','1.1.03.04','1.1.03.05',
            '1.1.04.01','1.1.04.02','1.1.04.03',
            '1.2.01.01','1.2.01.02','1.2.01.03','1.2.01.04','1.2.01.05','1.2.01.06','1.2.01.07','1.2.01.08',
            '1.2.02.01','1.2.02.02','1.2.02.03','1.2.02.04',
            '1.2.03.01','1.2.03.02','1.2.03.03','1.2.03.04','1.2.03.05',
            '1.2.04.01','1.2.04.02',
            '2.1.01.01','2.1.01.02','2.1.01.03','2.1.01.04','2.1.01.05',
            '2.2.01.01',
            '2.1.02.01','2.1.03.01','2.1.03.02',
            '2.1.04.01','2.1.04.02',
            '2.1.05.01','2.1.05.02','2.1.05.03',
            '2.1.06.01','2.1.06.02','2.1.06.03',
            '2.1.07.01','2.1.07.02',
            '3.1.01.01','3.1.01.02','3.1.02.01','3.1.02.02',
            '3.2.01.01','3.2.02.01','3.2.03.01',
            '4.1.01.01','4.1.01.02',
            '4.1.02.01','4.1.02.02','4.1.02.03','4.1.02.04','4.1.02.05','4.1.02.06','4.1.02.07',
            '5.1.01.01','5.1.01.02','5.1.01.03','5.1.02.01','5.1.02.02',
            '6.1.01.01','6.1.01.02','6.1.01.03','6.1.01.04','6.1.01.05','6.1.01.06',
            '6.1.02.01','6.1.02.02',
            '6.1.03.01','6.1.03.02','6.1.03.03','6.1.03.04',
            '6.1.04.01','6.1.04.02',
            '6.1.05.01','6.1.05.02',
            '6.1.06.01','6.1.06.02',
            '6.1.07.01','6.1.08.01','6.1.09.01',
            '6.1.10.01','6.1.10.02','6.1.10.03','6.1.10.04','6.1.10.05',
            '1.2.01.01.DA','1.2.01.02.DA','1.2.01.03.DA','1.2.01.04.DA','1.2.01.06.DA',
            '1.2.02.01.AA','1.1.02.01.EA'
        ]);

        const orphans = accounts.filter(a => !SEED_CODES.has(a.code));
        if (orphans.length > 0) {
            console.log(`\n🔶 Cuentas NO incluidas en el nuevo catálogo base (posibles restos del seed antiguo o creadas manualmente):`);
            for (const a of orphans) {
                console.log(`    code: ${a.code}, name: ${a.name}, balance: ${a.balance || 0}, id: ${a.id}`);
            }
        }

        if (dupesByName.length === 0 && dupesByCode.length === 0 && orphans.length === 0) {
            console.log('✅ Sin duplicados ni cuentas huérfanas');
        }
    }

    process.exit(0);
}

diagnose().catch(err => { console.error(err); process.exit(1); });
