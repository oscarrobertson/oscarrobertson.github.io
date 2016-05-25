'use strict';

var MemeBot = require('../lib/memebot');

var token = process.env.BOT_API_KEY.trim();
var name = process.env.BOT_NAME;

var memebot = new MemeBot({
    token: token,
    name: name
});

memebot.run();