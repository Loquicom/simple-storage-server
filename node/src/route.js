const auth = require('./auth');
const db = require('./db');

// Constante d'erreur
const ERR_REQUEST = 1;
const ERR_AUTH = 2;
const ERR_UNKNOW = 3;
const ERR_TOKEN = 4;
const ERR_SERV = 5;

// Fonctions de traitement pour les routes
function verifyAuth(req, res, next) {
    if(req.body.user === undefined || req.body.token === undefined) {
        res.json(error(ERR_REQUEST));
        return;
    }
    if(auth.isActivated() && !auth.verify(req.body.user, req.body.token)) {
        res.json(error(ERR_TOKEN));
        return;
    }
    next();
}

// Fonctions reponses
function error(code) {
    let answer = {
        success: false,
        code: code
    };
    switch(code) {
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
        default:
            answer.message = 'Unknow error';
    }
    return answer;
}

function success(data) {
    if(data === undefined || data === null) {
        return {success: true};
    }
    else if(typeof data !== 'object') {
        return {success: true, data: data};
    } else {
        data.success = true;
        return data;
    }
}

// Definition des routes
app.get('/authentication', (req, res) => {
    res.json(success({authentication: auth.isActivated()}));
});

app.post('/register', (req, res) => {
    if(req.body.user === undefined || req.body.password === undefined) {
        res.json(error(ERR_REQUEST));
        return;
    }
    const passHash = auth.passwordHash(req.body.password);
    db.addUser(req.body.user, passHash);
    return res.json(success());
});

app.post('/login', (req, res) => {
    if(req.body.user === undefined || req.body.password === undefined) {
        res.json(error(ERR_REQUEST));
        return;
    }
    db.getUser(req.body.user).then((user) => {
        if(user === undefined) {
            res.json(error(ERR_UNKNOW));
        } else {
            if(auth.passwordVerify(req.body.password, user.pass)) {
                res.json(success({token: auth.generateToken(req.body.user)}));
            } else {
                res.json(error(ERR_AUTH));
            }
        }
    });
});

app.post('/token', (req, res) => {
    if(req.body.user === undefined || req.body.token === undefined) {
        res.json(error(ERR_REQUEST));
        return;
    }
    res.json(success({valid: auth.verify(req.body.user, req.body.token)}));
});

app.post('/list', [verifyAuth, (req, res) => {
    db.listFile(req.body.user).then((list) => {
        console.log(list.length);
        console.log(list);
        if(list === false) {
            res.json(error(ERR_SERV));
        } else {
            res.json(success({
                total: list.length,
                list: list
            }));
        }
    });
}]);

/*
app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test/:val?', function (req, res) {
    res.send('Val = ' + req.params.val);
});

app.get(/.*aze$/, function (req, res) {
    res.send('URL end with aze');
})
*/