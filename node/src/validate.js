const fs = require('fs');
const inquirer = require('inquirer');
const db = require('./db').getInstance();

let converter;
if (fs.existsSync('./src/convert/')) {
    converter = require('./convert');
}

let validator = null;

class Validate {

    constructor(config) {
        this.config = config;
        this.valid = undefined;
    }

    isValid() {
        return this.valid;
    }

    haveConverter() {
        return converter !== undefined;
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

    rectify() {
        if (this.valid === undefined) {
            return false;
        } else if (this.valid) {
            return true;
        }
        console.info('The method of storage in the configuration file is different from the storage method used');
        return new Promise((resolve, reject) => {
            if (this.haveConverter()) {
                inquirer.prompt({
                    type: 'confirm',
                    name: 'convertData',
                    message: 'Do you want to convert the data into the method of storage of the configuration file [default=yes] ?',
                    default: true
                }).then((answer) => {
                    if (answer.convertData) {
                        // Db vers fichier
                        if (this.config.storage === 'file') {
                            converter.convertDatabaseToFile(resolve);
                        }
                        // Fichier vers Db
                        else {
                            converter.convertFileToDatabase(resolve);
                        }
                    } else {
                        this.deletePrompt(resolve);
                    }
                });
            } else {
                this.deletePrompt(resolve);
            }
        });
    }

    deletePrompt(resolve) {
        inquirer.prompt({
            type: 'confirm',
            name: 'deleteData',
            message: 'Do you want to delete the data to switch to the new storage method [default=no] ?',
            default: false
        }).then((answer) => {
            if (answer.deleteData) {
                // Reset de la bdd
                db.resetDatabase();
                // Suppr fichier fdata
                const dir = './data/';
                fs.readdirSync(dir).forEach(file => {
                    const split = file.split('.');
                    if (split[split.length - 1] === 'fdata') {
                        fs.unlinkSync(dir + file);
                    }
                });
                // Message de fin
                console.info('Delete complete');
            }
            resolve(answer.deleteData);
        });
    }

}

module.exports.getValidator = function (config) {
    if (validator === null) {
        validator = new Validate(config);
    }
    return validator;
};