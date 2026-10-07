const express = require('express');
const router = express.Router();
const CostAnalysisController = require('../controllers/costAnalysis.controller');

// Obtener parámetros guardados y resultados actuales
router.get('/', CostAnalysisController.getAnalysis);

// Guardar y calcular parámetros
router.put('/', CostAnalysisController.updateAnalysis);

// Simulación What-If (sin persistir)
router.post('/simulate', CostAnalysisController.simulate);

module.exports = router;
