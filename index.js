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
var lastcommand;

var queue = new Queue(queueRef, options, function(data, progress, resolve, reject) {

	console.log('received radio command:', data);
	lastcommand = data.command;
	switch (data.command) {
		case "play":
			stopClip();
			console.log('start playing clip ' + getclip(0));
			playClip(getclip(0));
			break;
		case "fwd":
			stopClip();
//			console.log('start playing clip ' + getclip(1));
//			playClip(getclip(0));
			break;
		case "back":
			stopClip();
			//console.log('start playing clip ' + getclip(-1));
			//playClip(getclip(0));
			break;
		case "pause":
			console.log('pause playback');
			stopClip();
			break;
		case "hashtag":
			console.log('set hashtag to', data.value);
			sethashtag(data.value);
			break;
		default:
			console.log('unknown command', data.command);
			break;

	}
	//	setTimeout(function() {
	resolve();
	//	}, 1000);

});

var hashtag = config.hashtag;
var clips = [];
var needle = 0;


// Set radio online
var statusRef = myRootRef.child("status");
statusRef.set({
	online: true
});


function getclip(delta) {
	needle += delta;
	if (needle >= clips.length) {
		console.log('end of clip list reached.. start from beginning');
		needle = 0;
	}
	if (needle < 0) {
		needle = clips.length - 1;
	}
	console.log('index=', needle, 'length of clips array=', clips.length);
	return clips[needle];
}

function sethashtag(newHashtag) {
	hashtag = newHashtag;
	console.log('switching to hashtag', hashtag);
	clips = [];
	cliprefurl = config.firebaseroot + "/hashtags/" + hashtag;
	console.log('searching for clips at location', cliprefurl);
	var clipref = new Firebase(cliprefurl);
	clipref.on('child_added', function(childSnapshot, prevChildKey) {
		// code to handle new child.
		var clipkey = childSnapshot.val().clipkey;
		console.log('found clip', childSnapshot.key(), 'clipkey=', clipkey);
		clips.push(clipkey);
		console.log('number of clips in this playlist:', clips.length);
	});

}

console.log('KIM radio - my serial is ', config.serial);

sethashtag(config.hashtag);

app.get('/', function(req, res) {
	var url = 'http://localhost:5000/#!/settings/' + config.serial;

	console.log('my serial is ' + config.serial);
	console.log('redirect to ' + url);
	return res.redirect(url);

});

// add our address to the donation queue
//app.get('/play/:url', function(req, res) {

var term;

function handleError(e){
	console.log('error',e);
	stopClip();
	term = null;
}

function playClip(clipID) {

	if (!clipID) {
		console.log('no clipID given... abort');
	}

	var wavURL = config.firebaseroot + "/rawclips/" + clipID + "/data.json";

	console.log('play', wavURL);

	if (config.emulateplay) {
		console.log('emulate');
		return;
	}

	term = require('child_process').spawn('mpg123', ['-']);

	var parser = new MyParser();
	parser.on('header', function(header) {
		console.error('got "header"', header);
	});

	console.log('start playback');
	request.get(wavURL)
		.pipe(parser).on('error', function(e){handleError(e)})
		.pipe(base64.decode()).on('error', function(e){handleError(e)})
		.pipe(term.stdin).on('error', function(e){handleError(e)});

	term.on('close', (code) => {
		console.log('finished! lastcommand',lastcommand);
		if (lastcommand === "play" || lastcommand === "fwd"){
			console.log('playing - do next clip');
			playClip(getclip(1));
		}
		if(lastcommand === "back"){
			playClip(getclip(-1));
		}

	});

}

function stopClip(){
	if (term){
		term.kill('SIGTERM');
	}else{
		console.log('no clip playing');
	}
}

function pauseClip(){
	if (term){
		term.kill('SIGSTOP');
	}
}

function resumeClip(){
	if (term){
		term.kill('SIGCONT');
	}
}


app.listen(config.httpport, function() {
	console.log('OK - listening on port ', config.httpport);
});