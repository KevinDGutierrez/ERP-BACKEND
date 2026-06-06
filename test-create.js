const AccountModel = require('./src/models/account.model');
const { db } = require('./src/config/firebase');

async function testCreate() {
    try {
        const id = await AccountModel.create({
            companyId: 'master_company',
            name: 'Cuenta de Prueba',
            type: 'ACTIVO',
            nature: 'DEUDORA',
            parentId: ''
        });
        console.log('Success, id:', id);
        
        const acc = await AccountModel.getById(id);
        console.log('Account code generated:', acc.code);

        // Limpiar
        await db.collection('accounts').doc(id).delete();
    } catch (e) {
        console.error('Error:', e);
    }
}

testCreate().then(() => process.exit(0));
