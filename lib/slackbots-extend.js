'use strict';

var util = require('util');
var _bot = require('slackbots');
var extend = require('extend');
var fs = require('fs');
var FormData = require('form-data');
var Vow = require('vow');
var request = require('request');



_bot.prototype.upload = function(id, file, params) {
	params.token = this.token;
	var options = { method: 'POST',
	  url: 'https://slack.com/api/files.upload',
	  qs:
	  	params,
	  headers: 
	   { 
	     'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
	  formData: 
	   { file: 
	      { value: fs.createReadStream(file),
	        options: { filename: file, contentType: null } } } };

	return this._apiMultipart('files.upload', options);
};



_bot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

_bot.prototype._apiMultipart = function(methodName, options) {
    return new Vow.Promise(function(resolve, reject) {
        request(options, function(err, request, body) {
            if (err) {
            	console.log(err);
                reject(err);

                return false;
            }

            try {
                body = JSON.parse(body);
                console.log(body);

                // Response always contain a top-level boolean property ok,
                // indicating success or failure
                if (body.ok) {
                    resolve(body);
                } else {
                    reject(body);
                }

            } catch (e) {
                reject(e);
            }
        });
    });
};


module.exports = _bot;
