'use strict';

const koa        = require('koa');            // koa framework
const flash      = require('koa-flash');      // flash messages
const hbsKoa     = require('koa-handlebars'); // handlebars templating
const helmet     = require('koa-helmet');     // security header middleware
const passport   = require('koa-passport');   // authentication
const serve      = require('koa-static');     // static file serving middleware
const bunyan     = require('bunyan');         // logging
const koaLogger  = require('koa-bunyan');     // logging
const handlebars = require('handlebars');
const moment     = require('moment');

const app = module.exports = koa(); // API app

// logging
const access = { type: 'rotating-file', path: './logs/app-access.log', level: 'trace', period: '1d', count: 4 };
const error  = { type: 'rotating-file', path: './logs/app-error.log',  level: 'error', period: '1d', count: 4 };
const logger = bunyan.createLogger({ name: 'app', streams: [ access, error ] });
app.use(koaLogger(logger, {}));

// set up MySQL connection
app.use(function* mysqlConnection(next) {
    // keep copy of this.db in GLOBAL for access from models
    this.db = GLOBAL.db = yield GLOBAL.connectionPool.getConnection();
    // traditional mode ensures not null is respected for unsupplied fields, ensures valid JavaScript dates, etc
    yield this.db.query('SET SESSION sql_mode = "TRADITIONAL"');

    yield next;

    this.db.release();
});


// use passport authentication (local auth)
require('./passport.js');
app.use(passport.initialize());
app.use(passport.session());

// handle thrown or uncaught exceptions anywhere down the line
app.use(function* handleErrors(next) {
    try {

        yield next;

    } catch (e) {
        let context = null;
        this.status = e.status || 500;
        switch (this.status) {
            case 404: // Not Found
                context = { msg: e.message=='Not Found'?null:e.message };
                yield this.render('views/404-not-found', context);
                break;
            case 403: // Forbidden
            case 409: // Conflict
                yield this.render('views/400-bad-request', e);
                break;
            case 500: // Internal Server Error
                context = app.env=='production' ? {} : { e: e };
                yield this.render('views/500-internal-server-error', context);
                this.app.emit('error', e, this); // github.com/koajs/examples/blob/master/errors/app.js
                break;
        }
    }
});

handlebars.registerHelper('static',function(){
    return '/static';
});


handlebars.registerHelper('X',function(i,j){
    return i*j;
});

handlebars.registerHelper('-',function(i,j){
    return i-j;
});

handlebars.registerHelper('ctx',function(){
    return '';
});

handlebars.registerHelper('formatterDate', function(timestamp) {
    return moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss')
});

handlebars.registerHelper('compare', function(left, operator, right, options) {
    if (arguments.length < 3) {
        throw new Error('Handlerbars Helper "compare" needs 2 parameters');
    }
    const operators = {
        '==':     function(l, r) {return l == r; },
        '===':    function(l, r) {return l === r; },
        '!=':     function(l, r) {return l != r; },
        '!==':    function(l, r) {return l !== r; },
        '<':      function(l, r) {return l < r; },
        '>':      function(l, r) {return l > r; },
        '<=':     function(l, r) {return l <= r; },
        '>=':     function(l, r) {return l >= r; },
        'typeof': function(l, r) {return typeof l == r; },
    };

    if (!operators[operator]) {
        throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
    }

    const result = operators[operator](left, right);

    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

// handlebars templating
app.use(hbsKoa({
    extension:     ['html', 'handlebars'],
    viewsDir:      'app',
    partialsDir:   'app/views/partials',
    cache:         app.env !== 'development',
    layoutsDir:    'app/views/layouts',
    defaultLayout: 'main',
    handlebars:    handlebars,
}));


// clean up post data - trim & convert blank fields to null
app.use(function* cleanPost(next) {
    if (this.request.body !== undefined) {
        for (const key in this.request.body) {
            this.request.body[key] =
             typeof this.request.body[key] =='string' ?
             this.request.body[key].trim():
             this.request.body[key];
            if (this.request.body[key] == '') this.request.body[key] = null;
        }
    }
    yield next;
});


// flash messages
app.use(flash());


// helmet security headers
app.use(helmet());


// serve static files (html, css, js); allow browser to cache for 1 hour (note css/js req'd before login)
app.use(serve('public', { maxage: 1000*60*60 }));

// public (unsecured) modules first

app.use(require('./routes/login-routes.js'));

// verify user has authenticated...

app.use(function* authSecureRoutes(next) {
    if (this.isAuthenticated()) {
        yield next;
    } else {
        this.redirect('/login');
    }
});

app.use(require('./routes/inventory-routes.js'));
app.use(require('./routes/member-routes.js'));
app.use(require('./routes/user-routes.js'));

// end of the line: 404 status for any resource not found
app.use(function* notFound(next) {
    yield next; // actually no next...
    this.status = 404;
    yield this.render('views/404-not-found');
});


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
