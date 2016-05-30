'use strict';

var mjAPI = require("mathjax-node/lib/mj-single.js");
var fs = require("fs");

const pn = require("pn/fs"); // https://www.npmjs.com/package/pn 
const svg2png = require("svg2png");

function MathImage() {
	mjAPI.config({MathJax: {SVG: {font: "Tex"}}});
	mjAPI.start();
}

module.exports = MathImage;

MathImage.prototype.mathPng = function(mathText, callback) {
	return mjAPI.typeset({
		math: mathText,
		format: "inline-TeX",
		svg:true,
		speakText: true,
	}, function (data) {
		if (!data.errors) {
			var r1 = /width="/;
			var r2 = /ex"/;
			var m1 = data.svg.search(r1) + 7;
			var m2 = m1 + data.svg.slice(m1).search(r2);
			var width = parseInt(data.svg.slice(m1,m2));  

			var r1 = /height="/;
			var r2 = /ex"/;
			var m3 = data.svg.search(r1) + 8;
			var m4 = m3 + data.svg.slice(m3).search(r2);
			var height = parseInt(data.svg.slice(m3,m4));

			var factor = 100/width;
			width = (width*factor).toString()

			factor = (300/4)/height;
			height = (height*factor).toString()

			var r = /width=".*ex" height=".*ex"/;
			data.svg = data.svg.replace(r, 'width="' + width + '" height="' + height + '"')

			var buf = new Buffer(data.svg);
		 	callback(svg2png(buf, { width: 450, height: 100 }));
	  	}
	});

};

