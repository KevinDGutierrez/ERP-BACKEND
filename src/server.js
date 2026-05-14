const app = require('./app');
const seedAccounts = require('./utils/seed');
const { ensureSuperAdmin } = require('./utils/adminInit');

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor ERP corriendo en el puerto ${PORT}`);
    console.log(`📡 URL Base: http://localhost:${PORT}`);
    
    // Asegurar que el Super Admin exista
    await ensureSuperAdmin();
    
    // Ejecutar seed inicial para la empresa maestra
    await seedAccounts('master_company');
});
