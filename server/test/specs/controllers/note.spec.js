'use strict';

import mocha from 'mocha';
import supertest from 'supertest';
import app from '../../../index';
import should from 'should';
import sinon from 'sinon';
import utils from '../../utils';
import http from 'http';
import mongoose from 'mongoose';

import debtController from '../../../controllers/note';
import User from '../../../models/user';
import Debt from '../../../models/note';

let ObjectId = mongoose.Types.ObjectId;
let agent = supertest.agent(app);

xdescribe('Note controller', function() {

  it('should have an addDebt method', function() {
    debtController.addDebt.should.exist;
    (typeof debtController.addDebt).should.equal('function');
  });

  it('should have a getDebtsOwedByUser method', function() {
    debtController.getDebtsOwedByUser.should.exist;
    (typeof debtController.getDebtsOwedByUser).should.equal('function');
  });

  it('should have a getDebtsOwedToUser method', function() {
    debtController.getDebtsOwedToUser.should.exist;
    (typeof debtController.getDebtsOwedToUser).should.equal('function');
  });

  it('should have a getDebt method', function() {
    debtController.getDebt.should.exist;
    (typeof debtController.getDebt).should.equal('function');
  });

  it('should have an updateDebt method', function() {
    debtController.updateDebt.should.exist;
    (typeof debtController.updateDebt).should.equal('function');
  });

  it('should have a removeDebt method', function() {
    debtController.removeDebt.should.exist;
    (typeof debtController.removeDebt).should.equal('function');
  });

  describe('when creating a debt', function() {

    beforeEach(function(done) {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      agent
        .post('/api/debts')
        .send({ debtor: new ObjectId, date: Date.now(), reference: 'Test bill', amount: 42.56 })
        .expect(401)
        .expect(function(res) {
          res.body.success.should.be.false;
          res.body.message.should.equal('Unauthorized request.');
          res.body.errors.should.be.ok;
        })
        .end(done);
    });

    it('should return a 403 response with an object containing success and message properties if debt is invalid', function(done) {
      var date = Date.now();
      var debtorId = new ObjectId();

      var user = new User({ email: ['user@test.com'], password: '123456' });
      user.save(function(err, user) {
        if (err) done(err);

        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end(function(err, res){
            agent
              .post('/api/debts')
              .send()
              .expect(403)
              .expect(function(res) {
                res.body.success.should.be.false;
                res.body.message.should.equal('Validation failed');
                res.body.errors.should.be.ok;
              })
              .end(done);
          });
      });
    });

    it('should send a 201 response with an object containing success, message and data properties', function(done) {
      var date = Date.now();
      var debtorId = new ObjectId();

      var user = new User({ email: ['user@test.com'], password: '123456' });
      user.save(function(err, user) {
        if (err) done(err);
        
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end(function(err, res){
            agent
              .post('/api/debts')
              .send({ debtor: debtorId, date: date, reference: 'Test bill', amount: 42.56 })
              .expect(201)
              .expect(function(res) {
                res.body.success.should.be.true;
                res.body.message.should.equal('Debt created successfully.');
                res.body.data.should.be.ok;

                String(res.body.data.creditor).should.equal(String(user._id));
                String(res.body.data.debtor).should.equal(String(debtorId));
                (new Date(res.body.data.date).getTime()).should.equal(date);
                res.body.data.reference.should.equal('Test bill');
                res.body.data.amount.should.equal(42.56);
              })
              .end(done);
          });
      });
    });
  });

  describe('when updating a debt', function() {
    
    beforeEach(function(done) {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: Date.now(),
        reference: 'Test debt',
        amount: 1
      });

      debt.save(function (err, debt) {
        agent
          .put('/api/debts/' + debt._id)
          .send({ amount: 42.56 })
          .expect(401)
          .expect(function(res) {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', function(done) {
      var date = Date.now();
      var debtorId = new ObjectId();

      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: date,
        reference: 'Test debt',
        amount: 1
      });
      var user = new User({ email: ['user@test.com'], password: '123456' });

      debt.save(function(err, debt) {
        if (err) done(err);

        user.save(function(err, user) {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end(function(err, res){
              agent
                .put('/api/debts/' + debt._id)
                .send({ amount: 42.56 })
                .expect(200)
                .expect(function(res) {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Debt updated successfully.');
                  res.body.data.should.be.ok;
                  
                  (new Date(res.body.data.updated_date).getTime()).should.not.equal(date);
                  res.body.data.amount.should.equal(42.56);
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when removing a debt', function() {
    
    beforeEach(function(done) {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: Date.now(),
        reference: 'Test debt',
        amount: 1
      });

      debt.save(function (err, debt) {
        agent
          .delete('/api/debts/' + debt._id)
          .send()
          .expect(401)
          .expect(function(res) {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 200 response with an object containing success and message properties', function(done) {
      var date = Date.now();
      var debtorId = new ObjectId();

      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: date,
        reference: 'Test debt',
        amount: 1
      });
      var user = new User({ email: ['user@test.com'], password: '123456' });

      debt.save(function(err, debt) {
        if (err) done(err);

        user.save(function(err, user) {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end(function(err, res){
              agent
                .delete('/api/debts/' + debt._id)
                .send()
                .expect(200)
                .expect(function(res) {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Debt removed successfully.');
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when retrieving a debt', function() {
    
    beforeEach(function(done) {
      agent
        .get('/api/auth/logout')
        .end(done);
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: Date.now(),
        reference: 'Test debt',
        amount: 1
      });

      debt.save(function (err, debt) {
        agent
          .get('/api/debts/' + debt._id)
          .send({ amount: 42.56 })
          .expect(401)
          .expect(function(res) {
            res.body.success.should.be.false;
            res.body.message.should.equal('Unauthorized request.');
            res.body.errors.should.be.ok;
          })
          .end(done);
      });
    });

    it('should send a 200 response with an object containing success, message and empty data properties if debt not found', function(done) {
      var user = new User({ email: ['user@test.com'], password: '123456' });

      user.save(function(err, user) {
        if (err) done(err);
        
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end(function(err, res){
            agent
              .get('/api/debts/54216e49cc65bfc42b1f0e6f')
              .send()
              .expect(200)
              .expect(function(res) {
                res.body.success.should.be.false;
                res.body.message.should.equal('Debt not found.');
                res.body.data.length.should.equal(0);
              })
              .end(done);
          });
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', function(done) {
      var date = Date.now();
      var debtorId = new ObjectId();

      var debt = new Debt({
        debtor: new ObjectId,
        creditor: new ObjectId,
        date: date,
        reference: 'Test debt',
        amount: 1
      });
      var user = new User({ email: ['user@test.com'], password: '123456' });

      debt.save(function(err, debt) {
        if (err) done(err);

        user.save(function(err, user) {
          if (err) done(err);
          
          agent
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: '123456' })
            .end(function(err, res){
              agent
                .get('/api/debts/' + debt._id)
                .send()
                .expect(200)
                .expect(function(res) {
                  res.body.success.should.be.true;
                  res.body.message.should.equal('Debt found.');
                  res.body.data.should.be.ok;
                })
                .end(done);
            });
        });
      });
    });
  });

  describe('when retrieving debts owed to a user', function() {

    var user1 = null;
    var user2 = null;
    var debt1 = null;
    var debt2 = null;
    var debt3 = null;
    var debt4 = null;
    
    beforeEach(function(done) {
      user1 = new User({
        email: ['user1@test.com'],
        password: '123456'
      });
      user2 = new User({
        email: ['user2@test.com'],
        password: '123456'
      });
      debt1 = new Debt({
        debtor: user1._id,
        creditor: user2._id,
        date: Date.now() + 1,
        reference: 'Test owed by 1 to 2',
        amount: 1
      });
      debt2 = new Debt({
        debtor: user2._id,
        creditor: user1._id,
        date: Date.now() + 2,
        reference: 'Test owed by 2 to 1',
        amount: 1
      });
      debt3 = new Debt({
        debtor: user1._id,
        creditor: user2._id,
        date: Date.now() + 3,
        reference: 'Test owed by 1 to 2',
        amount: 2
      });
      debt4 = new Debt({
        debtor: user2._id,
        creditor: user1._id,
        date: Date.now() + 4,
        reference: 'Test owed by 2 to 1',
        amount: 2
      });

      // TODO: refactor callback hell...
      user1.save(function(err, user1) {
        if (err) done(err);
        user2.save(function(err, user2) {
          if (err) done(err);
          debt1.save(function(err, debt1) {
            if (err) done(err);
            debt2.save(function(err, debt2) {
              if (err) done(err);
              debt3.save(function(err, debt3) {
                if (err) done(err);
                debt4.save(function(err, debt4) {
                  if (err) done(err);
                  agent
                    .get('/api/auth/logout')
                    .end(done);
                })
              })
            })
          })
        })
      });
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      agent
        .get('/api/debts/owed')
        .send()
        .expect(401)
        .expect(function(res) {
          res.body.success.should.be.false;
          res.body.message.should.equal('Unauthorized request.');
          res.body.errors.should.be.ok;
        })
        .end(done);
    });

    it('should send a 200 response with an object containing success and message properties if debt not found', function(done) {
      var user = new User({ email: ['user@test.com'], password: '123456' });

      user.save(function(err, user) {
        if (err) done(err);
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end(function(err, res){
            agent
              .get('/api/debts/owed')
              .send()
              .expect(200)
              .expect(function(res) {
                res.body.success.should.be.true;
                res.body.message.should.equal('No debts found to be owed to user.');
                res.body.data.length.should.equal(0);
              })
              .end(done);
          });
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', function(done) {
      agent
        .post('/api/auth/login')
        .send({ email: 'user1@test.com', password: '123456' })
        .end(function(err, res){
          agent
            .get('/api/debts/owed')
            .send()
            .expect(200)
            .expect(function(res) {
              res.body.success.should.be.true;
              res.body.message.should.equal('Debts owed to user ' + user1._id + '.');
              res.body.data.length.should.equal(2);
              res.body.data[0].reference.should.equal('Test owed by 2 to 1');
              res.body.data[0].amount.should.equal(1);
              res.body.data[1].reference.should.equal('Test owed by 2 to 1');
              res.body.data[1].amount.should.equal(2);
            })
            .end(done);
        });
    });
  });

  describe('when retrieving debts owed by a user', function() {

    var user1 = null;
    var user2 = null;
    var debt1 = null;
    var debt2 = null;
    var debt3 = null;
    var debt4 = null;
    
    beforeEach(function(done) {
      user1 = new User({
        email: ['user1@test.com'],
        password: '123456'
      });
      user2 = new User({
        email: ['user2@test.com'],
        password: '123456'
      });
      debt1 = new Debt({
        debtor: user1._id,
        creditor: user2._id,
        date: Date.now() + 1,
        reference: 'Test owed by 1 to 2',
        amount: 1
      });
      debt2 = new Debt({
        debtor: user2._id,
        creditor: user1._id,
        date: Date.now() + 2,
        reference: 'Test owed by 2 to 1',
        amount: 1
      });
      debt3 = new Debt({
        debtor: user1._id,
        creditor: user2._id,
        date: Date.now() + 3,
        reference: 'Test owed by 1 to 2',
        amount: 2
      });
      debt4 = new Debt({
        debtor: user2._id,
        creditor: user1._id,
        date: Date.now() + 4,
        reference: 'Test owed by 2 to 1',
        amount: 2
      });

      // TODO: refactor callback hell...
      user1.save(function(err, user1) {
        if (err) done(err);
        user2.save(function(err, user2) {
          if (err) done(err);
          debt1.save(function(err, debt1) {
            if (err) done(err);
            debt2.save(function(err, debt2) {
              if (err) done(err);
              debt3.save(function(err, debt3) {
                if (err) done(err);
                debt4.save(function(err, debt4) {
                  if (err) done(err);
                  agent
                    .get('/api/auth/logout')
                    .end(done);
                })
              })
            })
          })
        })
      });
    });

    it('should return a 401 response with an object containing success, message and error properties if user not authenticated', function(done) {
      agent
        .get('/api/debts/owes')
        .send()
        .expect(401)
        .expect(function(res) {
          res.body.success.should.be.false;
          res.body.message.should.equal('Unauthorized request.');
          res.body.errors.should.be.ok;
        })
        .end(done);
    });

    it('should send a 200 response with an object containing success and message properties if debt not found', function(done) {
      var user = new User({ email: ['user@test.com'], password: '123456' });

      user.save(function(err, user) {
        if (err) done(err);
        
        agent
          .post('/api/auth/login')
          .send({ email: 'user@test.com', password: '123456' })
          .end(function(err, res){
            agent
              .get('/api/debts/owes')
              .send()
              .expect(200)
              .expect(function(res) {
                res.body.success.should.be.true;
                res.body.message.should.equal('No debts found to be owed by user.');
                res.body.data.length.should.equal(0);
              })
              .end(done);
          });
      });
    });

    it('should send a 200 response with an object containing success, message and data properties', function(done) {
      agent
        .post('/api/auth/login')
        .send({ email: 'user1@test.com', password: '123456' })
        .end(function(err, res){
          agent
            .get('/api/debts/owes')
            .send()
            .expect(200)
            .expect(function(res) {
              res.body.success.should.be.true;
              res.body.message.should.equal('Debts owed by user ' + user1._id + '.');
              res.body.data.length.should.equal(2);
              res.body.data[0].reference.should.equal('Test owed by 1 to 2');
              res.body.data[0].amount.should.equal(1);
              res.body.data[1].reference.should.equal('Test owed by 1 to 2');
              res.body.data[1].amount.should.equal(2);
            })
            .end(done);
        });
    });
  });
});