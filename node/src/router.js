const fs = require('fs');
const crypto = require('crypto');
const auth = require('./auth');
const db = require('./db');
const doc = require('../data/documentation.json');

// Constante d'erreur
const ERR_REQUEST = 1;
const ERR_AUTH = 2;
const ERR_UNKNOW = 3;
const ERR_TOKEN = 4;
const ERR_SERV = 5;
const ERR_FILE = 6;
const ERR_REGISTER = 7;

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
        case ERR_REGISTER:
            answer.message = 'User already exist';
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
    }

    /* --- Fonctions pre traitement --- */

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

    route() {
        this.app.get('/', [this.verbose, this.getDocumentation]);
        this.app.get('/authentication', [this.verbose, this.authenticationActivated]);
        this.app.post('/register', [this.verbose, this.register]);
        this.app.post('/login', [this.verbose, this.login]);
        this.app.get('/token', [this.verbose, this.testToken]);
        this.app.get('/list', [this.verbose, this.verifyAuth, this.listFile]);
        this.app.get('/:file', [this.verbose, this.verifyAuth, this.getFile]);
        this.app.post('/save', [this.verbose, this.verifyAuth, this.newFile]);
        this.app.put('/save/:file', [this.verbose, this.verifyAuth, this.updateFile]);
        this.app.put('/rename/:file', [this.verbose, this.verifyAuth, this.renameFile]);
        this.app.delete('/:file', [this.verbose, this.verifyAuth, this.deleteFile]);
    }

    getDocumentation(req, res) {
        res.json(doc);
    }

    authenticationActivated(req, res) {
        res.json(success({authentication: auth.isActivated()}));
    }

    register(req, res) {
        if (req.body.user === undefined || req.body.password === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        const passHash = auth.passwordHash(req.body.password);
        let promise = db.addUser(req.body.user, passHash);
        if (promise === false) {
            res.json(error(ERR_SERV));
            return;
        }
        promise.then((result) => {
            if (result) {
                return res.json(success());
            } else {
                return res.json(error(ERR_REGISTER));
            }
        });
    }

    login(req, res) {
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
    }

    testToken(req, res) {
        if (req.body.user === undefined || req.body.token === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        res.json(success({valid: auth.verify(req.body.user, req.body.token)}));
    }

    listFile(req, res) {
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
    }

    newFile(req, res) {
        if (req.body.file === undefined || req.body.data === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        let promise, filename;
        // Si on sauvegarde les données dans des fichiers, generation du chemin
        if (global.storage === 'file') {
            let hash = Date.now() + '-' + req.body.user + '-' + req.params.file;
            hash = crypto.createHash('md5').update(hash).digest('base64');
            hash = hash.replace(/=/g, '').replace(/\//g, '');
            filename = './data/' + hash + '.fdata';
            promise = db.addFile(req.body.user, req.body.file, filename);
        }
        // Sinon om met directement en base
        else {
            promise = db.addFile(req.body.user, req.body.file, req.body.data);
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
                    fs.writeFile(filename, req.body.data, (err) => {
                        if (err) {
                            if (global.verbose) {
                                console.error(err);
                            }
                            res.json(error(ERR_SERV));
                        } else {
                            res.json(success({fileId: fileId, fileName: req.body.file}));
                        }
                    });
                }
                // Le fichier est directement sauvegarder en base
                else {
                    res.json(success({fileId: fileId, fileName: req.body.file}));
                }
            }
        });
    }

    getFile(req, res) {
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
    }

    updateFile(req, res) {
        if (req.body.data === undefined || req.params.file === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        // Si les données sont dans un fichier
        if (global.storage === 'file') {
            let promise = db.getFile(req.body.user, req.params.file);
            if (promise === false) {
                res.json(error(ERR_SERV));
                return;
            }
            promise.then((file) => {
                if (file === false) {
                    res.json(error(ERR_FILE));
                } else if (!fs.existsSync(file.data)) {
                    res.json(error(ERR_FILE));
                } else {
                    fs.writeFile(file.data, req.body.data, (err) => {
                        if (err) {
                            if (global.verbose) {
                                console.error(err);
                            }
                            res.json(error(ERR_SERV));
                        } else {
                            res.json(success({fileId: req.params.file}));
                        }
                    });
                }
            });
        }
        // Sinon on modifie la base
        else {
            let promise = db.updateFile(req.body.user, req.params.file, req.body.data);
            if (promise === false) {
                res.json(error(ERR_REQUEST));
                return;
            }
            promise.then((result) => {
                if (result) {
                    res.json(success({fileId: req.params.file}));
                } else {
                    res.json(error(ERR_FILE));
                }
            });
        }
    }

    renameFile(req, res) {
        if (req.body.name === undefined || req.params.file === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        let promise = db.renameFile(req.body.user, req.params.file, req.body.name);
        if (promise === false) {
            res.json(error(ERR_REQUEST));
            return;
        }
        promise.then((result) => {
            if (result) {
                res.json(success({fileId: req.params.file, filename: req.body.name}));
            } else {
                res.json(error(ERR_FILE));
            }
        });
    }

    deleteFile(req, res) {
        if (req.params.file === undefined) {
            res.json(error(ERR_REQUEST));
            return;
        }
        let promise = db.deleteFile(req.body.user, req.params.file);
        if (promise === false) {
            res.json(error(ERR_REQUEST));
            return;
        }
        promise.then((result) => {
            if (result) {
                res.json(success());
            } else {
                res.json(error(ERR_FILE));
            }
        });
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
