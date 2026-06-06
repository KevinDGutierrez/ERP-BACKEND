const AccountModel = require('../models/account.model');

// Definición de las 109 cuentas base solicitadas
const INITIAL_ACCOUNTS = [
    // ACTIVOS (Naturaleza: DEUDORA)
    { code: '1.1.01.01', name: 'Caja', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.01.02', name: 'Caja Chica', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.01.03', name: 'Bancos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.01.04', name: 'Caja y Bancos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.01', name: 'Clientes', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.02', name: 'Documentos por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.03', name: 'Cuentas por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.04', name: 'Anticipo a Proveedores', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.02.05', name: 'IVA por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.01', name: 'Inventario de Mercaderías', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.02', name: 'Inventario de Materia Prima', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.03', name: 'Productos en Proceso', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.04', name: 'Productos Terminados', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.03.05', name: 'Mercaderías en Tránsito', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.04.01', name: 'Papelería y Útiles en Existencia', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.04.02', name: 'Suministros en Existencia', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.1.04.03', name: 'Repuestos y Accesorios en Existencia', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.01', name: 'Mobiliario y Equipo', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.02', name: 'Equipo de Computación', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.03', name: 'Vehículos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.04', name: 'Maquinaria', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.05', name: 'Herramientas', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.06', name: 'Edificios', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.07', name: 'Terrenos', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.01.08', name: 'Inmuebles', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.02.01', name: 'Crédito Mercantil', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.02.02', name: 'Marcas y Patentes', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.02.03', name: 'Gastos de Organización', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.02.04', name: 'Gastos de Constitución', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.03.01', name: 'Seguros Pagados por Anticipado', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.03.02', name: 'Alquileres Pagados por Anticipado', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.03.03', name: 'Intereses por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.03.04', name: 'Comisiones por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.03.05', name: 'Dividendos por Cobrar', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.04.01', name: 'Inversiones a Corto Plazo', type: 'ACTIVO', nature: 'DEUDORA' },
    { code: '1.2.04.02', name: 'Inversiones a Largo Plazo', type: 'ACTIVO', nature: 'DEUDORA' },

    // PASIVOS (Naturaleza: ACREEDORA)
    { code: '2.1.01.01', name: 'Proveedores', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.01.02', name: 'Acreedores', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.01.03', name: 'Cuentas por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.01.04', name: 'Documentos por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.01.05', name: 'Préstamos Bancarios', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.2.01.01', name: 'Hipotecas por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.02.01', name: 'IVA por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.03.01', name: 'IGSS por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.03.02', name: 'ISR por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.04.01', name: 'Cuotas Laborales por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.04.02', name: 'Cuotas Patronales por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.05.01', name: 'Sueldos por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.05.02', name: 'Aguinaldo por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.05.03', name: 'Bono 14 por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.06.01', name: 'Intereses por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.06.02', name: 'Comisiones por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.06.03', name: 'Alquileres por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.07.01', name: 'Anticipo de Clientes', type: 'PASIVO', nature: 'ACREEDORA' },
    { code: '2.1.07.02', name: 'Dividendos por Pagar', type: 'PASIVO', nature: 'ACREEDORA' },

    // PATRIMONIO (Naturaleza: ACREEDORA)
    { code: '3.1.01.01', name: 'Capital Social', type: 'CAPITAL', nature: 'ACREEDORA' },
    { code: '3.1.01.02', name: 'Capital Autorizado', type: 'CAPITAL', nature: 'ACREEDORA' },
    { code: '3.1.02.01', name: 'Reserva Legal', type: 'CAPITAL', nature: 'ACREEDORA' },
    { code: '3.1.02.02', name: 'Utilidades Retenidas', type: 'CAPITAL', nature: 'ACREEDORA' },
    { code: '3.2.01.01', name: 'Utilidad del Ejercicio', type: 'CAPITAL', nature: 'ACREEDORA' },
    { code: '3.2.02.01', name: 'Pérdidas Acumuladas', type: 'CAPITAL', nature: 'DEUDORA' }, // Es patrimonio pero resta, por lo tanto DEUDORA
    { code: '3.2.03.01', name: 'Superávit Acumulado', type: 'CAPITAL', nature: 'ACREEDORA' },

    // INGRESOS (Naturaleza: ACREEDORA)
    { code: '4.1.01.01', name: 'Ventas', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.01.02', name: 'Servicios Prestados', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.01', name: 'Comisiones Ganadas', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.02', name: 'Intereses Ganados', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.03', name: 'Alquileres Ganados', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.04', name: 'Dividendos Ganados', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.05', name: 'Donativos Recibidos', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.06', name: 'Ganancia en Venta de Activos', type: 'INGRESO', nature: 'ACREEDORA' },
    { code: '4.1.02.07', name: 'Otros Ingresos', type: 'INGRESO', nature: 'ACREEDORA' },

    // COSTOS Y GASTOS (Naturaleza: DEUDORA)
    { code: '5.1.01.01', name: 'Compras', type: 'COSTO', nature: 'DEUDORA' },
    { code: '5.1.01.02', name: 'Costo de Ventas', type: 'COSTO', nature: 'DEUDORA' },
    { code: '5.1.01.03', name: 'Compras de Materia Prima', type: 'COSTO', nature: 'DEUDORA' },
    { code: '5.1.02.01', name: 'Mano de Obra Directa', type: 'COSTO', nature: 'DEUDORA' },
    { code: '5.1.02.02', name: 'Mano de Obra Indirecta', type: 'COSTO', nature: 'DEUDORA' },
    { code: '6.1.01.01', name: 'Sueldos y Salarios', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.01.02', name: 'Bonificación Incentivo', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.01.03', name: 'Aguinaldos', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.01.04', name: 'Bono 14', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.01.05', name: 'Cuota Patronal IGSS', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.01.06', name: 'Prestaciones Laborales', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.02.01', name: 'Depreciaciones', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.02.02', name: 'Amortizaciones', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.03.01', name: 'Alquileres', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.03.02', name: 'Energía Eléctrica', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.03.03', name: 'Agua', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.03.04', name: 'Teléfono e Internet', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.04.01', name: 'Papelería y Útiles Consumidos', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.04.02', name: 'Combustibles y Lubricantes', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.05.01', name: 'Publicidad', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.05.02', name: 'Propaganda', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.06.01', name: 'Comisiones sobre Ventas', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.06.02', name: 'Fletes sobre Compras', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.07.01', name: 'Reparación y Mantenimiento', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.08.01', name: 'Impuestos y Contribuciones', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.09.01', name: 'Viáticos', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.10.01', name: 'Seguros Vencidos', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.10.02', name: 'Intereses Gasto', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.10.03', name: 'Donativos', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.10.04', name: 'Gastos Generales', type: 'GASTO', nature: 'DEUDORA' },
    { code: '6.1.10.05', name: 'Otros Gastos', type: 'GASTO', nature: 'DEUDORA' },

    // CUENTAS COMPLEMENTARIAS (Naturaleza: ACREEDORA) - Restan a los activos
    { code: '1.2.01.01.DA', name: 'Depreciación Acumulada Mobiliario y Equipo', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.02.DA', name: 'Depreciación Acumulada Equipo de Computación', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.03.DA', name: 'Depreciación Acumulada Vehículos', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.04.DA', name: 'Depreciación Acumulada Maquinaria', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.01.06.DA', name: 'Depreciación Acumulada Edificios', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.2.02.01.AA', name: 'Amortización Acumulada', type: 'ACTIVO', nature: 'ACREEDORA' },
    { code: '1.1.02.01.EA', name: 'Estimación para Cuentas Incobrables', type: 'ACTIVO', nature: 'ACREEDORA' }
];

const seedAccounts = async (companyId) => {
    if (!companyId) {
        console.error('❌ Error en el seed: companyId es requerido.');
        return;
    }

    console.log(`🌱 Iniciando seed de cuentas para empresa: ${companyId}...`);
    
    try {
        const existingAccounts = await AccountModel.getAll(companyId);
        // Crear mapas de códigos y nombres existentes para idempotencia doble
        const existingCodes = new Set(existingAccounts.map(acc => acc.code));
        const existingNames = new Set(existingAccounts.map(acc => (acc.name || '').toLowerCase().trim()));
        
        let createdCount = 0;
        let skippedCount = 0;

        for (const account of INITIAL_ACCOUNTS) {
            // Idempotencia: Verificar por código O por nombre
            if (existingCodes.has(account.code)) {
                skippedCount++;
                continue;
            }
            if (existingNames.has(account.name.toLowerCase().trim())) {
                skippedCount++;
                continue;
            }

            // Si no existe ni por código ni por nombre, crear con balance 0
            await AccountModel.create({ ...account, companyId, balance: 0 });
            createdCount++;
        }

        console.log(`🏁 Seed completado para ${companyId}. Nuevas: ${createdCount}, Omitidas: ${skippedCount}`);
    } catch (error) {
        console.error('❌ Error en el seed:', error.message);
    }
};

module.exports = seedAccounts;

