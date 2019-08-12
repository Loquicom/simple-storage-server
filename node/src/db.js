const fs = require('fs');
const sqlite = require('sqlite3');
const sql = require('./sql');

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
    // Connection à la base
    const exist = fileExist(this.DB_PATH);
    console.log('exist',exist);
    this.db = new sqlite.Database(this.DB_PATH);
    // Création si besoins de la base
    if(!exist) {
        this.createDb();
    }
};

Db.prototype.DB_PATH = './data/loquicompta.db';

Db.prototype.createDb = function() {
    this._execute(sql.createUserTable);
    this._execute(sql.createFileTable);
    this._execute(sql.createUserFileTable);
}

Db.prototype.userExist = function(username) {
    if(typeof username !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.userExist, username, (err, rows) => {
            if(err) {
                if(global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0].nb > 0);
            }
        });
    });
}

Db.prototype.getUser = function(username) {
    if(typeof username !== 'string') {
        return false;
    }
    return new Promise((resolve, reject) => {
        this.db.all(sql.getUser, username, (err, rows) => {
            if(err) {
                if(global.verbose) {
                    console.error(err);
                }
                resolve(false);
            } else {
                resolve(rows[0]);
            }
        });
    });
}

Db.prototype.addUser = function(username, passwordhash) {
    if(typeof username !== 'string' && typeof passwordhash !== 'string') {
        return false;
    }
    this.userExist(username).then((result) => {
        if(!result) {
            this._execute(sql.insertUser, [username, passwordhash]);
        }
    });
}

Db.prototype.listFile = function(username) {

}

Db.prototype.fileExist = function(username, filename) {

}

Db.prototype.getFile = function(username, filename) {

}

Db.prototype.addFile = function(username, filename, data) {

}

Db.prototype.updateFile = function(username, filename, data) {

}

Db.prototype._execute = function(sql, params) {
    try {
        if(params !== undefined && params !== null) {
            this.db.run(sql, params);
        } else {
            this.db.run(sql);
        }
    } catch(err) {
        if(global.verbose) {
            console.error(err);
        }
        throw new Error('Error during request');
    }
}

// Export
module.exports = new Db();