'use strict';

import passport from 'passport';
import passportConfig from '../config/passport';
import User from '../models/user';

/**
 * Add an unactivated user
 */
let addUser = (req, res, next) => {
  User.create({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    display_name: req.body.display_name || req.body.first_name + ' ' + req.body.last_name,
    email: req.body.email,
    owes: [req.user._id]
  }, (err, user) => {
    if (err) {
      res.status(403);
      return next(err);
    }
    // send email to new user - 'user registered a debt to you' etc
    return res.send(201, { success: true, message: 'User created successfully.', data: user });
  });
};

/**
 * Update user
 */
let updateUser = (req, res, next) => {

};

/**
 * Remove user
 */
let removeUser = (req, res, next) => {

};

/**
 * Get all users
 */
let getUsers = (req, res, next) => {
  User.find().exec((err, users) => {
    if (err) {
      res.status(403);
      return next(err);
    }
    console.log(users);
    return res.send(200, { success: true, message: 'Users found.', data: users });
  });
};

/**
 * Find user
 */
let findUsers = (req, res, next) => {
  var query = { $search: req.params.query };
  
  User.find({ $text: query }).exec((err, users) => {
    if (err) {
      res.status(403);
      return next(err);
    }
    return res.send(200, { success: true, message: 'Users found.', data: users });
  });
};

/**
 * Get user by email
 */
let getUserByEmail = (req, res, next) => {

};

/**
 * Get user by id
 */
let getUserById = (req, res, next) => {

};

/**
 * Get user by name
 */
let getUserByName = (req, res, next) => {

};

export { addUser, updateUser, removeUser, getUsers, findUsers, getUserByEmail, getUserById, getUserByName };