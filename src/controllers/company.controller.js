const { admin } = require('../config/firebase');
const db = admin.firestore();

const listCompanies = async (req, res) => {
    try {
        const snapshot = await db.collection('companies')
            .where('status', '==', 'active')
            .get();
        
        const companies = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        res.json({ companies });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    listCompanies
};
