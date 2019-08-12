const bcrypt = require('bcryptjs');
const Token = require('./token');

// Class auhtentification
class Auth {

    constructor() {
        // Validité de 12 heures en seconde
        this.token = new Token('f5152bfd5894ae15103690d16ca09c38', 60 * 60 * 12);
    }

    isActivated() {
        return global.auth
    }

    generateToken(user) {
        if(user === undefined || user === null) {
            return false;
        }
        return this.token.generate(user);
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
        return this.token.validate(userToken, user);
    }

}

// Export
module.exports = new Auth();