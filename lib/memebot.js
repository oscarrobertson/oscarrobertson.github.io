'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');

var MemeBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'memebot';

    this.user = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(MemeBot, Bot);

module.exports = MemeBot;

MemeBot.prototype.run = function () {
    MemeBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};


MemeBot.prototype._onStart = function () {
    this._loadBotUser();
};

MemeBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

MemeBot.prototype._onMessage = function (message) {
	console.log("got message");
	console.log(message);
    if (this._isChatMessage(message) 
        && !this._isFromMemeBot(message)
        && this._isChannelConversation(message)
        && this._isMentioningMemeBot(message)) {

    		console.log("Replying");
        	this._replyWithRandomJoke(message);
    	
    }
};

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
    return message.text.toLowerCase().indexOf('memebot') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};


MemeBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    var channel = self._getChannelById(originalMessage.channel);
    //self.postMessageToUser('oscarrobertson', "bitch", {as_user: true});
    self.postMessageToChannel(channel.name, "fu bitch", {as_user: true});
};

MemeBot.prototype._getChannelById = function (channelId) {
    console.log(this.channels);
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};
