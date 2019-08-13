/*
Liste des requetes SQL utilisée par l'application
*/

// Création table utilisateur
module.exports.createUserTable = 'CREATE TABLE "USER" ('
    + '"us_id" INTEGER PRIMARY KEY AUTOINCREMENT,'
    + '"us_name" VARCHAR(512),'
    + '"us_pass" VARCHAR(512));';

// Création table fichier
module.exports.createFileTable = 'CREATE TABLE "FILE" ('
    + '"fi_id" INTEGER PRIMARY KEY AUTOINCREMENT,'
    + '"fi_name" VARCHAR(512),'
    + '"fi_hash" VARCHAR(256),'
    + '"fi_data" TEXT);';

// Création table jointure utilisateur fichier
module.exports.createUserFileTable = 'CREATE TABLE "USERFILE" ('
    + '"us_id" INTEGER,'
    + '"fi_id" INTEGER,'
    + 'PRIMARY KEY ("us_id", "fi_id"),'
    + 'FOREIGN KEY ("us_id") REFERENCES "USER" ("us_id"),'
    + 'FOREIGN KEY ("fi_id") REFERENCES "FILE" ("fi_id"));';

// Compte le nombre d'utilisateur avec un nom
module.exports.userExist = 'SELECT count(*) as nb FROM USER WHERE us_name = lower(?)';

// Recupère un utilisateur
module.exports.getUser = 'SELECT us_id as id, us_name as name, us_pass as pass FROM USER WHERE us_name = lower(?)';

// Ajout d'un utilisateur
module.exports.insertUser = 'INSERT INTO USER("us_name", "us_pass") VALUES (lower(?), ?);';

// Liste les fichiers
module.exports.listFile = 'SELECT fi_hash as hash, fi_name as name FROM FILE f ' 
    + 'INNER JOIN USERFILE uf on f.fi_id = uf.fi_id '
    + 'INNER JOIN USER u on uf.us_id = u.us_id '
    + 'WHERE us_name = lower(?);';

// Compte le nombre de fichier avec un nom appartenant a un certain utilisateur
module.exports.fileExist = 'SELECT count(*) as nb FROM FILE f ' 
    + 'INNER JOIN USERFILE uf on f.fi_id = uf.fi_id '
    + 'INNER JOIN USER u on uf.us_id = u.us_id '
    + 'WHERE us_name = lower(?) '
    + 'AND fi_name = lower(?);';

module.exports.getFile = 'SELECT fi_hash as hash, fi_name as name, fi_data as data FROM FILE f ' 
    + 'INNER JOIN USERFILE uf on f.fi_id = uf.fi_id '
    + 'INNER JOIN USER u on uf.us_id = u.us_id '
    + 'WHERE us_name = lower(?) '
    + 'AND fi_name = lower(?);';

// Ajoute un fichier en base
module.exports.addFile = 'INSERT INTO FILE("fi_name", "fi_data") VALUES (lower(?), ?);'

// Ajoute le hash du fichier
module.exports.addFileHash = 'UPDATE FILE SET fi_hash = ? WHERE fi_id = ?;';

// Ajoute le lien entre un fichier et un utilisateur
module.exports.addUserFile = 'INSERT INTO USERFILE("us_id", "fi_id") VALUES (?, ?);';

// Met à jour le contenue d'un fichier
module.exports.updateFile = 'UPDATE FILE SET fi_data = ? WHERE fi_hash = ?;';

// Recupère le derniere id ajouté
module.exports.lastId = 'SELECT last_insert_rowid() as lastId;';