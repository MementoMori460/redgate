const { importChecklistData } = require("./app/actions/import-legacy"); importChecklistData().then(console.log).catch(console.error);
