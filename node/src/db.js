const fs = require('fs');
const sqlite = require('sqlite3');
const sql = require('./sql');
const auth = require('./auth');

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
    this.db._execute(sql.createUserTable);
    this.db._execute(sql.createFileTable);
    this.db._execute(sql.createUserFileTable);
}

Db.prototype.getUser = function(username) {

}

Db.prototype.addUser = function(username, passwordhash) {

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

Db.prototype._execute = function(sql) {
    try {
        this.db.run(sql);
    } catch(err) {
        if(global.verbose) {
            console.error(err);
        }
        throw new Error('Error during request');
    }
}

// Export
module.exports = new Db();