'use strict';

var http = require('http');


var Reddit = function Constructor(){
}

Reddit.prototype.get_hot = function(subreddit, callback) {
    var url;
    var a = Math.floor(Math.random() * 50)  

    url = "http://www.reddit.com/r/" + subreddit + "/hot/.json?limit=50";

    var request = http.get(url, function(response) {
        var json = '';
        response.on('data', function(chunk) {
            json += chunk;
        });

        response.on('end', function() {
            var redditResponse = JSON.parse(json);
            var post = redditResponse.data.children[a];
            callback(post.data.title, direct_imgur_url(post.data.url));
        })
    });
    request.on('error', function(err) {
        console.log(err);
    });
}

function direct_imgur_url(url){
    var index = url.toLowerCase().indexOf("imgur")
    if (index <= -1) return url;
    if (url.slice(index-2,index) == 'i.') return url;
    return url.slice(0,index) + "i." + url.slice(index);
}

module.exports = Reddit;
