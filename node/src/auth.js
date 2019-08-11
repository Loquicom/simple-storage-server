var token = require('token');
var bcrypt = require('bcryptjs');

// Parametrage token
token.defaults.timeStep = 60 * 60 * 12; // Validité de 12 heures en seconde
token.defaults.secret = 'f5152bfd5894ae15103690d16ca09c38';

// Class auhtentification
class Auth {

    isActivated() {
        return global.auth
    }

    generateToken(user) {
        if(user === undefined || user === null) {
            return false;
        }
        return token.generate(user);
    }

    invalidateToken(user, userToken) {
        if(user === undefined || user === null || userToken === undefined || userToken === null) {
            return false;
        }
        return token.invalidate(user, userToken);
    }

    passwordHash(password) {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    passwordVerify(password, hash) {
        return bcrypt.compareSync(password, hash)
    }

    verify(user, userToken) {
        // Regarde si l'authentification est activée
        if(!this.isActivated()) {
            return true
        }
        // Verifie que l'utilisateur et le token n'est pas null
        if(user === undefined || user === null || userToken === undefined || userToken === null) {
            return false;
        }
        // Test la validitée du token
        switch(token.verify(user, userToken)) {
            case token.VALID:
            case token.EXPIRING:
                return true;
            case token.INVALID:
                return false;
            default:
                return false;
        }
    }

}

// Export
module.exports = new Auth();