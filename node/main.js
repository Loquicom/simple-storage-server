#!/usr/bin/env node

// Gestion des commandes et des options de l'application
const argv = require('yargs')
    .command('serve [port]', 'start the Loquicompta server', (yargs) => {
        yargs.positional('port', {describe: 'port to bind', default: 80});
    }, (argv) => {
    })
    .command('dev', 'start the Loquicompta server on 8080 port with verbose', (yargs) => {
    }, (argv) => {
        argv.port = 8080;
        argv.verbose = 1;
    })
    .option('port', {
        alias: 'p',
        default: 80
    })
    .option('auth', {
        default: true
    })
    .count('verbose')
    .alias('v', 'verbose')
    .count('sql')
    .alias('s', 'sql')
    .describe('p', 'port to bind')
    .describe('auth', 'disables authentication')
    .describe('v', 'show server informations')
    .describe('s', 'show sql informations')
    .argv;

// Chargement fichier config
const config = require('./src/config');

// Bibliotheques
const express = require('express');

// Creation variable globale
global.app = express();
if (!config.auth) {
    global.auth = false;
} else {
    global.auth = argv.auth;
}
global.storage = config.storage;
global.verbose = argv.verbose >= 1;
global.sqlVerbose = argv.sql >= 1;

// Configuration server
app.use(express.json());
require('./src/route');

// Lancement serveur
app.listen(argv.port, () => {
    console.info(`Server starting on port ${argv.port} (http://localhost:${argv.port})`);
});
