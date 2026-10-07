const { db } = require('../config/firebase');

const COST_ANALYSIS_COLLECTION = 'cost_analysis';

class CostAnalysisModel {
    /**
     * Default fallback inputs when company has no cost analysis document yet.
     */
    static getDefaultInputs() {
        return {
            normalCapacity: 10000,
            actualProduction: 10000,
            unitsSold: 8000,
            unitSalePrice: 150,
            variableCosts: {
                directMaterials: 35,
                directLabor: 25,
                variableManufacturingOverhead: 10,
                variableSelling: 5
            },
            fixedCosts: {
                manufacturing: 120000,
                administration: 80000
            }
        };
    }

    /**
     * Obtiene los inputs de costos para una empresa específica
     * @param {string} companyId 
     * @returns {Object|null} documento de inputs o null
     */
    static async getByCompanyId(companyId) {
        if (!companyId) throw new Error('Se requiere companyId');
        
        const docRef = db.collection(COST_ANALYSIS_COLLECTION).doc(companyId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        return docSnap.data();
    }

    /**
     * Guarda o actualiza los inputs de costos de la empresa
     * @param {string} companyId 
     * @param {Object} inputs 
     * @param {string} userId 
     */
    static async upsert(companyId, inputs, userId) {
        if (!companyId) throw new Error('Se requiere companyId');

        const docRef = db.collection(COST_ANALYSIS_COLLECTION).doc(companyId);
        const dataToSave = {
            companyId,
            inputs,
            updatedAt: new Date().toISOString(),
            updatedBy: userId || 'unknown'
        };

        await docRef.set(dataToSave, { merge: true });
        return dataToSave;
    }
}

module.exports = CostAnalysisModel;
