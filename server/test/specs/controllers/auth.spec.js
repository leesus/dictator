'use strict';

import mocha from 'mocha';
import supertest from 'supertest';
import app from '../../../index';
import should from 'should';
import sinon from 'sinon';
import utils from '../../utils';
import passport from 'passport';
import http from 'http';

import mongoose from 'mongoose';
import passportConfig from '../../../config/passport';
import * as ctrl from '../../../controllers/auth';
import User from '../../../models/user';

const agent = supertest.agent(app);

describe('Auth controller', () => {

  it('should have a login method', () => {
    ctrl.login.should.exist;
    (typeof ctrl.login).should.equal('function');
  });

  it('should have a signup method', () => {
    ctrl.signup.should.exist;
    (typeof ctrl.signup).should.equal('function');
  });

  it('should have a logout method', () => {
    ctrl.logout.should.exist;
    (typeof ctrl.logout).should.equal('function');
  });

  describe('when signing up a user', () => {

    it('should return a 403 response with an object containing success, message and errors properties when email or password are invalid', done => {
      agent
        .post('/api/auth/signup')
        .send({ email: 'blah', password: '123' })
        .expect(403)
        .expect(res => {
          res.body.success.should.be.false;
          res.body.message.should.equal('Signup failed.');
          res.body.errors[0].msg.should.equal('Email is not valid.');
          res.body.errors[1].msg.should.equal('Password must be at least 6 characters long.');
        })
        .end(done);
    });

    it('should authenticate with passport local strategy', done => {
      const passportSpy = sinon.spy(passport, 'authenticate');

      agent.post('/api/auth/signup')
        .send({ email: 'testuser1@test.com', password: 'password' })
        .end(() => {
          passportSpy.called.should.be.true;
          passportSpy.restore();
          done();
        });
    });

    it('should return a 409 response with an object containing success and message properties if passport authentication fails', done => {
      const user = new User({ email: ['alreadysignedup@test.com'], password: '123456' });
      user.save(() => {
        agent.post('/api/auth/signup')
          .send({ email: 'alreadysignedup@test.com', password: 'blahblah' })
          .expect(409)
          .expect(res => {
            res.body.success.should.be.false;
            res.body.message.should.equal('That email address is taken.');
          })
          .end(done);
      });
    });

    it('should call req.logIn and log in the user if created successfully', done => {
      const reqSpy = sinon.spy(http.IncomingMessage.prototype, 'logIn');

      agent
        .post('/api/auth/signup')
        .send({ email: 'testuser1@test.com', password: 'password' })
        .expect(() => {
          reqSpy.called.should.be.true;
          reqSpy.restore();
        })
        .end(done);
    });

    it('should set a \'user\' cookie', done => {
      agent
        .post('/api/auth/signup')
        .send({ email: 'testuser2@test.com', password: 'password' })
        .expect(res => {
          res.headers['set-cookie'].should.be.ok;
          res.headers['set-cookie'][0].indexOf('user').should.not.equal(-1);
        })
        .end(done);
    });

    it('should send a 201 response with an object containing success, message and data properties', done => {
      agent
        .post('/api/auth/signup')
        .send({ email: 'testuser3@test.com', password: 'password' })
        .expect(201)
        .expect(res => {
          res.body.success.should.be.true;
          res.body.message.should.equal('Account created successfully.');
          res.body.data.should.be.ok;
          res.body.data.email[0].should.equal('testuser3@test.com');
          res.body.data.password.should.not.equal(undefined);
        })
        .end(done);
    });
  });

  describe('when logging in a user', () => {
    beforeEach(done => {
      const user = new User({ email: ['alreadysignedup@test.com'], password: '123456' });
      user.save(done);
    });

    it('should return a 401 response with an object containing success, message and errors properties when email or password are invalid', done => {
      agent
        .post('/api/auth/login')
        .send({ email: 'blah' })
        .expect(401)
        .expect(res => {
          res.body.success.should.be.false;
          res.body.message.should.equal('Login failed.');
          res.body.errors[0].msg.should.equal('Email is not valid.');
          res.body.errors[1].msg.should.equal('Password cannot be blank.');
        })
        .end(done);
    });

    it('should authenticate with passport local strategy', done => {
      const passportSpy = sinon.spy(passport, 'authenticate');

      agent.post('/api/auth/login')
        .send({ email: 'alreadysignedup@test.com', password: '123456' })
        .end(() => {
          passportSpy.called.should.be.true;
          passportSpy.restore();
          done();
        });
    });

    it('should return a 401 response with an object containing success and message properties if passport authentication fails', done => {
      agent.post('/api/auth/login')
        .send({ email: 'notalreadysignedup@test.com', password: 'blahblah' })
        .expect(401)
        .expect(res => {
          res.body.success.should.be.false;
          res.body.message.should.equal('No user found.');
        })
        .end(done);
    });

    it('should call req.logIn and log in the user if created successfully', done => {
      const reqSpy = sinon.spy(http.IncomingMessage.prototype, 'logIn');

      agent
        .post('/api/auth/login')
        .send({ email: 'alreadysignedup@test.com', password: '123456' })
        .expect(() => {
          reqSpy.called.should.be.true;
          reqSpy.restore();
        })
        .end(done);
    });

    it('should set a \'user\' cookie', done => {
      agent
        .post('/api/auth/login')
        .send({ email: 'alreadysignedup@test.com', password: '123456' })
        .expect(res => {
          res.headers['set-cookie'].should.be.ok;
          res.headers['set-cookie'][0].indexOf('user').should.not.equal(-1);
        })
        .end(done);
    });

    it('should send a 200 response with an object containing success, message and data properties', done => {
      agent
        .post('/api/auth/login')
        .send({ email: 'alreadysignedup@test.com', password: '123456' })
        .expect(200)
        .expect(res => {
          res.body.success.should.be.true;
          res.body.message.should.equal('Login successful.');
          res.body.data.should.be.ok;
          res.body.data.email[0].should.equal('alreadysignedup@test.com');
          res.body.data.password.should.not.equal(undefined);
        })
        .end(done);
    });
  });

  describe('when logging out a user', () => {

    beforeEach(done => {
      agent
        .post('/api/auth/signup')
        .send({ email: 'alreadysignedup@test.com', password: 'password' })
        .end(done);
    });

    it('should call req.logout', done => {
      const reqSpy = sinon.spy(http.IncomingMessage.prototype, 'logout');

      agent
        .get('/api/auth/logout')
        .expect(() => {
          reqSpy.called.should.be.true;
          reqSpy.restore();
        })
        .end(done);
    });

    it('should send a 200 response with an object containing success and message properties', done => {
      agent
        .get('/api/auth/logout')
        .expect(200)
        .expect(res => {
          res.body.success.should.be.true;
          res.body.message.should.equal('Logout successful.')
        })
        .end(done);
    });
  });
});