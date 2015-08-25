'use strict';

import _ from 'underscore';
import Note from '../models/note';

let addNote = (req, res, next) => {
  Note.create({
    user: req.user._id,
    title: req.body.title,
    body: req.body.body
  }, (err, note) => {
    if (err) {
      res.status(403);
      return next(err);
    }
    Note.findById(note._id).populate('user', 'first_name last_name display_name').exec((err, note) => {
      if (err) {
        res.status(403);
        return next(err);
      }
      return res.status(201).send({ success: true, message: 'Note created successfully.', data: note });
    });
  });
};

let getNotes = (req, res, next) => {
  let user = req.user._id;

  Note.find({ user: user }).sort('date').exec((err, notes) => {
    if (err) return next(err);
    if (!notes || !notes.length) return res.status(200).send({ success: true, message: 'No notes found belonging to user.', data: notes });
    return res.status(200).send({ success: true, message: 'Notes belonging to user ' + user + '.', data: notes });
  });
};

let getNote = (req, res, next) => {
  let id = req.params.id;

  Note.findById(id, (err, note) => {
    if (err) return next(err);
    if (!note) return res.status(404).send({ success: false, message: 'Note not found.' });
    return res.status(200).send({ success: true, message: 'Note found.', data: note });
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
      return res.status(200).send({ success: true, message: 'Note updated successfully.', data: note });
    });
  });
};

let removeNote = (req, res, next) => {
  Note.remove({ _id: req.params.id }, (err) => {
    if (err) return next(err);
    return res.status(200).send({ success: true, message: 'Note removed successfully.' });
  });
};

export { addNote, getNotes, getNote, updateNote, removeNote };
