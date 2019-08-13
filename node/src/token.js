const crypto = require('crypto');

class Token {

    constructor (secret, time) {
        if(typeof secret != 'string' || typeof time != 'number') {
            throw new Error('Bad type: secret = string and time = number');
        }
        this.secret = secret;
        this.time = time;
    }

    generate(data) {
        data = JSON.stringify(data) || '';
        // Calcul timestamp actuel + timestamp expiration token
        const timestamp = Math.floor(new Date().getTime() / 1000);
        const endtime = timestamp + this.time;
        // Création d'un hash
        let hash = data.toLowerCase() + this.secret + endtime;
        hash = crypto.createHash('sha512').update(hash).digest('base64');
        hash = hash.replace(/=/g, '');
        // Le token correspond au timestamp de fin + le hash
        return endtime + '.' + hash;
    }

    validate(token, data) {
        // Verification que le token correspond au format attendu
        if(typeof token != 'string') {
            return false;
        }
        const split = token.split('.');
        if(split.length != 2) {
            return false;
        }
        // Recreation du hash supposé du token
        data = JSON.stringify(data) || '';
        let hash = data.toLowerCase() + this.secret + split[0];
        hash = crypto.createHash('sha512').update(hash).digest('base64');
        hash = hash.replace(/=/g, '');
        // Verification que la hash est le même que celui du token passé en parametre
        return hash == split[1];
    }

}

module.exports = Token;