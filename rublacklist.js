#!/usr/bin/env node
var Twit = require('twit'),
needle = require('needle'),
async = require('async'),
mustache = require('mustache'),
config = require('./config.json');

needle.get('http://api.antizapret.info/diff.php?key=' + config.antizapret_key, function(error, response) {
  if (!error && response.statusCode == 200) {
    parseEverything(response.body);
  }
});

function parseEverything(json) {
  if (json.recordsAdded) {
    async.each(json.recordsAdded, function(record) {
      async.each(config.accounts, function(conf) {
        if ('translate' in conf && conf.translate[record.org]) {
          record.org = conf.translate[record.org];
        }
        postTweet(mustache.render(conf.template, {
          org: record.org,
          url: record.url,
          ip: record.ip,
          number: record.org_act}), conf.tokens);
      });
    });
  }
  if (json.recordsRemoved) {
    async.each(json.recordsRemoved, function(record) {
      async.each(config.accounts, function(conf) {
        postTweet(mustache.render(conf.template_removed, {
          url: record.url,
          ip: record.ip}), conf.tokens);
      });
    });
  }
}

function postTweet(tweet,tokens) {
  var T = new Twit(tokens);
  T.post('statuses/update', { status: tweet }, function(err, data, response) {
    if (err) console.log(err);
  });
  console.log(tweet);
}
