const AccountModel = require('../models/account.model');

const INITIAL_ACCOUNTS = [
    { code: '1.1.01.01', name: 'Caja', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.01.02', name: 'Bancos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.01', name: 'Clientes', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.01', name: 'Inventario de Mercaderías', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.04.01', name: 'IVA por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.01', name: 'Mobiliario y Equipo', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.02', name: 'Vehículos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.03', name: 'Equipo de Cómputo', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.01.DA', name: 'Depreciación Acumulada Mobiliario', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.02.DA', name: 'Depreciación Acumulada Vehículos', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.03.DA', name: 'Depreciación Acumulada Cómputo', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '2.1.01.01', name: 'Proveedores', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.02.01', name: 'IVA por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.03.01', name: 'IGSS por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.04.01', name: 'Provisiones por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '3.1.01.01', name: 'Capital Social', type: 'PATRIMONIO', nature: 'ACREEDORA' },
    { code: '4.1.01.01', name: 'Ventas', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '5.1.01.01', name: 'Costo de Ventas', type: 'GASTO', nature: 'DEUDORA' },
    { code: '5.2.01.01', name: 'Sueldos y Salarios', type: 'GASTO', nature: 'DEUDORA' },
    { code: '5.2.01.02', name: 'Cuota Patronal IGSS', type: 'GASTO', nature: 'DEUDORA' },
    { code: '5.2.01.03', name: 'Depreciaciones', type: 'GASTO', nature: 'DEUDORA' },
    { code: '5.2.01.04', name: 'Prestaciones Laborales', type: 'GASTO', nature: 'DEUDORA' }
];

const seedAccounts = async () => {
    console.log('🌱 Iniciando seed de cuentas contables...');
    
    try {
        const existingAccounts = await AccountModel.getAll();
        
        if (existingAccounts.length > 0) {
            console.log('⚠️ El catálogo de cuentas ya tiene datos. Omitiendo seed.');
            return;
        }

        for (const account of INITIAL_ACCOUNTS) {
            await AccountModel.create(account);
            console.log(`✅ Cuenta creada: ${account.code} - ${account.name}`);
        }

        console.log('🏁 Seed completado exitosamente.');
    } catch (error) {
        console.error('❌ Error en el seed:', error.message);
    }
};

module.exports = seedAccounts;
