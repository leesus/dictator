'use strict';

// http://www.scotchmedia.com/tutorials/express/authentication/1/06
import config from '../config/secrets';
import mongoose from 'mongoose';

let secrets = config.test;

beforeEach((done) => {
 function clearDB() {
   for (var i in mongoose.connection.collections) {
     mongoose.connection.collections[i].remove(() => {});
   }
   return done();
 }

 if (mongoose.connection.readyState === 0) {
   mongoose.connect(secrets.db, (err) => {
     if (err) throw err;

     return clearDB();
   });
 } else {
   return clearDB();
 }
});

afterEach((done) => {
 mongoose.disconnect();

 return done();
});