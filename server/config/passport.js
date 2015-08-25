'use strict';

import passport from 'passport';
import Local from 'passport-local';
import Facebook from 'passport-facebook';
import User from '../models/user';
import config from './secrets';
import mongoose from 'mongoose';

let secrets = config[process.env.NODE_ENV || 'development'];

// Passport strategies
let LocalStrategy = Local.Strategy;
let FacebookStrategy = Facebook.Strategy;

// Session de/serialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(null, user);
  });
});

// Local login
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  if (email) email = email.toLowerCase();

  process.nextTick(() => {    
    User.findOne({ 'email': email }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'No user found.' });

      user.comparePassword(password, (err, isMatch) => {
        if (err) return done(err);
        if (!isMatch) return done(null, false, { message: 'Email or password incorrect.' });
        return done(null, user, { message: 'Login successful.' });
      });
    });
  });
}));


/**
 * Local Strategy:
 *
 * - User not logged in
 *   - If user exists
 *     - If password throw error
 *     - Else add password to existing account
 *   - Else create new local account
 * - User already logged in
 *   - If no password, add it
 *   - Else return user
 */

// Local signup
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  if (email) email = email.toLowerCase();

  process.nextTick(() => {
    if (!req.user) {
      User.findOne({ 'email': email }, (err, signedOutUser) => {
        if (err) return done(err);

        if (signedOutUser) {
          if (signedOutUser.password) {
            // If user has a password, we can assume that it's an existing account.
            return done(null, false, { message: 'That email address is taken.' });
          } else {
            // Otherwise, it's an oauth account, add the password
            signedOutUser.password = password;

            signedOutUser.save((err) => {
              if (err) return done(err);
              return done(null, user);
            });
          }
        } else {
          // Create a new account
          var newUser = new User({
            email: [email],
            password: password
          });

          newUser.save((err) => {
            if (err) return done(err);
            return done(null, newUser);
          });
        }
      });
    } else if (!req.user.password) {
      var user = req.user;
      
      if (!user.email.contains(email)) user.email.push(email);
      user.password = password;

      user.save((err) => {
        if (err) return done(err);
        return done(null, user, { message: 'Local password assigned to existing social sign on user.' });
      });
    } else {
      return done(null, req.user, { message: 'User already signed in.' });
    }
  });
}));


/**
 * OAuth Strategy:
 *
 * - User not logged in
 *   - If user with unlinked account exists, link social
 *   - Else if user exists, log in
 *   - Else no user, create one
 * - User already logged in
 *   - Link account
 */

// Sign in with Facebook
passport.use(new FacebookStrategy(secrets.facebook, (req, token, refreshToken, profile, done) => {
  
  var email = (profile.emails[0].value || profile._json.email).toLowerCase();
  
  process.nextTick(() => {
    if (!req.user) {
      User.findOne({ 'facebook.id' : profile.id }, (err, user) => {
        if (err) return done(err);

        if (user) {
          if (!user.facebook.token) {
            user.first_name = user.first_name || profile.name.givenName;
            user.last_name = user.last_name || profile.name.familyName;
            user.display_name = user.display_name || profile.displayName || user.first_name + ' ' + user.last_name;
            user.facebook.token = token;
            user.facebook.id = profile.id;
            if (!user.email.indexOf(email) === -1) user.email.push(email);

            user.save((err) => {
              if (err) return done(err);
              return done(null, user);
            });
          }
          return done(null, user);
        } else {
          var newUser = new User();
          
          newUser.facebook.token = token;
          newUser.facebook.id = profile.id;
          newUser.first_name = profile.name.givenName;
          newUser.last_name = profile.name.familyName;
          newUser.display_name = newUser.display_name || profile.displayName || newUser.first_name + ' ' + newUser.last_name;
          newUser.email.push(email);

          newUser.save((err) => {
            if (err) return done(err);
            return done(null, newUser);
          });
        }
      });
    } else {
      var user = req.user;
          
      user.facebook.token = token;
      user.facebook.id = profile.id;
      user.first_name = user.first_name || profile.name.givenName;
      user.last_name = user.last_name || profile.name.familyName;
      user.display_name = user.display_name || profile.displayName || user.first_name + ' ' + user.last_name;
      if (user.email.indexOf(email) === -1) user.email.push(email);

      user.save((err) => {
        if (err) return done(err);
        return done(null, user);
      });
    }
  });
}));

// Middleware
let isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401);
  return next(new Error('Unauthorized request.'));
};

let isAuthorized = (req, res, next) => {
  let provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect('/auth/' + provider);
  }
};

export { isAuthenticated, isAuthorized };
