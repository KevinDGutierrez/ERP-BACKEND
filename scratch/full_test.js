const AccountingService = require('../src/services/accounting.service');
const AccountModel = require('../src/models/account.model');
const EntryModel = require('../src/models/entry.model');
const seedAccounts = require('../src/utils/seed');
const { db } = require('../src/config/firebase');

async function runFullAccountingTest() {
    console.log('🧪 Iniciando prueba integral del ciclo contable...');

    try {
        // 0. Limpiar colecciones para prueba limpia (OPCIONAL - solo para esta prueba)
        // Nota: En un entorno real esto no se hace. Aquí lo hacemos para ver los saldos exactos de la prueba.
        const collections = ['accounts', 'journal_entries'];
        for (const col of collections) {
            const snapshot = await db.collection(col).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        console.log('🧹 Base de datos de prueba limpiada.');

        // 0.1 Seed
        await seedAccounts();
        const accounts = await AccountModel.getAll();
        const findId = (code) => accounts.find(a => a.code === code).id;

        // 1. Partida de Apertura
        console.log('\n1. Registrando Partida de Apertura...');
        await AccountingService.registerOpeningEntry({
            assets: [
                { accountId: findId('1.1.01.01'), amount: 10000 }, // Caja
                { accountId: findId('1.1.03.01'), amount: 5000 },  // Mercaderías
                { accountId: findId('1.2.01.01'), amount: 2000 }   // Mobiliario
            ],
            liabilities: [
                { accountId: findId('2.1.01.01'), amount: 2000 }   // Proveedores
            ],
            equity: [
                { accountId: findId('3.1.01.01'), amount: 15000 }  // Capital
            ]
        });

        // 2. Compra de mercadería al contado
        console.log('2. Registrando Compra al Contado...');
        await AccountingService.registerPurchase({
            total: 1120,
            supplierName: 'Distribuidora Global',
            isCredit: false,
            paymentAccountId: findId('1.1.01.01'), // Pagado con Caja
            purchaseType: 'INVENTARIO'
        });

        // 3. Venta al contado con costo de venta
        console.log('3. Registrando Venta al Contado con Costo de Venta...');
        await AccountingService.registerSale({
            total: 2240,
            clientName: 'Juan Pérez',
            isCredit: false,
            paymentAccountId: findId('1.1.01.01'),
            costOfSales: 1000
        });

        // 4. Venta al crédito con costo de venta
        console.log('4. Registrando Venta al Crédito...');
        await AccountingService.registerSale({
            total: 1120,
            clientName: 'Empresa Tech',
            isCredit: true,
            costOfSales: 500
        });

        // 5. Cobro de venta al crédito (abono parcial)
        console.log('5. Registrando Abono de Cliente...');
        await AccountingService.payCreditSale({
            amount: 500,
            paymentAccountId: findId('1.1.01.02'), // Depositado en Bancos
            clientName: 'Empresa Tech'
        });

        // 6. Registro de Nómina
        console.log('6. Registrando Nómina del Mes...');
        await AccountingService.registerPayroll({
            grossSalary: 5000,
            employeeName: 'Carlos López',
            paymentAccountId: findId('1.1.01.02') // Pagado con Bancos
        });

        // 7. Registro de Depreciaciones (Mobiliario)
        console.log('7. Registrando Depreciaciones...');
        await AccountingService.registerDepreciation({
            assetType: 'MOBILIARIO',
            originalValue: 2000
        });

        // 8. Regularización de IVA
        console.log('8. Registrando Regularización de IVA...');
        await AccountingService.settleIVA();

        // --- GENERACIÓN DE REPORTES ---
        console.log('\n📊 GENERANDO REPORTES FINALES...');

        const dailyBook = await EntryModel.getDailyBook();
        const trialBalance = await AccountingService.getTrialBalance();
        const pl = await AccountingService.getProfitAndLoss();
        const bs = await AccountingService.getBalanceSheet();

        console.log('\n--- RESUMEN DE RESULTADOS ---');
        console.log(`Total Partidas Generadas: ${dailyBook.length}`);
        console.log(`Utilidad Neta del Periodo: Q${pl.resumen.utilidadNeta.toFixed(2)}`);
        console.log(`Total Activo: Q${bs.totales.activo.toFixed(2)}`);
        console.log(`Total Pasivo + Capital: Q${bs.totales.pasivoMasPatrimonio.toFixed(2)}`);

        if (Math.abs(bs.totales.activo - bs.totales.pasivoMasPatrimonio) < 0.01) {
            console.log('\n✅ EL BALANCE GENERAL CUADRA PERFECTAMENTE.');
        } else {
            console.error('\n❌ ERROR: El balance no cuadra.');
        }

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

runFullAccountingTest();
