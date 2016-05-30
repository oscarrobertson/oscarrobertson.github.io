'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('./slackbots-extend.js');
var Reddit = require('./reddit.js');
var sqlite3 = require("sqlite3").verbose();
var MathPng = require('./mathPng.js');
const pn = require("pn/fs");

var MemeBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'memebot';
    this.dbPath = path.resolve(process.cwd(), 'data', 'spicy.db');
    var dbExists = fs.existsSync(this.dbPath);

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(MemeBot, Bot);

module.exports = MemeBot;

MemeBot.prototype.run = function () {
    MemeBot.super_.call(this, this.settings);

    this.reddit = new Reddit();
    this.mathPng = new MathPng();

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

MemeBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
};

MemeBot.prototype._connectDb = function () {
    this.db = new sqlite3.Database(this.dbPath);
    var self = this;
    self.db.serialize(function() {  
        self.db.run("CREATE TABLE if not exists responses (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, cue TEXT NOT NULL, response TEXT NOT NULL)");  
    });
};

MemeBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

MemeBot.prototype._onMessage = function (message) {
	

    // make bot ignore some messages
    if (!this._isChatMessage(message)) return;
    if (this._isFromMemeBot(message)) return;
    if (!this._isChannelConversation(message)) return;

    console.log(message);

    if (this._isMentioningMemeBot(message)) {
        this._processMessage(message);
    }

    else if (this._isFromSlackbot(message)){
        this._replyWithSlackbotAbuse(message);
    }

    else {
        this._checkForCues(message);
    }

};

MemeBot.prototype._processMessage = function (message) {
    if (isInMessage(message,'me_irl')) return this._replyWithMeIrl(message);

    if (isInMessage(message,'-add')) return this._addNewResponse(message);
    if (isInMessage(message, '-responses')) return this._sayAllResponses(message);
    if (isInMessage(message, '-del')) return this._delResponse(message);
    if (isInMessage(message, '-maths')) return this._mathsResponse(message);

}

MemeBot.prototype._mathsResponse = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    var r = /-maths /
    var ind = message.text.search(r);
    this.mathPng.mathPng(message.text.slice(ind + 7), function(promise) {
        var now = Date.now();
        var fileName = "data/img/math"+now.toString()+".png";
        promise.then(buffer => pn.writeFile(fileName, buffer, function(err) {
            self.upload(channel.name, fileName, {as_user: true, channels : message.channel});
            fs.unlink(fileName);
        }))
        .catch(e => console.error(e));
    });
}

// MemeBot.prototype._imgResponse = function (message) {
//     var self = this;
//     var channel = self._getChannelById(message.channel);
//     self.upload(channel.name, "lib/math.png", {as_user: true, channels : message.channel});
// }

MemeBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

MemeBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' && (message.channel[0] === 'C');
};


MemeBot.prototype._isFromMemeBot = function (message) {
    return message.user === this.user.id;
};


MemeBot.prototype._isMentioningMemeBot = function (message) {
    return (isInMessage(message,'memebot')
        || isInMessage(message,this.name));
};

MemeBot.prototype._isFromSlackbot = function (message) {
    return message.user === "USLACKBOT";
};

MemeBot.prototype._replyWithSlackbotAbuse = function (originalMessage) {
    var self = this;
    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, "Leave now slackbot, there's a new top bot in town", {as_user: true});

};

MemeBot.prototype._replyWithMeIrl = function (originalMessage) {
    var self = this;
    var channel = self._getChannelById(originalMessage.channel);
    this.reddit.get_hot("me_irl", function(title, url){
        self.postMessageToChannel(channel.name, title + "\n" + url, {as_user: true});
    });
};

MemeBot.prototype._addNewResponse = function(message) {
    var channel = this._getChannelById(message.channel);
    var cue = "";
    var response = "";
    var pattern = /".*".*".*"/;
    var result = message.text.match(pattern);
    if (result == null) {
        this.postMessageToChannel(channel.name, "Looks like you entered the -add command wrong", {as_user: true});
        return;
    }

    result = result[0].split('"');
    cue = result[1];
    response = result[3];
    console.log("adding " + cue + ", " + response);
    var self = this;

    this.db.serialize(function() {
        var stmt = self.db.prepare("INSERT INTO responses (cue, response) VALUES (?,?)");
        stmt.run(cue, response);
        stmt.finalize();
        self.postMessageToChannel(channel.name, "Added the response", {as_user: true});
    });
};

MemeBot.prototype._delResponse = function(message) {
    var channel = this._getChannelById(message.channel);
    var cue = "";
    var pattern = /".*"/;
    var result = message.text.match(pattern);
    if (result == null) {
        this.postMessageToChannel(channel.name, "Looks like you entered the -add command wrong", {as_user: true});
        return;
    }

    result = result[0].split('"');
    cue = result[1];
    console.log("removing " + cue);
    var self = this;

    this.db.serialize(function() {
        var stmt = self.db.prepare("DELETE FROM responses WHERE cue = ?");
        stmt.run(cue);
        stmt.finalize();
        self.postMessageToChannel(channel.name, "Removed the response", {as_user: true});
    });
};

// MemeBot.prototype._getChannelById = function (channelId) {
//     return this.channels.filter(function (item) {
//         return item.id === channelId;
//     })[0];
// };

function isInMessage(message, text){
    return message.text.toLowerCase().indexOf(text) > -1
};

MemeBot.prototype._checkForCues = function(message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    self.db.serialize(function() {
        self.db.each("SELECT cue, response FROM responses", function(err, row) {
            if (isInMessage(message,row.cue.toLowerCase())) self.postMessageToChannel(channel.name, row.response, {as_user: true});
        }); 
    });
}

MemeBot.prototype._sayAllResponses = function(message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    self.db.serialize(function() {
        self.db.each("SELECT id, cue, response FROM responses", function(err, row) {  
            self.postMessageToChannel(channel.name, "Cue : " + row.cue + ", Response : " + row.response, {as_user: true});
        }); 
    });
};

MemeBot.prototype._printDB = function() {
    var self = this;
    self.db.serialize(function() {
        self.db.each("SELECT id, cue, response FROM responses", function(err, row) {  
            console.log(row);  
        }); 
    });
};
