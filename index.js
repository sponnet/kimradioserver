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

var Parser = require('stream-parser');
var inherits = require('util').inherits;
var Transform = require('stream').Transform;

// create a Transform stream subclass
function MyParser () {
  Transform.call(this);

  // buffer the first 8 bytes written
  this._bytes(8+15, this.onheader);
}
inherits(MyParser, Transform);

// mixin stream-parser into MyParser's `prototype`
Parser(MyParser.prototype);

// invoked when the first 8 bytes have been received
MyParser.prototype.onheader = function (buffer, output) {
  // parse the "buffer" into a useful "header" object
  var header = {};
  header.type = buffer.readUInt32LE(0);
  header.name = buffer.toString('utf8', 4+15);
  this.emit('header', header);

  // it's usually a good idea to queue the next "piece" within the callback
  this._passthrough(Infinity);
};






// add our address to the donation queue
app.get('/play/:url', function(req, res) {

	var wavURL = req.params.url;

	console.log('play', wavURL);

	// var term = require('child_process').spawn('mpg123', ['-']);

	// var termout = '';

	// term.stdout.on('data', function(data) {
	// 	console.log('TERM:', data.toString());
	// 	termout += data.toString();
	// });

var parser = new MyParser();
parser.on('header', function (header) {
  console.error('got "header"', header);
});

//process.stdin.pipe(parser).pipe(process.stdout);


	request.get(wavURL).pipe(parser).pipe(base64.decode()).pipe(process.stderr);

	// term.on('close', (code) => {
	// 	return res.status(200).json({
	// 		msg: 'playing',
	// 		url: wavURL,
	// 		termout: termout
	// 	});


//	});

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