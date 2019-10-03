const fs = require('fs');
const db = require('./db');

let converter;
if (fs.existsSync('./src/convert/')) {
    converter = require('./src/convert/');
}

let validator = null;

class Validate {

    constructor(config) {
        this.config = config;
        this.valid = undefined;
        this.haveConverter = converter !== undefined;
    }

    /**
     * See if the storage method matches the one in the config file
     * @return boolean - File storage is valid
     */
    check() {
        return new Promise(((resolve, reject) => {
            db.countFile().then((nb) => {
                // Impossible d'executer la requete SQL
                if (nb === false) {
                    throw 'Impossible to check the file storage';
                }
                // Aucun fichier en base tout est ok
                else if (nb === 0) {
                    this.valid = true;
                    resolve(true);
                } else {
                    // Regarde si il y a des fichiers fdata
                    let fdata = false;
                    fs.readdir('./data/', (err, files) => {
                        if (err) {
                            if (global.verbose) {
                                console.error(err);
                            }
                            throw 'Impossible to check the file storage';
                        }
                        files.forEach(file => {
                            if (fdata) {
                                return;
                            }
                            const split = file.split('.');
                            fdata = split[split.length - 1] === 'fdata';
                        });
                        this.valid = (this.config.storage === 'database' && !fdata) || (this.config.storage === 'file' && fdata);
                        resolve(this.valid);
                    });
                }
            });
        }));
    }

}

module.exports = function (config) {
    if (validator === null) {
        validator = new Validate(config);
    }
    return validator;
};