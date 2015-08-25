'use strict';

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

let Schema = mongoose.Schema;

let UserSchema = new Schema({
  first_name: String,
  last_name: String,
  display_name: String,

  email: [{ type: String, required: true, unique: true }],
  password: String,

  facebook: {
    id: String,
    token: String
  },

  created_date: { type: Date, 'default': Date.now },

  notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }]
});

UserSchema.pre('save', function(next) {
  let user = this;

  if (!user.display_name && user.first_name && user.last_name) user.display_name = user.first_name + ' ' + user.last_name;
  if (!user.isModified('password')) return next();
  
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(password, fn) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) return fn(err);

    fn(null, isMatch);
  });
};

UserSchema.index({ display_name: 'text', email: 'text' });

export default mongoose.model('User', UserSchema);