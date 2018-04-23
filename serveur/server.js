var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var hostname = 'localhost';
var port = 3000;
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var cors = require('cors');

var app = express();
app.use(morgan('dev'));
app.use(bodyParser());
app.use(cors());

var server = app.listen(port, hostname);
var io = require('socket.io').listen(server);


MongoClient.connect('mongodb://Fortedit:Sy1XYxR2ByQyoLZ08JNH@195.154.163.98:27017/?authSource=admin', function(err, client) {
	if(err) {
		// Erreur de bdd
		console.log('BDD : ERREUR');
	} else {
		console.log('BDD : OK');
		var db = client.db('fortedit');
		var mapsCollection = db.collection('maps');
		var connectionsCollection = db.collection('connections');
		connectionsCollection.drop();
		io.sockets.on('connection', function (socket) {
			var currentRoom = null;
			var currentSocket = null;
			var currentPseudo = null;
			var retour = {};

			socket.on('connectToMap', function(mapInfo) {
				mapsCollection.findOne({idCarte: mapInfo.idCarte}, function(err, result) {
					if(err || result == null) {
						retour.success = false;
						retour.message = 'Cette map collaborative n\'existe pas';
						socket.emit('retourMap', retour);
					} else {
						var regexPseudo = new RegExp(["^", mapInfo.username, "$"].join(""), "i");
						connectionsCollection.findOne({idCarte: mapInfo.idCarte, username: regexPseudo}, function(err, result2) {
							if(!result2) {
								retour.success = true;
								retour.idCarte = mapInfo.idCarte;
								retour.map = result.map;
								retour.username = mapInfo.username;

								socket.join(mapInfo.idCarte);
								currentRoom = mapInfo.idCarte;
								currentSocket = socket;
								currentPseudo = mapInfo.username;

								retour.socketID = socket.id;

								connectionsCollection.insertOne({
									idCarte: mapInfo.idCarte,
									socketId: socket.id,
									username: currentPseudo
								}, function(err, result){
									connectionsCollection.find({idCarte: mapInfo.idCarte}).toArray(function(err, result){
										if(result.length > 0) {
											io.sockets.in(mapInfo.idCarte).emit('newCursor', result);
										}
									});
								});
							} else {
								retour.success = false;
								retour.message = 'Ce pseudo est déjà connecté sur cette map';
							}
							socket.emit('retourMap', retour);
						});
					}
				});
			});

			socket.on('positionMove', function(data) {
				io.sockets.in(currentRoom).emit('positionMove', data);
			});

			socket.on('drawRects', function(data) {
				io.sockets.in(currentRoom).emit('drawRects', data);
			});

			socket.on('drawLibre', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('drawLibre', data);
			});

			socket.on('convertir', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('convertir', data);
			});

			socket.on('intervertir', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('intervertir', data);
			});

			socket.on('updateColors', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('updateColors', data);
			});

			socket.on('updateMonde', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('updateMonde', data);
			});

			socket.on('nouvelleMap', function() {
				var socketId = socket.id;
				io.sockets.in(currentRoom).emit('nouvelleMap', socketId);
			});

			socket.on('openFile', function(data) {
				data.socketId = socket.id;
				io.sockets.in(currentRoom).emit('openFile', data);
			});

			socket.on('disconnect', function() {
				connectionsCollection.deleteOne({"socketId": socket.id});
				io.sockets.in(currentRoom).emit('leaveCursor', {socketId: socket.id, username: currentPseudo});
			});

			socket.on('updateDataMap', function(finalCode) {
				mapsCollection.findOne({idCarte: currentRoom}, function(err, result) {
					if(result) {
						mapsCollection.updateOne({idCarte: currentRoom}, {$set: {map: finalCode}});
					}
				});
			});
		});

		// Si on crée une session
		app.post('/api/createSession', function(req, res, next) {
			var x = new ObjectId();
			var random = Math.floor(Math.random() * 100);
			var sessionId = ''+x+random;
			var map = req.body.map;

			mapsCollection.insertOne({
				idCarte: sessionId,
				map: map
			}, function(err, result){
				if(err) {
					res.send(err);
				} else {
					res.json({
						success: true,
						sessionId: sessionId,
						message: 'Votre session a été crée !'
					});
				}
			});

		});
	}
});
