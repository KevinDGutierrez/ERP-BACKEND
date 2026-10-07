const CostAnalysisModel = require('../models/costAnalysis.model');
const CostAnalysisService = require('../services/costAnalysis.service');

/**
 * Controller for Cost Analysis module
 */
class CostAnalysisController {
    /**
     * GET /api/cost-analysis
     * Obtiene los parámetros guardados de la empresa y devuelve inputs + results calculados.
     */
    static async getAnalysis(req, res) {
        try {
            const { companyId } = req.user;
            if (!companyId) {
                return res.status(403).json({ message: 'No tienes una empresa asignada' });
            }

            const docData = await CostAnalysisModel.getByCompanyId(companyId);
            const inputs = docData?.inputs || CostAnalysisModel.getDefaultInputs();
            const results = CostAnalysisService.calculate(inputs);

            return res.json({
                inputs,
                results,
                isDefault: !docData
            });
        } catch (error) {
            console.error('Error in getAnalysis:', error);
            return res.status(500).json({ 
                message: error.message || 'Error al obtener análisis de costos' 
            });
        }
    }

    /**
     * PUT /api/cost-analysis
     * Recibe inputs, valida, persiste en Firestore y devuelve inputs + results + message.
     */
    static async updateAnalysis(req, res) {
        try {
            const { companyId, uid } = req.user;
            if (!companyId) {
                return res.status(403).json({ message: 'No tienes una empresa asignada' });
            }

            const rawInputs = req.body;
            const validatedInputs = CostAnalysisService.sanitizeAndValidateInputs(rawInputs);
            const results = CostAnalysisService.calculate(validatedInputs);

            await CostAnalysisModel.upsert(companyId, validatedInputs, uid);

            return res.json({
                inputs: validatedInputs,
                results,
                message: 'Parámetros de costos guardados y calculados exitosamente'
            });
        } catch (error) {
            console.error('Error in updateAnalysis:', error);
            return res.status(400).json({ 
                message: error.message || 'Error al procesar parámetros de costos' 
            });
        }
    }

    /**
     * POST /api/cost-analysis/simulate
     * Realiza un cálculo what-if temporal en memoria sin persistir nada en Firestore.
     */
    static async simulate(req, res) {
        try {
            const { companyId } = req.user;
            if (!companyId) {
                return res.status(403).json({ message: 'No tienes una empresa asignada' });
            }

            const rawInputs = req.body;
            const validatedInputs = CostAnalysisService.sanitizeAndValidateInputs(rawInputs);
            const results = CostAnalysisService.calculate(validatedInputs);

            return res.json({
                inputs: validatedInputs,
                results
            });
        } catch (error) {
            console.error('Error in simulate:', error);
            return res.status(400).json({ 
                message: error.message || 'Error en la simulación de costos' 
            });
        }
    }
}

module.exports = CostAnalysisController;
