'use strict';

import express from 'express';
import passport from 'passport';
import * as passportConfig from '../config/passport';

const router = express.Router();

// Controllers
import * as auth from '../controllers/auth';
import * as note from '../controllers/note';

// Middleware
let isAuthenticated = passportConfig.isAuthenticated;

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
  // Note routes
  .post('/notes', isAuthenticated, note.addNote)
  .put('/notes/:id', isAuthenticated, note.updateNote)
  .get('/notes', isAuthenticated, note.getNotes)
  .get('/notes/:id', isAuthenticated, note.getNote)
  .delete('/notes/:id', isAuthenticated, note.removeNote);

// Export routes
export default router;