const fs = require('fs');
const BACKUP_PATH = '/Users/ydmacm1/Desktop/redgate_backup_20260104.json';

try {
    const raw = fs.readFileSync(BACKUP_PATH, 'utf8');
    const data = JSON.parse(raw);
    console.log("Keys:", Object.keys(data));
    if (data.Store) console.log("Store Type:", typeof data.Store, Array.isArray(data.Store));
    if (data.sales) console.log("Has 'sales' key?");
    console.log("Sample Data:", JSON.stringify(data).substring(0, 200));
} catch (e) {
    console.error(e);
}
