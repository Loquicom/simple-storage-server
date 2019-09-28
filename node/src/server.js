const fs = require('fs');
const https = require('https');
const express = require('express');
const portfinder = require('portfinder');

class Server {

    constructor(useHttps = false) {
        this.https = false;
        this.app = express();
        this.app.use(express.json());
    }

    route(router) {
        this.router = new router(this.app);
        this.router.route();
    }

    start(port, highestPort = null) {
        portfinder.basePort = port;
        portfinder.highestPort = (highestPort === null) ? port : highestPort;
        return new Promise((resolve, reject) => {
            // Tentative de demarrage du serveur sur la plage de port definit
            portfinder.getPortPromise().then((serverPort) => {
                if (this.https) {
                    this.httpsServer(serverPort);
                } else {
                    this.httpServer(serverPort);
                }
                resolve(serverPort);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    httpServer(port) {
        this.app.listen(port);
    }

    httpsServer(port) {
        https.createServer({
            key: fs.readFileSync('./data/key.pem'),
            cert: fs.readFileSync('./data/cert.pem')
        }, this.app).listen(port);
    }

}

// Export
module.exports = new Server();
