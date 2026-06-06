const { db } = require('../config/firebase');

async function findOldAccounts() {
    const s = await db.collection('accounts').where('companyId', '==', 'master_company').get();
    const accs = s.docs.map(d => ({ id: d.id, ...d.data() }));

    // Cuentas del seed viejo con códigos genéricos
    const oldCodes = ['1', '1.1', '1.1.01', '2', '2.1', '3', '4', '5'];
    const oldStyle = accs.filter(a => oldCodes.includes(a.code));
    console.log('=== Cuentas del seed ANTIGUO (categorías genéricas) ===');
    for (const a of oldStyle) {
        console.log(`  code: ${a.code} | name: ${a.name} | balance: ${a.balance} | id: ${a.id}`);
    }

    // Cuentas con prefijo 5.2 (del viejo seed, ahora en 6.1)
    const old52 = accs.filter(a => a.code && a.code.startsWith('5.2.'));
    console.log('\n=== Cuentas con código 5.2.xx (viejo seed de gastos) ===');
    for (const a of old52) {
        console.log(`  code: ${a.code} | name: ${a.name} | balance: ${a.balance} | id: ${a.id}`);
    }

    // Cuentas con balance != 0
    const withBalance = accs.filter(a => a.balance !== 0 && a.balance !== undefined);
    console.log('\n=== Todas las cuentas con balance != 0 ===');
    for (const a of withBalance) {
        console.log(`  code: ${a.code} | name: ${a.name} | balance: ${a.balance} | id: ${a.id}`);
    }

    // Cuenta 1.1.01.02 que dice Bancos con balance 10000 vs 1.1.01.03 Bancos con 0
    const bancos = accs.filter(a => (a.name || '').toLowerCase().includes('banco'));
    console.log('\n=== Cuentas con "banco" en el nombre ===');
    for (const a of bancos) {
        console.log(`  code: ${a.code} | name: ${a.name} | balance: ${a.balance} | id: ${a.id}`);
    }

    process.exit(0);
}

findOldAccounts().catch(e => { console.error(e); process.exit(1); });
