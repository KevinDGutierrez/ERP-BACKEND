const admin = require('firebase-admin');
const serviceAccount = require('../erp-umg-firebase-adminsdk-fbsvc-d092a7accb.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

const email = 'admin@streetstudio.com';
const password = 'password123';

async function setupAdmin() {
  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('ℹ️ Usuario ya existe en Auth.');
    } catch (e) {
      user = await auth.createUser({
        email,
        password,
        emailVerified: true
      });
      console.log('✅ Usuario creado en Auth.');
    }

    await db.collection('users').doc(user.uid).set({
      email: email,
      role: 'super_admin',
      status: 'active',
      companyId: 'master_company',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('🚀 PERFIL DE SUPER ADMIN CONFIGURADO CORRECTAMENTE');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
