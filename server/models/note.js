'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NoteSchema = new Schema({
  // User note belongs to, maps to user._id
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: false },

  body: { type: String, required: true },

  archived: { type: Boolean, 'default': false },

  created_date: { type: Date, 'default': Date.now },

  updated_date: { type: Date, 'default': Date.now }
});

NoteSchema.pre('save', (next) => {
  this.updated_date = Date.now();
  next();
});

export default mongoose.model('Debt', NoteSchema);