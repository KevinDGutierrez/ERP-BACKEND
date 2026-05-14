const admin = require('firebase-admin');
const serviceAccount = require('../erp-umg-firebase-adminsdk-fbsvc-d092a7accb.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

auth.createUser({
  email: 'admin@streetstudio.com',
  password: 'password123'
})
.then((user) => {
  console.log('✅ Usuario creado:', user.uid);
  process.exit(0);
})
.catch((error) => {
  if (error.code === 'auth/email-already-exists') {
    console.log('ℹ️ El usuario ya existe, puedes usarlo.');
    process.exit(0);
  }
  console.error('❌ Error:', error.message);
  process.exit(1);
});
