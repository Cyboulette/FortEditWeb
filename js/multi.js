socket = io.connect(window.config.serverURL, {secure: true});
$(function(){

	var sessionIDUrl = getUrlParameter('sessionID');
	if(sessionIDUrl && sessionIDUrl != true && sessionIDUrl.length>0) {
		var isGoodUsername = false;
		while(!isGoodUsername) {
			var username = prompt('Votre pseudo', "");
			if(username != null && username.length > 0) {
				isGoodUsername = true;
				socket.emit('connectToMap', {idCarte: sessionIDUrl, username: username});
			}
		}
	}

	$('#btn-join-map').on('click', function(){
		$('#join-map-group').fadeIn();
	});

	$('#rejoindre-map').on('click', function(e) {
		e.preventDefault();
		var pseudo = $('#pseudo-join').val();
		var codeMap = $("#id-map-join").val();
		if(codeMap.length > 0) {
			if(pseudo.length > 0) {
				if(!socket.connected) {
					notify('info', 'Tentative de connexion ....', '#notify-center-welcome');
				}
				socket.emit('connectToMap', {idCarte: codeMap, username: pseudo});
			} else {
				notify('error', 'Vous devez préciser votre pseudo', '#notify-center-welcome');
			}
		} else {
			notify('error', 'Le code de la map doit être indiqué', '#notify-center-welcome');
		}
	});


	socket.on('retourMap', function(retour) {
		if(retour.success) {
			notify('success', 'Vous avez bien rejoint la session', '#notify-center-welcome');
			window.load(retour.map);
			window.config.currentSocket = retour.socketID;
			window.config.currentRoom = retour.idCarte;
			$('#modal-welcome').remove();
			$('.modal-backdrop').remove();
			$('body').removeClass('modal-open');
			$('#editeur, #menu-header').fadeIn();
			$('#info-map').html('Session actuelle : <b><a href="http://fortedit.cyboulette.fr/?sessionID='+retour.idCarte+'" target="_blank">'+retour.idCarte+'</a></b> - Pseudo : '+retour.username);
		} else {
			notify('error', retour.message, '#notify-center-welcome');
		}
	});

	socket.on('positionMove', function(data) {
		if(window.config.currentSocket != data.id) {
			$('.player[data-socket="'+data.id+'"]').css({
				top: data.y,
				left: data.x
			});
		}
	});

	socket.on('newCursor', function(retour) {
		for(var k in retour) {
			var objSocket = retour[k];
			if(window.config.currentSocket != objSocket.socketId) {
				notify('info', objSocket.username+' a rejoint la map');
				var color = window.getRandomColor();
				$('#carte').append('<div data-socket="'+objSocket.socketId+'" class="player" style="background-color: '+color+';"><div class="text-username">'+objSocket.username+'</div></div>');
			}
		}
	});

	socket.on('leaveCursor', function(data) {
		notify('info', data.username+' est parti !');
		var color = window.getRandomColor();
		$('.player[data-socket="'+data.socketId+'"]').remove();
	});

	socket.on('drawRects', function(data) {
		window.drawRects(data.x, data.y, data.width, data.height, data.code);
	});

	socket.on('drawLibre', function(data) {
		if(data.socketId != window.config.currentSocket) {
			var obj = carte.find('#'+data.x+';'+data.y)[0];
			obj.moveTo(dragLayer);
			obj.setAttr('code', data.code);
			obj.fill(colors[data.code].color);
			dragLayer.draw();
		}
	});

	socket.on('convertir', function(data) {
		if(data.socketId != window.config.currentSocket) {
			for(var k in allCubes) {
				var rect = allCubes[k];
				if(rect.getAttr('code') == data.codeLeft) {
					rect.fill(colors[data.codeRight].color);
					rect.setAttr('code', data.codeRight);
				}
			}
			globalLayer.draw();
			dragLayer.draw();
		}
	});

	socket.on('intervertir', function(data) {
		if(data.socketId != window.config.currentSocket) {
			for(var k in allCubes) {
				var rect = allCubes[k];
				if(rect.getAttr('code') == data.codeLeft) {
					rect.fill(colors[data.codeRight].color);
					rect.setAttr('code', data.codeRight);
				} else if(rect.getAttr('code') == data.codeRight) {
					rect.fill(colors[data.codeLeft].color);
					rect.setAttr('code', data.codeLeft);
				}
			}
			globalLayer.draw();
			dragLayer.draw();
		}
	});

	socket.on('updateColors', function(data) {
		if(data.socketId != window.config.currentSocket) {
			for(var k in data.colors) {
				$(".btn-change-code[data-code="+k+"]").css('background-color', data.colors[k].color);
			}
			for(var k in allCubes) {
				var obj = allCubes[k];
				obj.fill(data.colors[obj.getAttr('code')].color);
			}
			dragLayer.draw();
			globalLayer.draw();
			window.colors = data.colors;
			window.updateFormColors();
		}
	});

	socket.on('updateMonde', function(data) {
		if(data.socketId != window.config.currentSocket) {
			window.loadMonde(data.monde);
		}
	});

	socket.on('nouvelleMap', function(socketId) {
		if(socketId != window.config.currentSocket) {
			window.nouvelleMap();
		}
	});

	socket.on('openFile', function(data) {
		if(data.socketId != window.config.currentSocket) {
			window.load(data.map);
		}
	});

});