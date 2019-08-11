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
    // Active ou non le mode verbeux
    if(global.verbose){
        sqlite.verbose();
    }
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
    try {
        this.db.run(sql.createUserTable);
        this.db.run(sql.createFileTable);
        this.db.run(sql.createUserFileTable);
    } catch(err) {
        if(global.verbose) {
            console.error(err);
        }
        throw new Error('Error during initialization');
    }
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

// Export
module.exports = new Db();