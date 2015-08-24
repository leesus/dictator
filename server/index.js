'use strict';

import express from 'express';
import path from 'path';
import favicon from 'static-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compress from 'compression';
import session from 'express-session';
import validator from 'express-validator';

// Dependencies
import passport from 'passport';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo')({ session: session });
import flash from 'express-flash';

// Routes
import routes from './routes';

// Config
import passportConfig from './config/passport';
import [process.env.NODE_ENV || 'development'] from './config/secrets';

// Create express
import app = express();

// Connect to mongo
mongoose.connect(secrets.db);
mongoose.connection.on('error', => console.error('MongoDB Connection Error. Make sure MongoDB is running.'));
mongoose.connection.on('disconnect', => mongoose.connect(secrets.db));

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade')
app.use(compress());
app.use(validator());
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
    secret: secrets.sessionSecret,
    store: new MongoStore({
        url: secrets.db,
        auto_reconnect: true,
        collection: 'session'
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, '../client')));
app.use((req, res, next) => {
    if (req.user) res.cookie('user', JSON.stringify(req.user));
    next();
});

app.locals.environment = app.get('env');

// Set redirect url
app.use((req, res, next) => {
    let path = req.path.split('/')[1];
    if (/auth|login|logout|signup|img|fonts|favicon/i.test(path)) return next();
    req.session.redirectUrl = req.path;
    next();
});

// Default home route
app.get('/', (req, res, next) => {
    res.render('index.ejs');
});

// Use api routes, e.g. /api/account/login
app.use('/api', routes);

// Hashbang everything
app.use('*', (req, res, next) => {
    res.redirect('/#' + req.originalUrl);
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers
// Stacktraces passed
app.use((err, req, res, next) => {
    res.send(err.status || res.statusCode || 500, {
        success: false,
        message: err.message,
        errors: err.errors || err
    });
});

// Export server
export default app;
