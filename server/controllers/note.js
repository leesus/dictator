'use strict';

import _ from 'underscore';
import Note from '../models/note';

let addNote = (req, res, next) => {
  Note.create({
    creditor: req.user._id,
    debtor: req.body.debtor,
    date: req.body.date,
    reference: req.body.reference,
    amount: req.body.amount
  }, (err, note) => {
    if (err) {
      res.status(403);
      return next(err);
    }
    Note.findById(note._id).populate('debtor', 'first_name last_name display_name').exec((err, note) => {
      if (err) {
        res.status(403);
        return next(err);
      }
      return res.send(201, { success: true, message: 'Note created successfully.', data: note });
    });
  });
};

let getNotesForUser = (req, res, next) => {
  let user = req.user._id;

  Note.find({ debtor: user }).sort('date').exec((err, notes) => {
    if (err) return next(err);
    if (!notes || !notes.length) return res.send(200, { success: true, message: 'No notes found to be owed by user.', data: notes });
    return res.send(200, { success: true, message: 'Notes for user ' + user + '.', data: notes });
  });
};

let getNote = (req, res, next) => {
  let id = req.params.id;

  Note.findById(id, (err, note) => {
    if (err) return next(err);
    if (!note) return res.send(404, { success: false, message: 'Note not found.' });
    return res.send(200, { success: true, message: 'Note found.', data: note });
  });
};

let updateNote = (req, res, next) => {
  Note.findById(req.params.id, (err, note) => {
    if (err) return next(err);

    _.each(Note.schema.paths, (value, key) => {
      if (key !== '_id' && key !== '__v') {
        if (req.body[key]) {
          note[key] = req.body[key];
        }
      }
    });

    note.save((err) => {
      if (err) {
        res.status(403);
        return next(err);
      }
      return res.send(200, { success: true, message: 'Note updated successfully.', data: note });
    });
  });
};

let removeNote = (req, res, next) => {
  Note.remove({ _id: req.params.id }, (err) => {
    if (err) return next(err);
    return res.send(200, { success: true, message: 'Note removed successfully.' });
  });
};

export { addNote, getNotesForUser, getNote, updateNote, removeNote };
