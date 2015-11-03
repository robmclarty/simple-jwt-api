'use strict';

let Waterline = require('waterline');
let bcrypt = require('bcrypt-nodejs');

function afterValidate(values, next) {
  bcrypt.genSalt(10, function (saltError, salt) {
    if (saltError) {
      return next(saltError);
    }

    bcrypt.hash(values.password, salt, null, function (hashError, hash) {
      if (hashError) {
        return next(hashError);
      }

      values.password = hash;
      next();
    });
  });
}

function verifyPassword(password, next) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) {
      return next(err);
    }

    next(null, isMatch);
  });
}

// Create the payload for the JWT token. This will become available as
// req.auth for use throughout the app during a request. This is separate
// from the higher-level toJSON() method so that it can be made different if
// need be, not necessarily the whole user object.
function tokenPayload() {
  return {
    id: this.id,
    username: this.username,
    isAdmin: this.isAdmin
  };
}

// Explicitly return a user object with public properties (i.e., no password).
function toJSON() {
  return {
    id: this.id,
    username: this.username,
    isAdmin: this.isAdmin
  };
}

let User = Waterline.Collection.extend({
  identity: 'user',
  connection: 'local-mongo',
  tableName: 'users',
  migrate: 'safe',

  afterValidate: afterValidate,

  attributes: {
    username: {
      type: 'string',
      unique: true,
      required: true
    },
    password: {
      type: 'string',
      minLength: 6,
      required: true
    },
    isAdmin: {
      type: 'boolean',
      defaultsTo: false
    },

    verifyPassword: verifyPassword,
    tokenPayload: tokenPayload,
    toJSON: toJSON
  }
});

module.exports = User;
