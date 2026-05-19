const express = require('express');
const router = express.Router();
const AccountingService = require('../services/accounting.service');

router.get('/summary', async (req, res) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(403).json({ message: 'No tienes una empresa asignada' });

        const summary = await AccountingService.getDashboardSummary(companyId);
        res.json(summary);
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
