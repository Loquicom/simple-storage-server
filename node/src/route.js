require('./auth');
require('./db');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test/:val?', function (req, res) {
    res.send('Val = ' + req.params.val);
});

app.get(/.*aze$/, function (req, res) {
    res.send('URL end with aze');
})