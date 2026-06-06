const AccountingService = require('./src/services/accounting.service');
const { db } = require('./src/config/firebase');

async function testBalance() {
    try {
        const companyId = 'master_company';
        const pl = await AccountingService.getProfitAndLoss(companyId);
        console.log('\n--- Estado de Resultados ---');
        console.log('Ingresos:', pl.resumen.totalIngresos);
        console.log('Costos:', pl.resumen.totalCostos);
        console.log('Gastos:', pl.resumen.totalGastos);
        console.log('Utilidad Neta:', pl.resumen.utilidadNeta);

        const bs = await AccountingService.getBalanceSheet(companyId);
        console.log('\n--- Balance General ---');
        console.log('TOTAL ACTIVO:', bs.totales.activo);
        console.log('Total Pasivo:', bs.totales.pasivo);
        
        const patrimonioSolo = bs.totales.patrimonio - bs.totales.pasivo;
        console.log('Total Patrimonio:', patrimonioSolo);
        
        console.log('TOTAL PASIVO Y PATRIMONIO:', bs.totales.patrimonio);
        
        console.log('\nDiferencia:', bs.totales.activo - bs.totales.patrimonio);
        
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

testBalance();
