Badge Lab is a simple website that makes it easy for people to experiment
with creating "hand-made" badges to learn more about Open Badges.

## Quick Start

```bash
$ npm install
$ node app.js
```

Then visit http://localhost:3000.

## Environment Variables

* `PORT` is the port to serve the website on. Defaults to 3000.

* `ORIGIN` is the origin that the website is served from. If unspecified,
  it defaults to `http://localhost:` followed by the value of `PORT`.

* `MONGO_URL` is the [MongoDB URL][] to the MongoDB database to use for
  persistent storage. The documents contained here will only be stored for
  a maximum of 1 day via MongoDB's [TTL][] functionality. If unspecified,
  the website will store all user data in-process.

* `MONGOHQ_URL` is a synonym for `MONGO_URL`, useful as a zero-configuration
  solution if you're hosting the website on Heroku and use the
  [MongoHQ addon][].

## License

[MIT][].

  [MongoDB URL]: http://docs.mongodb.org/manual/reference/connection-string/
  [TTL]: http://docs.mongodb.org/manual/tutorial/expire-data/
  [MongoHQ addon]: https://addons.heroku.com/mongohq
  [MIT]: http://opensource.org/licenses/MIT
