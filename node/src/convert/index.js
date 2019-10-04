const fs = require('fs');
const crypto = require('crypto');
const sql = require('./sql');
const db = require('../db').getDb();

module.exports.convertDatabaseToFile = function (callback) {
    db.all(sql.getAll, (err, rows) => {
        if (err) {
            if (global.verbose) {
                console.error(err);
            }
            resolve(false);
            return;
        }
        // Parcours chaque ligne
        rows.forEach((row) => {
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
                return;
            }
        });
        // Fin tout est ok
        callback(true);
    });
    callback(true);
};

module.exports.convertFileToDatabase = function (callback) {

};