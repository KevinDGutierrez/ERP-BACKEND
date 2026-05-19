const EntryModel = require('../models/entry.model');
const AccountModel = require('../models/account.model');

class AccountingService {
    /**
     * Valida y crea una partida contable
     */
    static async createEntry(entryData, details) {
        const { companyId } = entryData;
        if (!companyId) throw new Error('Se requiere companyId');

        // 1. Validación de Partida Doble
        const totalDebit = details.reduce((sum, d) => sum + (Number(d.debit) || 0), 0);
        const totalCredit = details.reduce((sum, d) => sum + (Number(d.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error(`La partida no cuadra. Debe: ${totalDebit}, Haber: ${totalCredit}. Diferencia: ${Math.abs(totalDebit - totalCredit)}`);
        }

        if (details.length < 2) {
            throw new Error('Una partida contable debe tener al menos dos movimientos.');
        }

        // 2. Validar que las cuentas existan en ESTA empresa
        for (const detail of details) {
            const account = await AccountModel.getById(detail.accountId);
            if (!account || account.companyId !== companyId) {
                throw new Error(`La cuenta con ID ${detail.accountId} no existe o no pertenece a tu empresa.`);
            }

            // Validación específica para CAJA
            if (account.code === '1.1.01.01') {
                const currentBalance = account.balance || 0;
                const movement = (Number(detail.debit) || 0) - (Number(detail.credit) || 0);
                if (currentBalance + movement < 0) {
                    throw new Error(`Operación rechazada: El saldo de Caja no puede ser negativo.`);
                }
            }

            detail.accountCode = account.code;
            detail.accountName = account.name;
        }

        // 3. Persistir
        return await EntryModel.create(entryData, details);
    }

    static async registerOpeningEntry(companyId, data) {
        const { assets, liabilities, equity, date } = data;
        
        const details = [
            ...assets.map(a => ({ accountId: a.accountId, debit: a.amount, credit: 0 })),
            ...liabilities.map(l => ({ accountId: l.accountId, debit: 0, credit: l.amount })),
            ...equity.map(e => ({ accountId: e.accountId, debit: 0, credit: e.amount }))
        ];

        return await this.createEntry({
            companyId,
            date: date || new Date().toISOString().split('T')[0],
            description: 'Partida de Apertura',
            type: 'APERTURA'
        }, details);
    }

    static async payCreditSale(companyId, data) {
        const { amount, paymentAccountId, clientName } = data;
        const clientAccount = await AccountModel.getByCode('1.1.02.01', companyId);
        
        const details = [
            { accountId: paymentAccountId, debit: amount, credit: 0 },
            { accountId: clientAccount.id, debit: 0, credit: amount }
        ];

        return await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: `Abono de cliente: ${clientName}`,
            type: 'DIARIO'
        }, details);
    }

    static async settleIVA(companyId) {
        const ivaCobrarAcc = await AccountModel.getByCode('1.1.04.01', companyId);
        const ivaPagarAcc = await AccountModel.getByCode('2.1.02.01', companyId);

        const amountToSettle = Math.min(Math.abs(ivaCobrarAcc.balance), Math.abs(ivaPagarAcc.balance));

        const details = [
            { accountId: ivaPagarAcc.id, debit: amountToSettle, credit: 0 },
            { accountId: ivaCobrarAcc.id, debit: 0, credit: amountToSettle }
        ];

        return await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: 'Regularización mensual de IVA',
            type: 'AJUSTE'
        }, details);
    }

    static async registerSale(companyId, saleData) {
        const { total, clientName, isCredit, paymentAccountId, costOfSales = 0 } = saleData;
        const netAmount = total / 1.12;
        const ivaAmount = total - netAmount;

        const salesAccount = await AccountModel.getByCode('4.1.01.01', companyId);
        const ivaAccount = await AccountModel.getByCode('2.1.02.01', companyId);
        const clientAccount = isCredit 
            ? await AccountModel.getByCode('1.1.02.01', companyId)
            : { id: paymentAccountId };

        const entryId = await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: `Venta a ${clientName}`,
            type: 'DIARIO'
        }, [
            { accountId: clientAccount.id, debit: total, credit: 0 },
            { accountId: salesAccount.id, debit: 0, credit: netAmount },
            { accountId: ivaAccount.id, debit: 0, credit: ivaAmount }
        ]);

        if (costOfSales > 0) {
            const costAccount = await AccountModel.getByCode('5.1.01.01', companyId);
            const inventoryAccount = await AccountModel.getByCode('1.1.03.01', companyId);
            await this.createEntry({
                companyId,
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

    static async registerPurchase(companyId, purchaseData) {
        const { total, supplierName, isCredit, paymentAccountId, purchaseType } = purchaseData;
        const netAmount = total / 1.12;
        const ivaAmount = total - netAmount;

        const targetCode = purchaseType === 'INVENTARIO' ? '1.1.03.01' : '5.1.01.01';
        const expenseAccount = await AccountModel.getByCode(targetCode, companyId);
        const ivaAccount = await AccountModel.getByCode('1.1.04.01', companyId);
        const paymentAccount = isCredit 
            ? await AccountModel.getByCode('2.1.01.01', companyId)
            : { id: paymentAccountId };

        return await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: `Compra a ${supplierName}`,
            type: 'DIARIO'
        }, [
            { accountId: expenseAccount.id, debit: netAmount, credit: 0 },
            { accountId: ivaAccount.id, debit: ivaAmount, credit: 0 },
            { accountId: paymentAccount.id, debit: 0, credit: total }
        ]);
    }

    static async registerPayroll(companyId, payrollData) {
        const { grossSalary, employeeName, paymentAccountId } = payrollData;
        const igssLaboral = grossSalary * 0.0483;
        const igssPatronal = grossSalary * 0.1267;
        const prestaciones = grossSalary * 0.2916;

        const salaryAcc = await AccountModel.getByCode('5.2.01.01', companyId);
        const patronalAcc = await AccountModel.getByCode('5.2.01.02', companyId);
        const prestacionesAcc = await AccountModel.getByCode('5.2.01.04', companyId);
        const igssLiabAcc = await AccountModel.getByCode('2.1.03.01', companyId);
        const provAcc = await AccountModel.getByCode('2.1.04.01', companyId);

        return await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: `Nómina: ${employeeName}`,
            type: 'DIARIO'
        }, [
            { accountId: salaryAcc.id, debit: grossSalary, credit: 0 },
            { accountId: patronalAcc.id, debit: igssPatronal, credit: 0 },
            { accountId: prestacionesAcc.id, debit: prestaciones, credit: 0 },
            { accountId: igssLiabAcc.id, debit: 0, credit: igssLaboral + igssPatronal },
            { accountId: provAcc.id, debit: 0, credit: prestaciones },
            { accountId: paymentAccountId, debit: 0, credit: grossSalary - igssLaboral }
        ]);
    }

    static async registerDepreciation(companyId, depreciationData) {
        const { assetType, originalValue, salvageValue = 0 } = depreciationData;
        const rates = { VEHICULO: 0.20, MOBILIARIO: 0.20, COMPUTO: 0.3333 };
        const amount = (originalValue - salvageValue) * (rates[assetType] || 0) / 12;

        const expenseAccount = await AccountModel.getByCode('5.2.01.03', companyId);
        const daCodes = { VEHICULO: '1.2.01.02.DA', MOBILIARIO: '1.2.01.01.DA', COMPUTO: '1.2.01.03.DA' };
        const accAccount = await AccountModel.getByCode(daCodes[assetType], companyId);

        return await this.createEntry({
            companyId,
            date: new Date().toISOString().split('T')[0],
            description: `Depreciación ${assetType}`,
            type: 'AJUSTE'
        }, [
            { accountId: expenseAccount.id, debit: amount, credit: 0 },
            { accountId: accAccount.id, debit: 0, credit: amount }
        ]);
    }

    static async getTrialBalance(companyId) {
        const accounts = await AccountModel.getAll(companyId);
        return {
            date: new Date().toISOString(),
            accounts: accounts.map(a => ({ code: a.code, name: a.name, balance: a.balance, type: a.balance >= 0 ? 'DEUDOR' : 'ACREEDOR' })),
            totals: {
                debe: accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0),
                haber: Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0))
            }
        };
    }

    static async getProfitAndLoss(companyId) {
        const accounts = await AccountModel.getAll(companyId);
        const ing = accounts.filter(a => a.code && a.code.startsWith('4.')).reduce((s, a) => s + Math.abs(a.balance), 0);
        const cos = accounts.filter(a => a.code && a.code.startsWith('5.1.')).reduce((s, a) => s + a.balance, 0);
        const gas = accounts.filter(a => a.code && a.code.startsWith('5.2.')).reduce((s, a) => s + a.balance, 0);
        return {
            resumen: { totalIngresos: ing, totalCostos: cos, totalGastos: gas, utilidadBruta: ing - cos, utilidadNeta: ing - cos - gas }
        };
    }

    static async getBalanceSheet(companyId) {
        const accounts = await AccountModel.getAll(companyId);
        const pl = await this.getProfitAndLoss(companyId);
        const utilidadNeta = pl.resumen.utilidadNeta;

        // Build patrimonio array with explicit "Resultado del Ejercicio" line, excluding any database duplicate
        const patrimonioAccounts = accounts.filter(a => 
            (a.type === 'PATRIMONIO' || a.type === 'CAPITAL') &&
            a.code !== '3.2.01.01' &&
            a.name.toLowerCase() !== 'resultado del ejercicio'
        );
        const patrimonioWithResult = [
            ...patrimonioAccounts,
            {
                id: '_resultado_ejercicio',
                code: '3.2.01.01',
                name: 'Resultado del Ejercicio',
                type: 'CAPITAL',
                nature: 'ACREEDORA',
                balance: utilidadNeta // Positive is profit, negative is loss. Frontend will display accordingly.
            }
        ];

        const totalPatrimonio = patrimonioAccounts.reduce((s, a) => s + Math.abs(a.balance), 0) + utilidadNeta;
        const totalPasivo = accounts.filter(a => a.type === 'PASIVO').reduce((s, a) => s + Math.abs(a.balance), 0);

        return {
            activos: accounts.filter(a => a.type === 'ACTIVO'),
            pasivos: accounts.filter(a => a.type === 'PASIVO'),
            patrimonio: patrimonioWithResult,
            totales: {
                activo: accounts.filter(a => a.type === 'ACTIVO').reduce((s, a) => s + a.balance, 0),
                pasivo: totalPasivo,
                patrimonio: totalPasivo + totalPatrimonio
            }
        };
    }

    static async getAdjustedTrialBalance(companyId) {
        return await this.getTrialBalance(companyId);
    }

    /**
     * Dashboard Summary — returns real financial data for the dashboard
     */
    static async getDashboardSummary(companyId) {
        const accounts = await AccountModel.getAll(companyId);
        const EntryModel = require('../models/entry.model');

        // Current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = now.toISOString().split('T')[0];

        // Totals by account type
        const totalAssets = accounts
            .filter(a => a.type === 'ACTIVO')
            .reduce((s, a) => s + a.balance, 0);
        const totalLiabilities = accounts
            .filter(a => a.type === 'PASIVO')
            .reduce((s, a) => s + Math.abs(a.balance), 0);
        const totalEquityAccounts = accounts
            .filter(a => a.type === 'PATRIMONIO' || a.type === 'CAPITAL')
            .reduce((s, a) => s + Math.abs(a.balance), 0);

        // P&L
        const ingresos = accounts.filter(a => a.code && a.code.startsWith('4.')).reduce((s, a) => s + Math.abs(a.balance), 0);
        const costos = accounts.filter(a => a.code && a.code.startsWith('5.1.')).reduce((s, a) => s + a.balance, 0);
        const gastos = accounts.filter(a => a.code && a.code.startsWith('5.2.')).reduce((s, a) => s + a.balance, 0);
        const netIncome = ingresos - costos - gastos;
        const totalEquity = totalEquityAccounts + netIncome;

        // Inventory balance (look for common inventory account names)
        const inventoryAccount = accounts.find(a =>
            a.name && (a.name.toLowerCase().includes('inventario') || a.name.toLowerCase().includes('mercader'))
        );
        const inventoryBalance = inventoryAccount ? inventoryAccount.balance : 0;

        // Monthly entries for sales/expenses breakdown
        let monthlySales = 0;
        let monthlyExpenses = 0;
        let latestEntries = [];
        let chartData = [];

        try {
            const entries = await EntryModel.getDailyBook(companyId, startOfMonth, endOfMonth);
            
            for (const entry of entries) {
                if (entry.details) {
                    for (const d of entry.details) {
                        // Find the account type for each detail
                        const acc = accounts.find(a => a.id === d.accountId);
                        if (acc) {
                            if (acc.code && acc.code.startsWith('4.')) monthlySales += (d.credit || 0);
                            if (acc.code && (acc.code.startsWith('5.1.') || acc.code.startsWith('5.2.'))) monthlyExpenses += (d.debit || 0);
                        }
                    }
                }
            }

            // Latest 5 entries
            latestEntries = entries.slice(-5).reverse().map(e => ({
                id: e.id,
                date: e.date,
                description: e.description,
                type: e.type,
                total: e.details ? e.details.reduce((s, d) => s + (d.debit || 0), 0) : 0
            }));

            // Chart data: group by day
            const dailyMap = {};
            for (const entry of entries) {
                const day = entry.date;
                if (!dailyMap[day]) dailyMap[day] = { date: day, ingresos: 0, gastos: 0 };
                if (entry.details) {
                    for (const d of entry.details) {
                        const acc = accounts.find(a => a.id === d.accountId);
                        if (acc && acc.code && acc.code.startsWith('4.')) dailyMap[day].ingresos += (d.credit || 0);
                        if (acc && acc.code && (acc.code.startsWith('5.1.') || acc.code.startsWith('5.2.'))) dailyMap[day].gastos += (d.debit || 0);
                    }
                }
            }
            chartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
        } catch (err) {
            console.error('Dashboard chart data error:', err.message);
        }

        return {
            totalAssets,
            totalLiabilities,
            totalEquity,
            monthlySales,
            monthlyExpenses,
            netIncome,
            inventoryBalance,
            latestEntries,
            chartData
        };
    }
}

module.exports = AccountingService;

