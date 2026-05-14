const { admin } = require('../config/firebase');
const db = admin.firestore();

/**
 * Middleware para verificar el token de Firebase Auth y el estado del usuario en Firestore
 */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'No autorizado. Se requiere un token de autenticación.' 
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        // Consultar perfil en Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            // Si el perfil no existe, inyectamos datos básicos para que el frontend pueda crear el perfil
            req.user = { uid, email, status: 'new' };
            return next();
        }

        const profile = userDoc.data();

        // Validar estados bloqueantes
        if (profile.status === 'pending') {
            return res.status(403).json({ message: 'Cuenta pendiente de aprobación', status: 'pending' });
        }
        if (profile.status === 'rejected') {
            return res.status(403).json({ message: 'Solicitud rechazada', status: 'rejected' });
        }
        if (profile.status === 'disabled') {
            return res.status(403).json({ message: 'Cuenta deshabilitada', status: 'disabled' });
        }

        // Si es activo, inyectar datos completos incluyendo companyId para multi-empresa
        req.user = {
            uid,
            email,
            role: profile.role || 'usuario',
            status: profile.status,
            companyId: profile.companyId || null
        };

        next();
    } catch (error) {
        console.error('Error Auth:', error.message);
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

/**
 * Middleware para restringir acceso solo a Super Admins
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        return next();
    }
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Super Admin' });
};

module.exports = { authenticate, isAdmin };
