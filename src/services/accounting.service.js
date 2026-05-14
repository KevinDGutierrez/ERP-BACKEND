const EntryModel = require('../models/entry.model');
const AccountModel = require('../models/account.model');

class AccountingService {
    /**
     * Valida y crea una partida contable
     */
    static async createEntry(entryData, details) {
        // 1. Validación de Partida Doble
        const totalDebit = details.reduce((sum, d) => sum + (Number(d.debit) || 0), 0);
        const totalCredit = details.reduce((sum, d) => sum + (Number(d.credit) || 0), 0);

        // Usamos un pequeño margen de error para decimales (floating point)
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`La partida no cuadra. Debe: ${totalDebit}, Haber: ${totalCredit}. Diferencia: ${Math.abs(totalDebit - totalCredit)}`);
        }

        if (details.length < 2) {
            throw new Error('Una partida contable debe tener al menos dos movimientos.');
        }

        // 2. Validar que las cuentas existan y verificar saldo de Caja
        const cajaAccount = await AccountModel.getByCode('1.1.01.01');
        
        for (const detail of details) {
            const account = await AccountModel.getById(detail.accountId);
            if (!account) {
                throw new Error(`La cuenta con ID ${detail.accountId} no existe.`);
            }

            // Validación específica para CAJA (No permitir saldo negativo)
            if (account.code === '1.1.01.01') {
                const currentBalance = account.balance || 0;
                const movement = (Number(detail.debit) || 0) - (Number(detail.credit) || 0);
                if (currentBalance + movement < 0) {
                    throw new Error(`Operación rechazada: El saldo de Caja no puede ser negativo. Saldo actual: Q${currentBalance.toFixed(2)}, Movimiento: Q${movement.toFixed(2)}`);
                }
            }

            // Enriquecer el detalle con información de la cuenta
            detail.accountCode = account.code;
            detail.accountName = account.name;
        }

        // 3. Persistir en base de datos
        return await EntryModel.create(entryData, details);
    }

    /**
     * Registra la Partida de Apertura
     * Valida Activo = Pasivo + Patrimonio
     */
    static async registerOpeningEntry(data) {
        const { assets, liabilities, equity, date } = data;
        
        const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
        const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
        const totalEquity = equity.reduce((s, e) => s + e.amount, 0);

        if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01) {
            throw new Error(`Desequilibrio patrimonial: Activos (${totalAssets}) != Pasivo + Capital (${totalLiabilities + totalEquity})`);
        }

        const details = [
            ...assets.map(a => ({ accountId: a.accountId, debit: a.amount, credit: 0 })),
            ...liabilities.map(l => ({ accountId: l.accountId, debit: 0, credit: l.amount })),
            ...equity.map(e => ({ accountId: e.accountId, debit: 0, credit: e.amount }))
        ];

        return await this.createEntry({
            date: date || new Date().toISOString().split('T')[0],
            description: 'Partida de Apertura - Inicio de Operaciones',
            type: 'APERTURA'
        }, details);
    }

    /**
     * Registra el cobro de una venta al crédito
     */
    static async payCreditSale(data) {
        const { amount, paymentAccountId, clientName } = data;
        
        const clientAccount = await AccountModel.getByCode('1.1.02.01'); // Clientes
        if (clientAccount.balance < amount) {
            throw new Error(`El pago (Q${amount}) excede el saldo pendiente del cliente (Q${clientAccount.balance})`);
        }

        const details = [
            { accountId: paymentAccountId, debit: amount, credit: 0 },
            { accountId: clientAccount.id, debit: 0, credit: amount }
        ];

        return await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Abono de cliente: ${clientName}`,
            type: 'DIARIO'
        }, details);
    }

    /**
     * Regularización de IVA (Liquidación mensual)
     */
    static async settleIVA() {
        const ivaCobrarAcc = await AccountModel.getByCode('1.1.04.01');
        const ivaPagarAcc = await AccountModel.getByCode('2.1.02.01');

        const ivaCobrar = Math.abs(ivaCobrarAcc.balance);
        const ivaPagar = Math.abs(ivaPagarAcc.balance);

        const amountToSettle = Math.min(ivaCobrar, ivaPagar);
        if (amountToSettle === 0) throw new Error('No hay saldo de IVA para regularizar');

        const details = [
            { accountId: ivaPagarAcc.id, debit: amountToSettle, credit: 0 },
            { accountId: ivaCobrarAcc.id, debit: 0, credit: amountToSettle }
        ];

        return await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: 'Regularización mensual de IVA',
            type: 'AJUSTE'
        }, details);
    }

    /**
     * Registra una Venta (Contado o Crédito)
     * Ahora incluye registro opcional del costo de ventas
     */
    static async registerSale(saleData) {
        const { total, clientName, isCredit, paymentAccountId, costOfSales = 0 } = saleData;
        const netAmount = total / 1.12;
        const ivaAmount = total - netAmount;

        // Cuentas involucradas
        const salesAccount = await AccountModel.getByCode('4.1.01.01');
        const ivaAccount = await AccountModel.getByCode('2.1.02.01');
        const clientAccount = isCredit 
            ? await AccountModel.getByCode('1.1.02.01')
            : { id: paymentAccountId };

        const details = [
            { accountId: clientAccount.id, debit: total, credit: 0 },
            { accountId: salesAccount.id, debit: 0, credit: netAmount },
            { accountId: ivaAccount.id, debit: 0, credit: ivaAmount }
        ];

        const entryId = await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Venta a ${clientName} (${isCredit ? 'Crédito' : 'Contado'})`,
            type: 'DIARIO'
        }, details);

        // Registro automático del Costo de Ventas si se proporciona
        if (costOfSales > 0) {
            const costAccount = await AccountModel.getByCode('5.1.01.01');
            const inventoryAccount = await AccountModel.getByCode('1.1.03.01');
            
            await this.createEntry({
                date: new Date().toISOString().split('T')[0],
                description: `Costo de ventas - Venta a ${clientName}`,
                type: 'DIARIO'
            }, [
                { accountId: costAccount.id, debit: costOfSales, credit: 0 },
                { accountId: inventoryAccount.id, debit: 0, credit: costOfSales }
            ]);
        }

        return entryId;
    }

    /**
     * Registra una Compra (Mercadería o Gasto)
     */
    static async registerPurchase(purchaseData) {
        const { total, supplierName, isCredit, paymentAccountId, purchaseType } = purchaseData;
        const netAmount = total / 1.12;
        const ivaAmount = total - netAmount;

        // Cuentas involucradas
        const targetAccountCode = purchaseType === 'INVENTARIO' ? '1.1.03.01' : '5.1.01.01';
        const expenseAccount = await AccountModel.getByCode(targetAccountCode);
        const ivaAccount = await AccountModel.getByCode('1.1.04.01'); // IVA por Cobrar
        const paymentAccount = isCredit 
            ? await AccountModel.getByCode('2.1.01.01') // Proveedores
            : { id: paymentAccountId };

        const details = [
            { accountId: expenseAccount.id, debit: netAmount, credit: 0 },
            { accountId: ivaAccount.id, debit: ivaAmount, credit: 0 },
            { accountId: paymentAccount.id, debit: 0, credit: total }
        ];

        return await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Compra a ${supplierName} (${isCredit ? 'Crédito' : 'Contado'})`,
            type: 'DIARIO'
        }, details);
    }

    /**
     * Registra el pago de Nómina/Sueldos
     * Incluye cálculo de IGSS Laboral (4.83%), Patronal (12.67%) y Provisiones (29.16%)
     */
    static async registerPayroll(payrollData) {
        const { grossSalary, employeeName, paymentAccountId } = payrollData;
        
        const igssLaboralRate = 0.0483;
        const igssPatronalRate = 0.1267;
        const prestacionesRate = 0.2916; // 8.33% * 3 + 4.17%

        const igssLaboral = grossSalary * igssLaboralRate;
        const igssPatronal = grossSalary * igssPatronalRate;
        const prestaciones = grossSalary * prestacionesRate;
        const netSalary = grossSalary - igssLaboral;

        // Cuentas involucradas
        const salaryAccount = await AccountModel.getByCode('5.2.01.01'); // Sueldos
        const patronalAccount = await AccountModel.getByCode('5.2.01.02'); // Cuota Patronal
        const prestacionesExpAccount = await AccountModel.getByCode('5.2.01.04'); // Prestaciones (Gasto)
        
        const igssLiabilityAccount = await AccountModel.getByCode('2.1.03.01'); // IGSS por Pagar
        const provAccount = await AccountModel.getByCode('2.1.04.01'); // Provisiones por Pagar
        const paymentAccount = { id: paymentAccountId };

        const details = [
            { accountId: salaryAccount.id, debit: grossSalary, credit: 0 },
            { accountId: patronalAccount.id, debit: igssPatronal, credit: 0 },
            { accountId: prestacionesExpAccount.id, debit: prestaciones, credit: 0 },
            { accountId: igssLiabilityAccount.id, debit: 0, credit: igssLaboral + igssPatronal },
            { accountId: provAccount.id, debit: 0, credit: prestaciones },
            { accountId: paymentAccount.id, debit: 0, credit: netSalary }
        ];

        return await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Pago de sueldo y provisión de prestaciones: ${employeeName}`,
            type: 'DIARIO'
        }, details);
    }

    /**
     * Registra la depreciación de un activo fijo
     */
    static async registerDepreciation(depreciationData) {
        const { assetType, originalValue, salvageValue = 0 } = depreciationData;
        
        const rates = {
            'VEHICULO': 0.20,
            'MOBILIARIO': 0.20,
            'COMPUTO': 0.3333,
            'HERRAMIENTAS': 0.25
        };

        const rate = rates[assetType];
        if (!rate) throw new Error('Tipo de activo no válido para depreciación');

        // Cálculo anual prorrateado mensualmente
        const annualDepreciation = (originalValue - salvageValue) * rate;
        const monthlyDepreciation = annualDepreciation / 12;

        // Cuentas involucradas
        const expenseAccount = await AccountModel.getByCode('5.2.01.03'); // Depreciaciones (Gasto)
        
        const daCodes = {
            'VEHICULO': '1.2.01.02.DA',
            'MOBILIARIO': '1.2.01.01.DA',
            'COMPUTO': '1.2.01.03.DA'
        };
        const accumulatedAccount = await AccountModel.getByCode(daCodes[assetType]);

        const details = [
            { accountId: expenseAccount.id, debit: monthlyDepreciation, credit: 0 },
            { accountId: accumulatedAccount.id, debit: 0, credit: monthlyDepreciation }
        ];

        return await this.createEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Depreciación mensual de ${assetType}`,
            type: 'AJUSTE'
        }, details);
    }

    /**
     * Genera el Balance de Saldos
     */
    static async getTrialBalance() {
        const accounts = await AccountModel.getAll();
        
        const deudores = accounts.filter(a => a.balance > 0);
        const acreedores = accounts.filter(a => a.balance < 0);
        
        return {
            date: new Date().toISOString(),
            accounts: accounts.map(a => ({
                code: a.code,
                name: a.name,
                balance: a.balance,
                type: a.balance >= 0 ? 'DEUDOR' : 'ACREEDOR'
            })),
            totals: {
                debe: accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0),
                haber: Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0))
            }
        };
    }

    /**
     * Genera el Estado de Resultados
     */
    static async getProfitAndLoss() {
        const accounts = await AccountModel.getAll();
        
        const ingresos = accounts.filter(a => a.type === 'INGRESO');
        const costos = accounts.filter(a => a.type === 'COSTO');
        const gastos = accounts.filter(a => a.type === 'GASTO');

        const totalIngresos = ingresos.reduce((s, a) => s + Math.abs(a.balance), 0);
        const totalCostos = costos.reduce((s, a) => s + a.balance, 0);
        const totalGastos = gastos.reduce((s, a) => s + a.balance, 0);

        const utilidadBruta = totalIngresos - totalCostos;
        const utilidadNeta = utilidadBruta - totalGastos;

        return {
            ingresos,
            costos,
            gastos,
            resumen: {
                totalIngresos,
                totalCostos,
                totalGastos,
                utilidadBruta,
                utilidadNeta
            }
        };
    }

    /**
     * Genera el Balance General
     */
    static async getBalanceSheet() {
        const accounts = await AccountModel.getAll();
        
        const activos = accounts.filter(a => a.type === 'ACTIVO');
        const pasivos = accounts.filter(a => a.type === 'PASIVO');
        const patrimonio = accounts.filter(a => a.type === 'PATRIMONIO');

        const totalActivo = activos.reduce((s, a) => s + a.balance, 0);
        const totalPasivo = pasivos.reduce((s, a) => s + Math.abs(a.balance), 0);
        const totalPatrimonio = patrimonio.reduce((s, a) => s + Math.abs(a.balance), 0);

        // La utilidad neta del periodo debe sumarse al patrimonio
        const pl = await this.getProfitAndLoss();
        const utilidadPeriodo = pl.resumen.utilidadNeta;

        return {
            activos,
            pasivos,
            patrimonio,
            totales: {
                activo: totalActivo,
                pasivo: totalPasivo,
                patrimonio: totalPatrimonio + utilidadPeriodo,
                pasivoMasPatrimonio: totalPasivo + totalPatrimonio + utilidadPeriodo
            }
        };
    }

    /**
     * Genera el Balance de Saldos Ajustado
     * (Incluye todas las partidas incluyendo las de tipo AJUSTE)
     */
    static async getAdjustedTrialBalance() {
        // En esta implementación, el balance de saldos siempre refleja el estado actual.
        // Podríamos filtrar o separar, pero para fines del proyecto, el balance 
        // después de correr las depreciaciones y liquidación de IVA es el "Ajustado".
        return await this.getTrialBalance();
    }
}

module.exports = AccountingService;
