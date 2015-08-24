'use strict';

import express from 'express';
import passport from 'passport';
import passportConfig from '../config/passport';

let router = express.Router();

// Controllers
import auth from '../controllers/auth';
import user from '../controllers/user';
import note from '../controllers/note';

// Middleware
var isAuthenticated = passportConfig.isAuthenticated;

// Routes
router
  // Account routes - sign in/sign up/sign out/oauth
  .post('/auth/login', auth.login)
  .post('/auth/signup', auth.signup)
  .get('/auth/logout', auth.logout)
  .get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }))
  .get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/api/auth/success', failureRedirect: '/api/auth/failure' }))
  .get('/auth/success', (req, res) => {
    res.render('after-auth.ejs', { state: 'success', user: req.user ? req.user : null });
  })
  .get('/auth/failure', (req, res) => {
    res.render('after-auth.ejs', { state: 'failure', user: null });
  })
  // User routes
  .post('/users', isAuthenticated, user.addUser)
  .put('/users/:id', isAuthenticated, user.updateUser)
  .get('/users', isAuthenticated, user.getUsers)
  .get('/users/search/:query', isAuthenticated, user.findUsers)
  .get('/users/:id', isAuthenticated, user.getUserById)
  .delete('/users/:id', isAuthenticated, user.removeUser)
  // Note routes
  .post('/notes', isAuthenticated, note.addDebt)
  .put('/notes/:id', isAuthenticated, note.updateDebt)
  .get('/notes/owed', isAuthenticated, note.getDebtsOwedToUser)
  .get('/notes/owes', isAuthenticated, note.getDebtsOwedByUser)
  .get('/notes/:id', isAuthenticated, note.getDebt)
  .delete('/notes/:id', isAuthenticated, note.removeDebt);

// Export routes
export default router;