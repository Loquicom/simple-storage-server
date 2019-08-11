const auth = require('./auth');
require('./db');

//let auth = new Auth();
let t = auth.generateToken('Loquicom');
console.log(t);
console.log(auth.verify('Loquicom', t));

// Constante d'erreur
const ERR_REQUEST = 1;
const ERR_AUTH = 2;
const ERR_TOKEN = 3;

// Fonctions de traitement pour les routes
function verify(req, res, next) {
    if(auth.isActivated() && auth.verify(req.body.user, req.body.token)) {
        res.json(error(ERR_TOKEN))
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
app.get('/authentication', function(req, res) {
    console.log(success({authentication: auth.isActivated()}));
    res.json(success({authentication: auth.isActivated()}));
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test/:val?', function (req, res) {
    res.send('Val = ' + req.params.val);
});

app.get(/.*aze$/, function (req, res) {
    res.send('URL end with aze');
})