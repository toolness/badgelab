var MongoClient = require('mongodb').MongoClient;

var EXPIRY = 60 * 60 * 24;

function MongoBucket(collection) {
  var self = {};

  self.set = function(path, content, cb) {
    collection.update({
      path: path,
    }, {
      path: path,
      content: content,
      created: new Date()
    }, {
      safe: true,
      upsert: true
    }, function(err) {
      cb(err);
    });
  };

  self.get = function(path, cb) {
    collection.findOne({
      path: path
    }, function(err, item) {
      cb(err, item && item.content);
    });
  };

  return self;
};

MongoBucket.connect = function(url, cb) {
  MongoClient.connect(url, function(err, db) {
    if (err) return cb(err);

    var collection = db.collection('paths');

    collection.ensureIndex({path: 1}, {
      safe: true,
      unique: true
    }, function(err) {
      if (err) return cb(err);

      collection.ensureIndex({created: 1}, {
        safe: true,
        expireAfterSeconds: EXPIRY
      }, function(err) {
        if (err) return cb(err);

        cb(null, MongoBucket(collection));
      });
    });
  });
};

module.exports = MongoBucket;
