const { admin, db } = require('../config/firebase');
const seedAccounts = require('../utils/seed');

async function runMigration() {
    console.log('🚀 Iniciando script de migración para sembrar catálogos de cuentas...');

    try {
        const companiesSnap = await db.collection('companies').get();
        if (companiesSnap.empty) {
            console.log('No se encontraron empresas.');
            process.exit(0);
        }

        console.log(`🏢 Se encontraron ${companiesSnap.size} empresas.`);

        for (const doc of companiesSnap.docs) {
            const companyId = doc.id;
            const companyName = doc.data().name;
            console.log(`\n========================================`);
            console.log(`Empresa: ${companyName} (${companyId})`);
            
            // Ejecutamos la siembra idempotente
            // La función ya revisa cuenta por cuenta y omite duplicados
            await seedAccounts(companyId);
        }

        console.log(`\n✅ Migración completada exitosamente.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error general en la migración:', error);
        process.exit(1);
    }
}

runMigration();
