'use strict';

import mocha from 'mocha';
import supertest from 'supertest';
import app from '../../../index';
import should from 'should';
import sinon from 'sinon';
import utils from '../../utils';
import http from 'http';
import mongoose from 'mongoose';

import * as ctrl from '../../../controllers/note';
import User from '../../../models/user';
import Note from '../../../models/note';

const ObjectId = mongoose.Types.ObjectId;
const agent = supertest.agent(app);

describe('Note controller', () => {

  it('should have an addNote method', () => {
    ctrl.addNote.should.exist;
    (typeof ctrl.addNote).should.equal('function');
  });

  it('should have a getNotes method', () => {
    ctrl.getNotes.should.exist;
    (typeof ctrl.getNotes).should.equal('function');
  });

  it('should have a getNote method', () => {
    ctrl.getNote.should.exist;
    (typeof ctrl.getNote).should.equal('function');
  });

  it('should have an updateNote method', () => {
    ctrl.updateNote.should.exist;
    (typeof ctrl.updateNote).should.equal('function');
  });

  it('should have a removeNote method', () => {
    ctrl.removeNote.should.exist;
    (typeof ctrl.removeNote).should.equal('function');
  });

  describe('when creating a note', () => {

    beforeEach(done => {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', done => {
      agent
        .post('/api/notes')
        .send({ user: new ObjectId, title: 'My note', body: 'Test Note' })
        .expect(401)
        .expect((res) => {
          res.body.success.should.be.false;
          res.body.message.should.equal('Unauthorized request.');
          res.body.errors.should.be.ok;
        })
        .end(done);
    });

    it('should return a 403 response with an object containing success and message properties if note is invalid', done => {
      const user = new User({ email: ['user@test.com'], password: '123456' });

      user.save((err, user) => {
        if (err) done(err);

        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end((err, res) => {
            agent
              .post('/api/notes')
              .send()
              .expect(403)
              .expect((res) => {
                res.body.success.should.be.false;
                res.body.message.should.equal('Note validation failed');
                res.body.errors.should.be.ok;
              })
              .end(done);
          });
      });
    });

    it('should send a 201 response with an object containing success, message and data properties', done => {
      const user = new User({ email: ['user@test.com'], password: '123456' });

      user.save((err, user) => {
        if (err) done(err);
        
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end((err, res) => {
            agent
              .post('/api/notes')
              .send({ user: user._id, title: 'My note', body: 'Test Note' })
              .expect(201)
              .expect((res) => {
                res.body.success.should.be.true;
                res.body.message.should.equal('Note created successfully.');
                res.body.data.should.be.ok;

                String(res.body.data.user._id).should.equal(String(user._id));
                res.body.data.title.should.equal('My note');
                res.body.data.body.should.equal('Test Note');
              })
              .end(done);
          });
      });
    });
  });

  describe('when updating a note', () => {
    
    beforeEach(done => {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', done => {
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });

      note.save((err, note) => {
        agent
          .put('/api/notes/' + note._id)
          .send({ body: 'Testing' })
          .expect(401)
          .expect((res) => {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', done => {
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });
      const user = new User({ email: ['user@test.com'], password: '123456' });

      note.save((err, note) => {
        if (err) done(err);

        user.save((err, user) => {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end((err, res) => {
              agent
                .put('/api/notes/' + note._id)
                .send({ body: 'Testing' })
                .expect(200)
                .expect((res) => {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Note updated successfully.');
                  res.body.data.should.be.ok;
                  
                  res.body.data.body.should.equal('Testing');
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when removing a note', () => {
    
    beforeEach(done => {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', done => {
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });

      note.save((err, note) => {
        agent
          .delete('/api/notes/' + note._id)
          .send()
          .expect(401)
          .expect((res) => {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 200 response with an object containing success and message properties', done => {
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });
      const user = new User({ email: ['user@test.com'], password: '123456' });

      note.save((err, note) => {
        if (err) done(err);

        user.save((err, user) => {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end((err, res) => {
              agent
                .delete('/api/notes/' + note._id)
                .send()
                .expect(200)
                .expect((res) => {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Note removed successfully.');
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when retrieving a note', () => {
    
    beforeEach(done => {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', done => {
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });

      note.save((err, note) => {
        agent
          .get('/api/notes/' + note._id)
          .send({ body: 'Testing' })
          .expect(401)
          .expect((res) => {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 404 response with an object containing success, message and empty data properties if note not found', done => {
      const user = new User({ email: ['user@test.com'], password: '123456' });

      user.save((err, user) => {
        if (err) done(err);
        
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end((err, res) => {
            agent
              .get('/api/notes/54216e49cc65bfc42b1f0e6f')
              .send()
              .expect(404)
              .expect((res) => {
                res.body.success.should.be.false;
                res.body.message.should.equal('Note not found.');
              })
              .end(done);
          });
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', done => {
      const userId = new ObjectId();
      const note = new Note({ user: new ObjectId, title: 'My note', body: 'Test Note' });
      const user = new User({ email: ['user@test.com'], password: '123456' });

      note.save((err, note) => {
        if (err) done(err);

        user.save((err, user) => {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end((err, res) => {
              agent
                .get('/api/notes/' + note._id)
                .send()
                .expect(200)
                .expect((res) => {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Note found.');
                  res.body.data.should.be.ok;
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when retrieving notes belonging to a user', () => {

    let user1 = null;
    let note1 = null;
    let note2 = null;
    
    beforeEach(done => {
      user1 = new User({
        email: ['user1@test.com'],
        password: '123456'
      });
      note1 = new Note({ user: user1._id, title: 'My note for 1', body: '1st Test Note' });
      note2 = new Note({ user: user1._id, title: 'My note for 1', body: '2nd Test Note' });

      // TODO: refactor callback hell...
      user1.save((err, user1) => {
        if (err) done(err);
        note1.save((err, note1) => {
          if (err) done(err);
          note2.save((err, note2) => {
            if (err) done(err);
            agent
              .get('/api/auth/logout')
              .end(done);
          })
        })
      });
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', done => {
      agent
        .get('/api/notes')
        .send()
        .expect(401)
        .expect((res) => {
          res.body.success.should.be.false;
          res.body.message.should.equal('Unauthorized request.');
          res.body.errors.should.be.ok;
        })
        .end(done);
    });

    it('should send a 200 response with an object containing success and message properties if notes not found', done => {
      const user = new User({ email: ['user@test.com'], password: '123456' });

      user.save((err, user) => {
        if (err) done(err);
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end((err, res) => {
            agent
              .get('/api/notes')
              .send()
              .expect(200)
              .expect((res) => {
                res.body.success.should.be.true;
                res.body.message.should.equal('No notes found belonging to user.');
                res.body.data.length.should.equal(0);
              })
              .end(done);
          });
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', done => {
      agent
        .post('/api/auth/login')
        .send({ email: 'user1@test.com', password: '123456' })
        .end((err, res) => {
          agent
            .get('/api/notes')
            .send()
            .expect(200)
            .expect((res) => {
              res.body.success.should.be.true;
              res.body.message.should.equal('Notes belonging to user ' + user1._id + '.');
              res.body.data.length.should.equal(2);
              res.body.data[0].title.should.equal('My note for 1');
              res.body.data[0].body.should.equal('2nd Test Note');
              res.body.data[1].title.should.equal('My note for 1');
              res.body.data[1].body.should.equal('1st Test Note');
            })
            .end(done);
        });
    });
  });
});