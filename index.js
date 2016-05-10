var express = require('express');
var Sound = require('node-aplay');
var favicon = require('serve-favicon');

var app = express();
app.use(favicon(__dirname + '/favicon.ico'));
var music;
var config = require('./config.json');
//var Firebase = require('firebase');
var stream = require('stream');
var request = require('request');
var base64 = require('base64-stream');

// add our address to the donation queue
app.get('/play/:url', function(req, res) {

	var wavURL = req.params.url;

	console.log('play', wavURL);

	var term = require('child_process').spawn('mpg123',['-']);

	var termout = '';

	term.stdout.on('data', function(data) {
		console.log('TERM:', data.toString());
		termout += data.toString();
	});

	request.get(wavURL).pipe(
		base64.decode()).pipe(process.stderr);

 term.on('close', (code) => {
 		return res.status(200).json({
		msg: 'playing',
		url: wavURL,
		termout: termout
	});


});

	// with ability to pause/resume: 
	//	music = new Sound(wavURL);
	//	music.play();

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

// var term = require('child_process').spawn('grep', ['5']);

// term.stdout.on('data', function(data) {
// 	console.log('TERM:', data.toString());
// });



// var stream = require('stream');
// var bufferStream = new stream.PassThrough;
// var buffer = new Buffer("1234");
// bufferStream.end(buffer);
// //console.log(bufferStream);
// bufferStream.pipe(term.stdin);
// //term.stdin.end();

// term.on('close', (code) => {
// 	console.log(`child process exited with code ${code}`);
// });
