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

var Firebase = require('firebase');
var Queue = require('firebase-queue');


// create a Transform stream subclass
function MyParser() {
	Transform.call(this);

	// buffer the first 8 bytes written
	this._bytes(8 + 15, this.onheader);
}
inherits(MyParser, Transform);

// mixin stream-parser into MyParser's `prototype`
Parser(MyParser.prototype);

// invoked when the first 8 bytes have been received
MyParser.prototype.onheader = function(buffer, output) {
	// parse the "buffer" into a useful "header" object
	var header = {};
	header.type = buffer.readUInt32LE(0);
	header.name = buffer.toString('utf8', 4 + 15);
	this.emit('header', header);

	// it's usually a good idea to queue the next "piece" within the callback
	this._passthrough(Infinity);
};


var myRootRef = new Firebase(config.firebaseroot + "/remote/" + config.serial);
var queueRef = myRootRef.child("queue");

// Creates the Queue
var options = {
	//specId: 'faucet',
	numWorkers: 1
};

var queue = new Queue(queueRef, options, function(data, progress, resolve, reject) {

	//console.log('received radio command:', data);
	switch(data.command){
		case "play":
			console.log('start playing clip ' + getclip(0));
			playClip(getclip(0));
			break;
		case "fwd":
			console.log('start playing clip ' + getclip(1));
			playClip(getclip(0));
			break;
		case "back":
			console.log('start playing clip ' + getclip(-1));
			playClip(getclip(0));
			break;
		case "pause":
			console.log('pause playback');
			break;

	}
	//	setTimeout(function() {
	resolve();
	//	}, 1000);

});


var clips = [];
var needle = 0;

function getclip(delta){
	needle += delta;
	if (needle >= clips.length){
		console.log('end of clip list reached.. start from beginning');
		needle = 0;
	}
	console.log('index=',needle,'length of clips array=',clips.length);
	return clips[needle];
}


var clipref = new Firebase(config.firebaseroot + "/clips/" + config.serial);
clipref.on('child_added', function(childSnapshot, prevChildKey) {
  // code to handle new child.
  console.log('found clip',childSnapshot.key());
	clips.push(childSnapshot.key());
  console.log('number of clips in this playlist:',clips.length);

});




app.get('/', function(req, res) {
	var url = 'http://localhost:5000/#!/settings/' + config.serial;

	console.log('my serial is ' + config.serial);
	console.log('redirect to ' + url);
	return res.redirect(url);

});

// add our address to the donation queue
//app.get('/play/:url', function(req, res) {


function playClip(clipID){

	var wavURL = config.firebaseroot + "/clips/" + config.serial + "/" + clipID + "/data.json";

	console.log('play', wavURL);

	if (config.emulateplay){
		console.log('emulate');
		return;
	}

	var term = require('child_process').spawn('mpg123', ['-']);

	var parser = new MyParser();
	parser.on('header', function(header) {
		console.error('got "header"', header);
	});


	request.get(wavURL).pipe(parser).pipe(base64.decode()).pipe(term.stdin);

	term.on('close', (code) => {
	
	});

}

app.listen(config.httpport, function() {
	console.log('OK - listening on port ', config.httpport);
});