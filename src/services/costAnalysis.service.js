/**
 * Cost Analysis Calculation Service
 * Centralizes all cost accounting formulas for Absorption and Variable (Direct) Costing,
 * variance calculations, and theoretical profit reconciliation.
 */

class CostAnalysisService {
    /**
     * Valida y sanitiza los parámetros de entrada del modelo de costos.
     * @param {Object} rawInputs - Parámetros recibidos
     * @returns {Object} inputs sanitizados
     */
    static sanitizeAndValidateInputs(rawInputs = {}) {
        const normalCapacity = Number(rawInputs.normalCapacity) || 0;
        const actualProduction = Number(rawInputs.actualProduction) || 0;
        const unitsSold = Number(rawInputs.unitsSold) || 0;
        const unitSalePrice = Number(rawInputs.unitSalePrice) || 0;

        const variableCosts = {
            directMaterials: Number(rawInputs.variableCosts?.directMaterials) || 0,
            directLabor: Number(rawInputs.variableCosts?.directLabor) || 0,
            variableManufacturingOverhead: Number(rawInputs.variableCosts?.variableManufacturingOverhead) || 0,
            variableSelling: Number(rawInputs.variableCosts?.variableSelling) || 0,
        };

        const fixedCosts = {
            manufacturing: Number(rawInputs.fixedCosts?.manufacturing) || 0,
            administration: Number(rawInputs.fixedCosts?.administration) || 0,
        };

        // Validaciones numéricas básicas
        if (normalCapacity <= 0) {
            throw new Error('La capacidad normal debe ser mayor que cero.');
        }

        if (actualProduction < 0) {
            throw new Error('La producción real no puede ser negativa.');
        }

        if (unitsSold < 0) {
            throw new Error('Las unidades vendidas no pueden ser negativas.');
        }

        if (unitSalePrice < 0) {
            throw new Error('El precio de venta unitario no puede ser negativo.');
        }

        // Validación de no negatividad para costos
        for (const [key, val] of Object.entries(variableCosts)) {
            if (val < 0) {
                throw new Error(`El costo variable (${key}) no puede ser negativo.`);
            }
        }

        for (const [key, val] of Object.entries(fixedCosts)) {
            if (val < 0) {
                throw new Error(`El costo fijo (${key}) no puede ser negativo.`);
            }
        }

        // Como el modelo no contempla inventario inicial: ventas <= producción real
        if (unitsSold > actualProduction) {
            throw new Error(
                `Las ventas (${unitsSold} unidades) no pueden superar a la producción real (${actualProduction} unidades) ya que no existe inventario inicial en este modelo.`
            );
        }

        return {
            normalCapacity,
            actualProduction,
            unitsSold,
            unitSalePrice,
            variableCosts,
            fixedCosts
        };
    }

    /**
     * Calcula todos los valores derivados a partir de los inputs.
     * @param {Object} inputs 
     * @returns {Object} resultados completos de costeo absorbente, directo y reconciliación
     */
    static calculate(inputs) {
        const {
            normalCapacity,
            actualProduction,
            unitsSold,
            unitSalePrice,
            variableCosts,
            fixedCosts
        } = inputs;

        // 1. Costo variable de fabricación unitario
        // CV fabricación/u = Materia Prima/u + Mano de Obra/u + GIF Variables/u
        const unitVariableMfgCost = (
            (Number(variableCosts.directMaterials) || 0) +
            (Number(variableCosts.directLabor) || 0) +
            (Number(variableCosts.variableManufacturingOverhead) || 0)
        );

        // Gasto variable de venta unitario
        const unitVariableSellingCost = Number(variableCosts.variableSelling) || 0;

        // 2. Tasa fija de producción
        // Tasa fija/u = Costos Fijos de Producción / Capacidad Normal
        const fixedCostManufacturing = Number(fixedCosts.manufacturing) || 0;
        const fixedCostAdministration = Number(fixedCosts.administration) || 0;

        const fixedMfgRate = normalCapacity > 0 
            ? fixedCostManufacturing / normalCapacity 
            : 0;

        // 3. Costo unitario absorbente
        // Costo Absorbente/u = CV Fabricación/u + Tasa Fija/u
        const unitAbsorptionCost = unitVariableMfgCost + fixedMfgRate;

        // 4. Inventarios en unidades (Inventario inicial = 0)
        // Inventario Final = Producción Real - Unidades Vendidas
        const endingInventoryUnits = actualProduction - unitsSold;
        const inventoryVariationUnits = actualProduction - unitsSold;

        // 5. Ventas totales
        // Ventas = Unidades Vendidas × Precio Venta/u
        const totalRevenue = unitsSold * unitSalePrice;

        // 6. GIF fijos aplicados y Variación de capacidad / volumen
        // GIF Fijos Aplicados = Producción Real × Tasa Fija/u
        const appliedFixedMfgCost = actualProduction * fixedMfgRate;

        // Variación Volumen = Costos Fijos Producción - GIF Fijos Aplicados
        // Positiva = subaplicación, Negativa = sobreaplicación
        const volumeVariance = fixedCostManufacturing - appliedFixedMfgCost;

        // 7. Costeo Absorbente
        // Costo de Ventas Absorbente = Unidades Vendidas × Costo Absorbente/u
        const absorptionCostOfGoodsSold = unitsSold * unitAbsorptionCost;

        // Margen o Utilidad Bruta antes de variación
        const grossMarginBeforeVariance = totalRevenue - absorptionCostOfGoodsSold;

        // Gastos Variables de Venta = Unidades Vendidas × Gasto Variable Venta/u
        const totalVariableSellingExpenses = unitsSold * unitVariableSellingCost;

        // Utilidad Absorbente = Ventas - Costo Ventas Absorbente - Gastos Variables Venta - Gastos Fijos Administración - Variación Volumen
        const absorptionOperatingProfit = (
            totalRevenue -
            absorptionCostOfGoodsSold -
            totalVariableSellingExpenses -
            fixedCostAdministration -
            volumeVariance
        );

        // 8. Costeo Directo
        // Costo Variable de Ventas = Unidades Vendidas × CV Fabricación/u
        const variableCostOfGoodsSold = unitsSold * unitVariableMfgCost;

        // Margen de Contribución Total = Ventas - Costo Variable de Ventas - Gastos Variables de Venta
        const contributionMargin = totalRevenue - variableCostOfGoodsSold - totalVariableSellingExpenses;

        // Margen de Contribución %
        const contributionMarginRatio = totalRevenue > 0 
            ? (contributionMargin / totalRevenue) * 100 
            : 0;

        // Utilidad Directa = Margen de Contribución - Costos Fijos Producción - Gastos Fijos Administración
        const directOperatingProfit = (
            contributionMargin -
            fixedCostManufacturing -
            fixedCostAdministration
        );

        // 9. Reconciliación de Utilidades
        // profitDifference = Utilidad Absorbente - Utilidad Directa
        const profitDifference = absorptionOperatingProfit - directOperatingProfit;

        // fixedCostInInventory = Variación de Inventario en Unidades × Tasa Fija/u
        const fixedCostInInventory = inventoryVariationUnits * fixedMfgRate;

        // reconciliationDifference = profitDifference - fixedCostInInventory
        const reconciliationDifference = profitDifference - fixedCostInInventory;

        // Tolerancia de centavos (< 0.01)
        const isReconciled = Math.abs(reconciliationDifference) < 0.01;

        // Totales útiles para KPIs y Dashboard
        const totalFixedCosts = fixedCostManufacturing + fixedCostAdministration;
        const totalVariableCostsIncurred = variableCostOfGoodsSold + totalVariableSellingExpenses;

        return {
            rates: {
                unitVariableMfgCost,
                unitVariableSellingCost,
                fixedMfgRate,
                unitAbsorptionCost
            },
            inventory: {
                beginningInventory: 0,
                actualProduction,
                unitsSold,
                endingInventory: endingInventoryUnits,
                inventoryVariation: inventoryVariationUnits
            },
            absorption: {
                revenue: totalRevenue,
                cogs: absorptionCostOfGoodsSold,
                grossMarginBeforeVariance,
                appliedFixedMfgCost,
                volumeVariance,
                volumeVarianceType: volumeVariance > 0.001 
                    ? 'subaplicacion' 
                    : volumeVariance < -0.001 
                        ? 'sobreaplicacion' 
                        : 'exacta',
                variableSellingExpenses: totalVariableSellingExpenses,
                fixedAdminExpenses: fixedCostAdministration,
                operatingProfit: absorptionOperatingProfit
            },
            direct: {
                revenue: totalRevenue,
                variableCogs: variableCostOfGoodsSold,
                variableSellingExpenses: totalVariableSellingExpenses,
                totalVariableExpenses: variableCostOfGoodsSold + totalVariableSellingExpenses,
                contributionMargin,
                contributionMarginRatio,
                fixedMfgExpenses: fixedCostManufacturing,
                fixedAdminExpenses: fixedCostAdministration,
                totalFixedExpenses: totalFixedCosts,
                operatingProfit: directOperatingProfit
            },
            reconciliation: {
                absorptionProfit: absorptionOperatingProfit,
                directProfit: directOperatingProfit,
                profitDifference,
                inventoryVariation: inventoryVariationUnits,
                fixedMfgRate,
                fixedCostInInventory,
                reconciliationDifference,
                isReconciled
            },
            summary: {
                totalRevenue,
                totalFixedCosts,
                totalVariableCostsIncurred,
                endingInventoryValueAbsorption: endingInventoryUnits * unitAbsorptionCost,
                endingInventoryValueDirect: endingInventoryUnits * unitVariableMfgCost
            }
        };
    }
}

module.exports = CostAnalysisService;
