/*
Liste des requetes SQL utilisée pour convertir la méthode de stockage des fichiers
*/

// Recuperation de tous le contenue des tables FILE et USERFILE
module.exports.getAll = 'SELECT u.us_id as userId, u.us_name as username, f.fi_id as fileId, fi_name as filename, fi_hash as hash, fi_data as data ' +
    'FROM FILE f INNER JOIN USERFILE uf on f.fi_id = uf.fi_id ' +
    'INNER JOIN USER u on uf.us_id = u.us_id';

module.exports.updateFileData = 'UPDATE FILE SET fi_data = ? Where fi_hash = ?;';