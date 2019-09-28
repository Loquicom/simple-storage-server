#!/usr/bin/env node

// Gestion du signal d'arret (SIGINT = Ctrl+C)
process.on('SIGINT', function () {
    console.info("\nStopping the server");
    process.exit();
});

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

// Creation variable globale
if (!config.auth) {
    global.auth = false;
} else {
    global.auth = argv.auth;
}
global.storage = config.storage;
global.verbose = argv.verbose >= 1;
global.sqlVerbose = argv.sql >= 1;

// Lancement du serveur
const server = require('./src/server');
server.route(require('./src/router'));
server.start(argv.port).then((port) => {
    console.info(`Server starting on port ${port} (http://localhost:${port})`);
}).catch((err) => {
    // Si erreur port deja utilisé et option recherche de port ouvert activée
    if (err.toString().includes('Error: No open ports') && config.findPort) {
        console.info(`Port ${argv.port} not available, search for a new available port`);
        server.start(config.basePort, config.highestPort).then((port) => {
            console.info(`New available port found: ${port}`);
            console.info(`Server starting on port ${port} (http://localhost:${port})`);
        }).catch((err) => {
            console.error(err.toString());
            console.info('Unable to start the server, end of execution');
            process.exit();
        });
    }
    // Sinon erreur
    else {
        console.error(err.toString());
        console.info('Unable to start the server, end of execution');
        process.exit();
    }
});
