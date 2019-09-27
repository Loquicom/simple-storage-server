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
const portfinder = require('portfinder');

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

// Lancement serveur sur le port demandé
portfinder.basePort = argv.port;
portfinder.highestPort = argv.port;
portfinder.getPortPromise()
    .then((port) => {
        app.listen(argv.port, () => {
            console.info(`Server starting on port ${port} (http://localhost:${port})`);
        });
    })
    .catch((err) => {
        if(err.toString().includes('Error: No open ports found') && config.findPort) {
            console.info(`Port ${argv.port} not available, search for a new available port`);
        } else {
            console.error(err.toString());
            console.info('Unable to start the server, end of execution');
            process.exit();
        }
    });

// Recherche d'un port ouvert
portfinder.basePort = 8000;
portfinder.highestPort = 65535;
portfinder.getPortPromise()
    .then((port) => {
        app.listen(port, () => {
            console.info(`New available port found: ${port}`);
            console.info(`Server starting on port ${port} (http://localhost:${port})`);
        });
    })
    .catch((err) => {
        console.err(err);
        console.info('Unable to start the server, end of execution');
        process.exit();
    });