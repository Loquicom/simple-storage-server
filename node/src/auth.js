var token = require('token');
var bcrypt = require('bcryptjs');

// Parametrage token
token.defaults.timeStep = 60 * 60 // Validité de une heure en seconde

//Sync
console.log('sync', bcrypt.compareSync('azerty', '$2y$10$IcQ32uKzQawg8g.kYuR/O.4y1kTSPHG0eZSMjACJKuFGa1VHM97Lu'));
var salt = bcrypt.genSaltSync(10);
console.log('sync', bcrypt.hashSync("qwerty", salt));

//Async
bcrypt.compare("azerty", '$2y$10$IcQ32uKzQawg8g.kYuR/O.4y1kTSPHG0eZSMjACJKuFGa1VHM97Lu', function(err, res) {
    console.log('async', res);
});
bcrypt.compare("azerty", '$2y$10$IcQ32uKzQawg8g.kYuR/O.4y1kTSPHG0eZSMjACJKuFGa1VHM97Lu').then((res) => {
    console.log('async promise', res)
});
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash("qwerty", salt, function(err, hash) {
        console.log('async', hash);
    });
});