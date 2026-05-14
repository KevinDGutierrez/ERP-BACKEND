const { admin } = require('../config/firebase');

/**
 * Middleware para verificar el token de Firebase Auth
 */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'No autorizado. Se requiere un token de autenticación (Bearer token).' 
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error al verificar token de Firebase:', error.message);
        res.status(403).json({ 
            message: 'Token inválido o expirado.',
            error: error.code
        });
    }
};

module.exports = authenticate;
