export default {
  development: {
    db: process.env.MONGODB || 'mongodb://localhost:27017/development',

    sessionSecret: process.env.SESSION_SECRET || 'mary had a little lamb, little lamb, little lamb',

    facebook: {
      clientID: process.env.FACEBOOK_ID || '888236434526836',
      clientSecret: process.env.FACEBOOK_SECRET || 'a52014a659543e48cd9b52aa555b71a3',
      callbackURL: '/api/auth/facebook/callback',
      passReqToCallback: true
    }
  },
  test: {
    db: process.env.MONGODB || 'mongodb://localhost:27017/test',

    sessionSecret: process.env.SESSION_SECRET || 'mary had a little lamb, little lamb, little lamb',

    facebook: {
      clientID: process.env.FACEBOOK_ID || '888236434526836',
      clientSecret: process.env.FACEBOOK_SECRET || 'a52014a659543e48cd9b52aa555b71a3',
      callbackURL: '/api/auth/facebook/callback',
      passReqToCallback: true
    }
  },
  production: {}
};