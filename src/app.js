const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Inicialización de Firebase (se asegura de que conecte antes de arrancar)
require('./config/firebase');

const app = express();

const routes = require('./routes');

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

// Rutas de la API
app.use('/api', routes);

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'active',
        timestamp: new Date().toISOString(),
        service: 'ERP Contable - Street Studio Code'
    });
});

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

module.exports = app;
