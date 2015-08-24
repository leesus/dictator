'use strict';

import passport from 'passport';
import passportConfig from '../config/passport';
import User from '../models/user';

let login = (req, res, next) => {
  req.assert('email', 'Email is not valid.').isEmail();
  req.assert('password', 'Password cannot be blank.').notEmpty();

  let errors = req.validationErrors();

  if (errors) {
    return res.status(401).send({ success: false, message: 'Login failed.', errors: errors });
  }

  passport.authenticate('local-login', (err, user, info) => {
    if (err) return console.error(err) && next(err);
    if (!user) return res.status(401).send({ success: false, message: info.message });

    req.logIn(user, (err) => {
      if (err) return console.error(err) && next(err);
      res.cookie('user', JSON.stringify(req.user));
      return res.send({ success: true, message: info.message, data: user });
    });
  })(req, res, next);
};

let signup = (req, res, next) => {
  req.assert('email', 'Email is not valid.').isEmail();
  req.assert('password', 'Password must be at least 6 characters long.').len(6);

  var errors = req.validationErrors();

  if (errors) {
    return res.send(403, { success: false, message: 'Signup failed.', errors: errors });
  }

  passport.authenticate('local-signup', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.send(409, { success: false, message: info && info.message || 'There was an error creating your account.' });

    req.logIn(user, (err) => {
      if (err) return console.error(err) && next(err);
      res.cookie('user', JSON.stringify(req.user));
      return res.send(201, { success: true, message: info && info.message || 'Account created successfully.', data: user });
    });
  })(req, res, next);
};

let logout = (req, res, next) => {
  req.logout();
  return res.send(200, { success: true, message: 'Logout successful.' });
};

export { login, signup, logout };
