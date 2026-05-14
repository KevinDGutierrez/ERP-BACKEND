const app = require('./app');
const seedAccounts = require('./utils/seed');

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor ERP corriendo en el puerto ${PORT}`);
    console.log(`📡 URL Base: http://localhost:${PORT}`);
    
    // Ejecutar seed inicial
    await seedAccounts();
});
