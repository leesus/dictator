'use strict';

import mocha from 'mocha';
import supertest from 'supertest';
import should from 'should';
import sinon from 'sinon';
import utils from '../../utils';

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import Note from '../../../models/note';
import User from '../../../models/user';

let isArray = Array.isArray;

let user, notes;

describe('User model', () => {

  beforeEach((done) => {
    notes = new Note;
    
    user = new User({
      first_name: 'Lee',
      last_name: 'Ellam',
      display_name: 'Leesus',
      email: ['test@test.com'],
      password: 'test',
      facebook: {
        id: '12345',
        token: 'abc123'
      },
      notes: [notes]
    });

    user.save(() => {
      done();
    });
  });

  it('should have a first_name property', () => {
    user.first_name.should.equal('Lee');
  });

  it('should have a last_name property', () => {
    user.last_name.should.equal('Ellam');
  });

  it('should have a display_name property', () => {
    user.display_name.should.equal('Leesus');
  });

  it('should have an email array property', () => {
    isArray(user.email).should.be.true;
    user.email[0].should.equal('test@test.com');
  });

  it('should have a password property', () => {
    user.password.should.be.ok;
  });

  it('should have a facebook.id property', () => {
    user.facebook.id.should.equal('12345');
  });

  it('should have a facebook.token property', () => {
    user.facebook.token.should.equal('abc123');
  });

  it('should have a non-null created_date property', () => {
    user.created_date.should.not.equal(null);
  });

  it('should have an notes array property', () => {
    isArray(user.notes).should.be.true;
    user.notes[0].should.equal(notes._id);
  });

  it('should have a comparePassword method', (done) => {
    user.comparePassword('test', (err, isMatch) => {
      isMatch.should.equal(true);
      done();
    });
  });

  describe('when saving', () => {

    beforeEach(() => {
      sinon.spy(bcrypt, 'hash');
    });

    afterEach(() => {
      bcrypt.hash.restore();
    });

    it('shouldn\'t hash the password if not changed', (done) => {
      user.comparePassword('test', (err, isMatch) => {
        isMatch.should.equal(true);
        
        user.save(() => {
          bcrypt.hash.called.should.be.false;
          done();
        });
      });
    });

    it('should hash the password if changed', (done) => {
      user.password = 'dogpoo';
      user.save(() => {
        bcrypt.hash.called.should.be.true;
        done();
      });
    });
  });
});