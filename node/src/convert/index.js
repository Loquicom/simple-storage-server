const fs = require('fs');
const crypto = require('crypto');
const sql = require('./sql');
const db = require('../db').getDb();

function forEachFile(todo, callback) {
    db.all(sql.getAll, (err, rows) => {
        if (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
            return;
        }
        // Parcours chaque ligne
        rows.forEach((row) => {
            todo(row);
        });
        // FIn tout est ok
        callback(true);
    });
}

module.exports.convertDatabaseToFile = function (callback) {
    forEachFile((row) => {
        // Creation du hash pour le nom du fichier
        let hash = Date.now() + '-' + row.username + '-' + row.filename;
        hash = crypto.createHash('md5').update(hash).digest('base64');
        hash = hash.replace(/=/g, '').replace(/\//g, '');
        const filename = './data/' + hash + '.fdata';
        // Creation du fichier
        try {
            fs.writeFileSync(filename, row.data, {mode: 0o755});
        } catch (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
            return;
        }
        // Ajout du chemin en base
        try {
            db.run(sql.updateFileData, [filename, row.hash]);
        } catch (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
        }
    }, callback);
};

module.exports.convertFileToDatabase = function (callback) {
    forEachFile((row) => {
        // Recupération des données du fichier
        let data;
        try {
            data = fs.readFileSync(row.data);
        } catch (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
        }
        // Modification des données en base
        try {
            db.run(sql.updateFileData, [data.toString(), row.hash]);
        } catch (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
            return;
        }
        // Suppr du fichier
        try {
            fs.unlinkSync(row.data);
        } catch (err) {
            if (global.verbose) {
                console.error(err);
            }
            callback(false);
        }
    }, callback);
};