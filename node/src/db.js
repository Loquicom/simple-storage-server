const fs = require('fs');
const sqlite = require('sqlite3');
const crypto = require('crypto');
const sql = require('./sql');

const DB_PATH = './data/sss.db';

let instance = null;

// Indique si un fichier existe
function fileExist(path) {
    try {
        return fs.existsSync(path);
    } catch (err) {
        return false;
    }
}

// Class Db
function Db() {
    // Verbeux ou non
    if (global.sqlVerbose) {
        sqlite.verbose();
    }
    // Connection à la base
    const exist = fileExist(DB_PATH);
    this.db = new sqlite.Database(DB_PATH);
    // Création si besoins de la base
    if (!exist) {
        this.createDb();
    }
}

Db.prototype.getDb = function () {
    return this.db;
};

Db.prototype.createDb = function () {
    this._execute(sql.createUserTable);
    this._execute(sql.createFileTable);
    this._execute(sql.createUserFileTable);
};

Db.prototype.userExist = function (username) {
    if (typeof username !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.userExist, username, (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0].nb > 0);
            }
        });
    });
};

Db.prototype.getUser = function (username) {
    if (typeof username !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.getUser, username, (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0]);
            }
        });
    });
};

Db.prototype.addUser = function (username, passwordhash) {
    if (typeof username !== 'string' && typeof passwordhash !== 'string') {
        return false;
    }
    return new Promise((resolve, resject) => {
        this.userExist(username).then((result) => {
            if (!result) {
                this._execute(sql.insertUser, [username, passwordhash]);
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

Db.prototype.listFile = function (username) {
    if (typeof username !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.listFile, username, (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows);
            }
        });
    });
};

Db.prototype.fileExist = function (username, fileId) {
    if (typeof username !== 'string' || typeof fileId !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.fileExist, [username, fileId], (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0].nb > 0);
            }
        });
    });
};

Db.prototype.getFile = function (username, fileId) {
    if (typeof username !== 'string' || typeof fileId !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.getFile, [username, fileId], (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                // Regarde si il y a des resultat
                if (rows.length > 0) {
                    resolve(rows[0]);
                } else {
                    resolve(null);
                }
            }
        });
    });
};

Db.prototype.addFile = function (username, filename, data) {
    if (typeof username !== 'string' || typeof filename !== 'string' || typeof data !== 'string') {
        return false;
    }
    // Ajout du fichier
    return new Promise((resolve, reject) => {
        // Ajoute les données de base du fichier
        this._execute(sql.addFile, [filename, data]);
        // Recupère l'id du fichier
        this.db.all(sql.lastId, (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                const fileId = rows[0].lastId;
                //Calcul du hash
                let hash = fileId + '-' + username + '-' + filename;
                hash = crypto.createHash('md5').update(hash).digest('base64');
                hash = hash.replace(/=/g, '').replace(/\//g, '');
                // Ajoute le hash
                this._execute(sql.addFileHash, [hash, fileId]);
                // Recupération de l'utilisateur
                this.getUser(username).then((user) => {
                    if (user === false) {
                        resolve(false);
                    } else {
                        // Ajoute le lien entre utilisateur et fichier
                        this._execute(sql.addUserFile, [user.id, fileId]);
                        // Retourne le hash du fichier
                        resolve(hash);
                    }
                });
            }
        });
    });
};

Db.prototype.updateFile = function (username, fileId, data) {
    if (typeof username !== 'string' || typeof fileId !== 'string' || typeof data !== 'string') {
        return false;
    }
    // Met à jour les données du fichier
    return new Promise((resolve, reject) => {
        this.fileExist(username, fileId).then((result) => {
            if (result) {
                this._execute(sql.updateFile, [data, fileId]);
                resolve(true);
            } else {
                if (gobal.verbose) {
                    console.info(`File ${fileId} for user ${username} not found`);
                }
                resolve(false);
            }
        });
    });
};

Db.prototype.renameFile = function (username, fileId, name) {
    if (typeof username !== 'string' || typeof fileId !== 'string' || typeof name !== 'string') {
        return false;
    }
    // Met à jour le nom du fichier
    return new Promise((resolve, reject) => {
        this.fileExist(username, fileId).then((result) => {
            if (result) {
                this._execute(sql.renameFile, [name, fileId]);
                resolve(true);
            } else {
                if (gobal.verbose) {
                    console.info(`File ${fileId} for user ${username} not found`);
                }
                resolve(false);
            }
        });
    });
};


Db.prototype.deleteFile = function (username, fileId) {
    if (typeof username !== 'string' || typeof fileId !== 'string') {
        return false;
    }
    // Supprime le fichier
    return new Promise((resolve, reject) => {
        this.getFile(username, fileId).then((file) => {
            if (file === false) {
                if (gobal.verbose) {
                    console.info(`File ${fileId} for user ${username} not found`);
                }
                resolve(false);
            } else {
                this._execute(sql.deleteUserFile, file.id);
                this._execute(sql.deleteFile, file.id);
                resolve(true);
            }
        });
    });
};

Db.prototype.countFile = function () {
    return new Promise((resolve, reject) => {
        this.db.all(sql.countFile, (err, rows) => {
            if (err) {
                if (global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0].nb);
            }
        });
    });
};

Db.prototype.resetDatabase = function () {
    this._execute(sql.deleteUserFile);
    this._execute(sql.deleteFile);
    this._execute(sql.deleteUser);
};

Db.prototype._execute = function (sql, params) {
    try {
        if (params !== undefined && params !== null) {
            this.db.run(sql, params);
        } else {
            this.db.run(sql);
        }
    } catch (err) {
        if (global.verbose) {
            console.error(err);
        }
        throw new Error('Error during request');
    }
};

// Export
module.exports.getInstance = function () {
    if (instance === null) {
        instance = new Db();
    }
    return instance;
};

module.exports.getDb = function () {
    return module.exports.getInstance().getDb();
};

module.exports.getPath = function () {
    return DB_PATH;
};