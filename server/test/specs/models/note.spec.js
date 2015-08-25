'use strict';

import mocha from 'mocha';
import should from 'should';
import sinon from 'sinon';
import utils from '../../utils';

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import Note from '../../../models/note';
import User from '../../../models/user';

let user, note;

describe('Note model', () => {

  beforeEach(done => {
    user = new User({
      name: 'Lee'
    });

    user.save(() => {
      note = new Note({
        body: 'Phone bill',
        user: user._id
      });

      note.save(() => {
        done();
      });
    });
  });

  it('should have a non-null created_date property', () => {
    note.created_date.should.not.equal(null);
  });

  it('should have a non-null updated_date property', () => {
    note.updated_date.should.not.equal(null);
  });

  it('should have a body property', () => {
    note.body.should.equal('Phone bill');
  });

  it('should have a user property', () => {
    note.user.should.equal(user._id);
  });

  it('should have an archived property', () => {
    note.archived.should.be.false;
  });

  describe('when saving', () => {

    it('should update the update_date property', (done) => {
      let oldDate = note.updated_date;

      note.body.should.equal('Phone bill');
      note.updated_date.should.equal(oldDate);

      note.body = 'Pay phone bill';
      note.save(() => {
        note.body.should.equal('Pay phone bill');
        note.updated_date.should.not.equal(oldDate);
        done();
      });
    });
  });
});