const fs = require('fs');

// Chemin vers le fichier
const path = './config.json';

// Verif que le fichier de config existe
if (!fs.existsSync(path)) {
    throw "Config file not found";
}

// Lecture du fichier
const data = fs.readFileSync(path).toString();
const config = JSON.parse(data);

// Verification de la presences des différents elements
if (config.storage === undefined) {
    throw 'Storage undefined in the config file';
} else if (config.auth === undefined) {
    throw 'Auth undefined in the config file';
} else if (config.findPort === undefined) {
    throw 'findPort undefined in the config file';
}

//Verification valeur
if (config.storage !== 'database' && config.storage !== 'file') {
    throw 'Bad value for storage: database or file expected';
} else if (typeof config.auth !== 'boolean') {
    throw 'Bad value for auth: boolean expected';
} else if (typeof config.findPort !== 'boolean') {
    throw 'Bad value for findPort: boolean expected';
}

module.exports = config;
