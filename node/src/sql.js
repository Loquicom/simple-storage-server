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