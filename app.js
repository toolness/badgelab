var fs = require('fs');
var express = require('express');
var nunjucks = require('nunjucks');
var mime = require('mime');

var bucket;

var PORT = process.env.PORT || 3000;
var MONGO_URL = process.env.MONGO_URL || process.env.MONGOHQ_URL;
var ORIGIN = process.env.ORIGIN || 'http://localhost:' + PORT;
var MAX_CONTENT_SIZE = 256 * 1024;

var app = express();
var templateLoader = new nunjucks.FileSystemLoader(__dirname + '/templates');
var env = new nunjucks.Environment(templateLoader);

function bucketify(options) {
  var extension = new RegExp("\\" + options.ext + "$");
  var mimeType = mime.lookup(options.ext);

  return function(req, res, next) {
    if (!extension.test(req.url)) return next();
    if (req.method == "GET") {
      return bucket.get(req.url, function(err, content) {
        if (err) return next(err);
        req.bucketContent = content;
        if (explicitlyAcceptsHtml(req) && options.template)
          return res.status(content ? 200 : 404).render(options.template, {
            url: req.url,
            maxContentSize: MAX_CONTENT_SIZE,
            bucketContent: req.bucketContent
          });
        if (!content)
          return res.send(404);
        res.type(mimeType).send(content);
      });
    } else if (req.method == "POST") {
      return options.post(req, res, function(err) {
        if (err) return next(err);
        bucket.set(req.url, req.bucketContent, function(err) {
          if (err) return next(err);
          return res.redirect(303, req.url);
        });
      });
    } else {
      // TODO: Add Allow header
      return res.send(405);
    }
  };
}

function explicitlyAcceptsHtml(req) {
  for (var i = 0; i < req.accepted.length; i++) {
    if (req.accepted[i].value == 'text/html')
      return true;
  }
  return false;
}

function startApp() {
  app.listen(PORT, function() {
    console.log("listening on port", PORT);
  });
}

env.express(app);

app.use(express.limit(MAX_CONTENT_SIZE));
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

app.use(bucketify({
  ext: '.txt',
  template: 'txt.html',
  post: function(req, res, next) {
    var txt = (req.param('txt') || '').trim();

    req.bucketContent = txt || null;
    next();
  }
}));

app.use(bucketify({
  ext: '.json',
  template: 'json.html',
  post: function(req, res, next) {
    var json = (req.param('json') || '').trim();
    if (!json) {
      req.bucketContent = null;
      return next();
    }
    try {
      var content = JSON.parse(json);
    } catch (e) {
      return res.type("text").send(400, "Invalid JSON: " + e);
    }
    req.bucketContent = JSON.stringify(content, null, 2);
    next();
  }
}));

app.use(bucketify({
  ext: '.png',
  template: 'png.html',
  post: function(req, res, next) {
    if (!(req.files.png && req.files.png.size)) {
      req.bucketContent = null;
      return next();
    }
    fs.readFile(req.files.png.path, function(err, content) {
      if (err) return next(err);
      fs.unlink(req.files.png.path, function(err) {
        if (err) return next(err);
        req.bucketContent = content;
        next();        
      });
    });
  }
}));

app.get('/tutorial/:name', function(req, res, next) {
  res.render('tutorial.html', {
    origin: ORIGIN,
    name: req.param('name'),
    baseUrl: ORIGIN + '/' + req.param('name') + '/',
    now: (new Date()).toISOString()
  });
});

if (MONGO_URL) {
  console.log("using mongodb for storage.");
  require('./mongo-bucket').connect(MONGO_URL, function(err, mongoBucket) {
    if (err) throw err;
    bucket = mongoBucket;
    startApp();
  });
} else {
  bucket = require('./simple-bucket');
  console.log("using in-process memory for storage.");
  startApp();
}
