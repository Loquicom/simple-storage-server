const fs = require('fs');
const crypto = require('crypto');
const auth = require('./auth');
const db = require('./db');

// Constante d'erreur
const ERR_REQUEST = 1;
const ERR_AUTH = 2;
const ERR_UNKNOW = 3;
const ERR_TOKEN = 4;
const ERR_SERV = 5;
const ERR_FILE = 6;

// Fonctions reponses
function error(code) {
    let answer = {
        success: false,
        code: code
    };
    switch (code) {
        case ERR_REQUEST:
            answer.message = 'Bad request';
            break;
        case ERR_AUTH:
            answer.message = 'Bad authentication';
            break;
        case ERR_UNKNOW:
            answer.message = 'Unknow user';
            break;
        case ERR_TOKEN:
            answer.message = 'Invalid token';
            break;
        case ERR_SERV:
            answer.message = 'Server error';
            break;
        case ERR_FILE:
            answer.message = 'File not found';
            break;
        default:
            answer.message = 'Unknow error';
    }
    return answer;
}

function success(data) {
    if (data === undefined || data === null) {
        return {success: true};
    } else if (typeof data !== 'object') {
        return {success: true, data: data};
    } else {
        data.success = true;
        return data;
    }
}

const router = class Router {

    constructor(app) {
        this.app = app;
        this.doc = require('../data/documentation.json');
    }

    /* --- Helper function --- */

    // Fonctions de traitement pour les routes
    verifyAuth(req, res, next) {
        if (req.body.user === undefined || req.body.token === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        if (auth.isActivated() && !auth.verify(req.body.user, req.body.token)) {
            res.json(error(ERR_TOKEN));
            return;
        }
        let promise = db.userExist(req.body.user);
        if (promise === false) {
            res.json(error(ERR_REQUEST));
            return;
        }
        promise.then((exist) => {
            if (exist) {
                next();
            } else {
                res.json(error(ERR_UNKNOW));
            }
        });
    }

    verbose(req, res, next) {
        if (global.verbose) {
            const nbProp = Object.keys(req.body);
            console.log(`\nCall ${req.route.path} with ${nbProp.length} parameter(s)`);
            if (nbProp.length > 0) {
                for (let prop in req.body) {
                    console.log(`   ${prop}: ${req.body[prop]}`);
                }
            }
        }
        next();
    }

    /* --- Definitions des routes --- */

    newFile(user, file, data, res) {
        let promise, filename;
        // Si on sauvegarde les données dans des fichiers, generation du chemin
        if (global.storage === 'file') {
            let hash = Date.now() + '-' + req.body.user + '-' + req.params.file;
            hash = crypto.createHash('md5').update(hash).digest('base64');
            hash = hash.replace(/=/g, '').replace(/\//g, '');
            filename = './data/' + hash + '.fdata';
            promise = db.addFile(user, file, filename);
        }
        // Sinon om met directement en base
        else {
            promise = db.addFile(user, file, data);
        }
        if (promise === false) {
            res.json(error(ERR_REQUEST));
            return;
        }
        promise.then((fileId) => {
            if (fileId === false) {
                res.json(ERR_SERV);
            } else {
                // Si en mode fichier stockage dans un fichier
                if ((global.storage === 'file')) {
                    fs.writeFile(filename, data, (err) => {
                        if (err) {
                            if (global.verbose) {
                                console.error(err);
                            }
                            res.json(error(ERR_SERV));
                        } else {
                            res.json(success({fileId: fileId, fileName: file}));
                        }
                    });
                }
                // Le fichier est directement sauvegarder en base
                else {
                    res.json(success({fileId: fileId, fileName: file}));
                }
            }
        });
    }

    saveFile() {

    }

    route() {
        this.app.get('/', [this.verbose, (req, res) => {
            res.json(this.doc);
        }]);

        this.app.get('/authentication', [this.verbose, (req, res) => {
            res.json(success({authentication: auth.isActivated()}));
        }]);

        this.app.post('/register', [this.verbose, (req, res) => {
            if (req.body.user === undefined || req.body.password === undefined) {
                res.json(error(ERR_REQUEST));
                return;
            }
            const passHash = auth.passwordHash(req.body.password);
            db.addUser(req.body.user, passHash);
            return res.json(success());
        }]);

        this.app.post('/login', [this.verbose, (req, res) => {
            if (req.body.user === undefined || req.body.password === undefined) {
                res.json(error(ERR_REQUEST));
                return;
            }
            const promise = db.getUser(req.body.user);
            if (promise === false) {
                res.json(error(ERR_REQUEST));
                return;
            }
            promise.then((user) => {
                if (user === undefined) {
                    res.json(error(ERR_UNKNOW));
                } else {
                    if (auth.passwordVerify(req.body.password, user.pass)) {
                        res.json(success({token: auth.generateToken(req.body.user)}));
                    } else {
                        res.json(error(ERR_AUTH));
                    }
                }
            });
        }]);

        this.app.post('/token', [this.verbose, (req, res) => {
            if (req.body.user === undefined || req.body.token === undefined) {
                res.json(error(ERR_REQUEST));
                return;
            }
            res.json(success({valid: auth.verify(req.body.user, req.body.token)}));
        }]);

        this.app.post('/list', [this.verbose, this.verifyAuth, (req, res) => {
            const promise = db.listFile(req.body.user);
            if (promise === false) {
                res.json(error(ERR_REQUEST));
                return;
            }
            promise.then((list) => {
                if (list === false) {
                    res.json(error(ERR_SERV));
                } else {
                    res.json(success({
                        total: list.length,
                        list: list
                    }));
                }
            });
        }]);

        this.app.post('/get/:file', [this.verbose, this.verifyAuth, (req, res) => {
            const promise = db.getFile(req.body.user, req.params.file);
            if (promise === false) {
                res.json(error(ERR_REQUEST));
                return;
            }
            promise.then((file) => {
                // Erreur
                if (file === false) {
                    res.json(error(ERR_SERV));
                } else // Le fichier n'existe pas
                if (file === null) {
                    res.json(error(ERR_FILE));
                }
                // Création reponse commune
                else {
                    let result = {
                        fileid: file.fi_hash,
                        filename: file.fi_name
                    };
                    // Recupération données fichier
                    if (global.storage === 'database') {
                        result.data = file.data;
                        res.json(success(result));
                    } else {
                        if (!fs.existsSync(file.data)) {
                            res.json(error(ERR_FILE));
                        }
                        fs.readFile(file.data, (err, data) => {
                            result.data = data.toString();
                            res.json(success(result));
                        });
                    }
                }
            });
        }]);

        this.app.post('/save/:file?', [this.verbose, this.verifyAuth, (req, res) => {
            if (req.params.file === undefined) {
                if (req.body.file === undefined || req.body.data === undefined) {
                    res.json(error(ERR_REQUEST));
                } else {
                    this.newFile(req.body.user, req.body.file, req.body.data, res);
                }
            } else {
                if (req.body.data === undefined) {
                    res.json(error(ERR_REQUEST));
                } else {
                    this.saveFile(req.body.user, req.body.data, res);
                }
            }
        }]);

    }

};

module.exports = router;


/*
app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test/:val?', function (req, res) {
    console.log(req.params.val);
    res.send('Val = ' + req.params.val);
});

app.get(/.*aze$/, function (req, res) {
    res.send('URL end with aze');
})
*/
