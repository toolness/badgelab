var contents = {};

exports.set = function(path, content, cb) {
  contents[path] = content;
  cb(null);
};

exports.get = function(path, cb) {
  cb(null, contents[path] || null);
};
