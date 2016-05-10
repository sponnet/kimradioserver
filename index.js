var express = require('express');
var Sound = require('node-aplay');

var app = express();
var music;
var config = require('./config.json');
//var Firebase = require('firebase');

// add our address to the donation queue
app.get('/play/:url', function(req, res) {

	var wavURL = req.params.url;

	console.log('play', wavURL);


	// with ability to pause/resume: 
	//	music = new Sound(wavURL);
	//	music.play();

	return res.status(200).json({
		msg: 'playing',
		url: wavURL
	});

	/*setTimeout(function () {
		music.pause(); // pause the music after five seconds 
	}, 5000);
	 
	setTimeout(function () {
		music.resume(); // and resume it two seconds after pausing 
	}, 7000);
	 
	// you can also listen for various callbacks: 
	music.on('complete', function () {
		console.log('Done with playback!');
	});
	*/

});

app.listen(config.httpport, function() {
	console.log('OK - listening on port ', config.httpport);
});