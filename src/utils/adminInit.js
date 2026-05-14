const admin = require('firebase-admin');

/**
 * Asegura que exista un super admin en el sistema.
 * Se ejecuta al arrancar el servidor.
 */
async function ensureSuperAdmin() {
  const email = 'admin@streetstudio.com';
  const password = 'password123';
  
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('✅ Super Admin verificado en Auth.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          emailVerified: true,
          displayName: 'Super Admin'
        });
        console.log('🚀 Super Admin creado exitosamente en Auth.');
      } else {
        throw error;
      }
    }

    // Asegurar Empresa Maestra (Street Studio Code, S.A.)
    const masterCompanyRef = db.collection('companies').doc('master_company');
    const masterCompanyDoc = await masterCompanyRef.get();

    if (!masterCompanyDoc.exists) {
      await masterCompanyRef.set({
        name: 'Street Studio Code, S.A.',
        type: 'owner',
        status: 'active',
        nit: '0000000-0',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('🏢 Empresa maestra "Street Studio Code, S.A." creada.');
    }

    // Asegurar perfil en Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists || userDoc.data().role !== 'super_admin') {
      await userRef.set({
        email,
        role: 'super_admin',
        status: 'active',
        companyId: 'master_company',
        displayName: 'Super Admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: userDoc.exists ? userDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('📜 Perfil de Super Admin asegurado y vinculado a Empresa Maestra.');
    }

  } catch (error) {
    console.error('❌ Error al asegurar el Super Admin:', error.message);
  }
}

module.exports = { ensureSuperAdmin };
