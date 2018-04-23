// Liste des blocs utilisés
var colors = {
	9: {color: "#828F9F", label: 'Vide non Constructible'},
	0: {color: "#9E9EAF", label: 'Vide Constructible'},
	1: {color: "#1F243D", label: 'Carré Destructible'},
	2: {color: "#000000", label: 'Carré Indestructible'},
	8: {color: "#FF00FF", label: 'Carré non Reconstructible'},
	3: {color: "#FF7F27", label: 'Fin de Rally'}
};
// Liste des blocs par défaut
var defaultColors = {
	9: {color: "#828F9F", label: 'Vide non Constructible'},
	0: {color: "#9E9EAF", label: 'Vide Constructible'},
	1: {color: "#1F243D", label: 'Carré Destructible'},
	2: {color: "#000000", label: 'Carré Indestructible'},
	8: {color: "#FF00FF", label: 'Carré non Reconstructible'},
	3: {color: "#FF7F27", label: 'Fin de Rally'}
};
// Configuration globale
var config = {
	size: 10, // Taille d'un cube
	width: 2000, // Largeur max
	height: 1000, // Hauteur max
	currentCode: 0, // Code actuel
	isLibre: false, // Libre activé ?
	isDragging: false, // On drag ?
	monde: 7, // Monde par défaut
	displayMonde: true, // Afficher le monde ?
	displayMire: true, // Afficher la mire ?
	displayZones: true, // Afficher les zones de respawn ?
	isModified: false, // Map modifiée ?
	typeLoaded: 0, // Type de carte chargée
	currentSocket: null,
	currentRoom: null,
	serverURL: 'https://fortedit.cyboulette.fr:3000/'
};
// Position de la souris et du sélecteur
var mousePosition = {
	x1: 0,
	y1: 0,
	x2: 0,
	y2: 0
};

// Layers
var mapPersoLayer = new Konva.Layer(); // La personnalisation des maps
var mondeLayer = new Konva.Layer(); // L'image du monde
var globalLayer = new Konva.Layer(); // Les cases
var dragLayer = new Konva.Layer(); // Les cases "libres"
var allCubes = []; // Tous les cubes
var imageMonde = null; // Image du monde
var socket = null;

// Variable du jeu
var mondes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]; // Liste des mondes
var zones = [ // Zones pour chaque monde
	[164, 45, 185, 70, 0, 32, 23, 49], //0
	[0, 0, 31, 100, 167, 32, 196, 45], //1
	[147, 23, 190, 45, 8, 15, 23, 35], //2
	[7, 44, 27, 55, 159, 51, 194, 6], //3
	[10, 38, 36, 51, 164, 38, 189, 51], //4
	[6, 33, 19, 42, 181, 33, 194, 42], //5
	[0, 65, 29, 90, 129, 48, 178, 90], //6
	[31, 52, 44, 63, 156, 52, 169, 63], //7
	[66, 57, 99, 74, 114, 48, 149, 76], //8
	[3, 9, 30, 23, 154, 47, 175, 64], //9
	[1, 51, 50, 61, 151, 51, 200, 61], //10
	[159, 43, 180, 54, 20, 43, 41, 54], //11
	[22, 43, 39, 59, 174, 60, 198, 71], //12
	[146, 38, 176, 62, 0, 81, 33, 99], //13
	[9, 51, 31, 64, 171, 52, 193, 65], //14
	[0, 25, 24, 46, 177, 27, 197, 50], //15
	[25, 44, 43, 65, 153, 43, 171, 64], //16
	[12, 44, 38, 60, 163, 44, 189, 60], //17
	[029, 43, 58, 69, 163, 12, 200, 41], //18
	[17, 41, 43, 55, 159, 41, 185, 55] //19
];
var mires = [700, 464, 370, 510, 437, 325, 630, 550, 560, 500, 548, 475, 535, 558, 940, 475, 548, 502, 595, 495]; // Mires pour chaque monde
// Variables de la map perso
var mapPerso = {};

// Stage = scène, =  la carte
var carte = null;

// Récupère les paramètres de l'url
function getUrlParameter(sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1)),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
}

// Reset la position du cursor
function resetCursor() {
	$("#cursor").css({
		top: mousePosition.y2,
		left: mousePosition.x2,
		width: config.size,
		height: config.size
	});
}

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

// Dessinne tous les cubes dans un rectangle
function drawRects(x, y, width, height, code) {
	for(var i = x; i < x+width; i+=10) {
		for(var j = y; j < y+height; j+=10) {
			var obj = carte.find('#'+i+';'+j)[0];
			obj.fill(colors[code].color);
			obj.setAttr('code', code);
		}
	}
	carte.draw();
}

// Ajout un cube à la carte
function addCube(layer, x, y, code) {
	var color = colors[code].color;

	var cube = new Konva.Rect({
		x: x,
		y: y,
		width: config.size,
		height: config.size,
		fill: color,
		code: code,
		id: x+';'+y
	});
	layer.add(cube);
	allCubes.push(cube);
}

// Initialisation globale
function initAll() {
	var x = 0, y =0; // Positions initiales
	// Pour les 200*100 blocs
	for (var i = 0; i < 200; i++) {
		for(var j=0; j < 100; j++) {
			// Ajouter un cube
			addCube(globalLayer, x, y, config.currentCode);
			y+=config.size;
		}
		y=0;
		x+=config.size;
	}

	// On ajoute les différents layers/calques à la carte
	carte.add(globalLayer);
	carte.add(dragLayer);
	carte.add(mondeLayer);
	carte.add(mapPersoLayer);

	$('#carte').append('<div id="cursor" class="cursor"></div>'); // On fait apparaître le curseur de sélection
	$('#carte canvas').attr('id', 'canvas-carte'); // On attribue un id au canvas
	loadMonde(config.monde); // On charge le monde par défaut

	// Pour chaque monde on le rajoute au select
	mondes.forEach(function(elt){
		var isSelected = false;
		if(elt == config.monde) isSelected = true;
		$("#list-mondes").append($('<option>', {
			value: elt,
			text: 'Monde '+elt,
			selected: isSelected
		}));
	});
}

// Charge un fichier
function load(content) {
	config.isModified = false;
	resetColors();
	mapPersoLayer.removeChildren();
	mapPersoLayer.draw();

	var parts = content.split('-');
	var nbTirets = parts.length;
	var cases = parts[nbTirets-1].split('');

	if(parts[1].length >= 20000 && parts[1].length <= 20003) { // Ancien format
		loadMonde(parts[0]);
		console.log('Format : 2008');
		config.typeLoaded = 0;
		drawZones();
	} else { // Nouveaux formats de map
		if(nbTirets >= 16 && content.length >= 20003 && content.length <= 20131) { // Format 2017/2018 : maps perso
			if(nbTirets >= 16) {
				loadMonde(-1); // Monde vide
				var isWithColors = (nbTirets > 20);
				mapPerso.nbFrigos = parseInt(parts[1]);
				var nbTiretsForGravite = 0;

				// Frigos
				mapPerso.frigos = {};
				if(mapPerso.nbFrigos == 2) {
					mapPerso.frigos.rouge = {
						x: parseInt(parts[2])/config.size,
						y: parseInt(parts[3])/config.size
					};

					mapPerso.frigos.bleu = {
						x: parseInt(parts[4])/config.size,
						y: parseInt(parts[5])/config.size
					};
					nbTiretsForGravite = 6;
				} else if(mapPerso.nbFrigos == 1) {
					mapPerso.frigos.rouge = {
						x: parseInt(parts[2])/config.size,
						y: parseInt(parts[3])/config.size
					};
					nbTiretsForGravite = 4;
				} else {
					nbTiretsForGravite = 2;
					mapPerso.nbFrigos = 0;
				}

				// Mires
				mapPerso.miresPerso = parseInt(parts[nbTiretsForGravite]);
				
				// Zones de respawn
				mapPerso.zonesRespawn = [];
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+1]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+2]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+3]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+4]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+5]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+6]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+7]));
				mapPerso.zonesRespawn.push(parseInt(parts[nbTiretsForGravite+8]));

				var nbTiretsPositionsRespawn = nbTiretsForGravite+9;

				// Position de respawn
				mapPerso.positionsRespawn = {};
				mapPerso.positionsRespawn.rouge = {
					x: parseInt(parts[nbTiretsPositionsRespawn])/config.size,
					y: parseInt(parts[nbTiretsPositionsRespawn+1])/config.size
				};

				mapPerso.positionsRespawn.bleu = {
					x: parseInt(parts[nbTiretsPositionsRespawn+2])/config.size,
					y: parseInt(parts[nbTiretsPositionsRespawn+3])/config.size
				};

				var nbTiretsBords = nbTiretsPositionsRespawn+4;

				// Gestion des bords de la map
				mapPerso.hauteurPlafond = parseInt(parts[nbTiretsBords])/config.size;
				if(mapPerso.hauteurPlafond > 9) {
					mapPerso.hauteurPlafond = 9;
				}
				mapPerso.hauteurSol = parseInt(parts[nbTiretsBords])%config.size;
				if(mapPerso.hauteurSol > 9) {
					mapPerso.hauteurSol = 9;
				}

				//Custom map
				customMap();

				// Chargement des couleurs
				for(var i = nbTiretsBords+1; i < parts.length-1; i++) {
					var newFormat = parts[i].split(':');
					$(".btn-change-code[data-code="+newFormat[0]+"]").css('background-color', "#"+newFormat[1]);
					colors[newFormat[0]].color = '#'+newFormat[1];
				}
				updateFormColors();

				console.log('Format : 2017, perso');
				config.typeLoaded = 2;
			} else {
				// Todo : error
			}
		} else { // Format "2016" avec couleurs
			loadMonde(parts[0]);
			for(var i = 1; i < parts.length-1; i++) {
				var newFormat = parts[i].split(':');
				$(".btn-change-code[data-code="+newFormat[0]+"]").css('background-color', "#"+newFormat[1]);
				colors[newFormat[0]].color = '#'+newFormat[1];
			}
			config.typeLoaded = 1;
			updateFormColors();
			drawZones();
			console.log('Format : 2016, couleurs');
		}
	}

	loadCases(cases);
	$('#file-carte').val('');
}

// Crée la personnalisation d'une map
function customMap() {
	mapPersoLayer.removeChildren();
	mapPersoLayer.draw();

	if(mapPerso.nbFrigos == 2) {
		var imageFrigoObjet = new Image();

		imageFrigoObjet.onload = function () {
			kImageFrigoBleu = new Konva.Image({
				x: mapPerso.frigos.bleu.x * config.size,
				y: mapPerso.frigos.bleu.y * config.size,
				image: imageFrigoObjet,
				width: 47,
				height: 57
			});
			mapPersoLayer.add(kImageFrigoBleu);

			kImageFrigoRouge = new Konva.Image({
				x: mapPerso.frigos.rouge.x * config.size,
				y: mapPerso.frigos.rouge.y * config.size,
				image: imageFrigoObjet,
				width: 47,
				height: 57
			});
			mapPersoLayer.add(kImageFrigoRouge);
			mapPersoLayer.draw();
		}
		imageFrigoObjet.src = 'img/mondes/frigo.png';
	} else if(mapPerso.nbFrigos == 1) {
		var imageFrigoObjet = new Image();

		imageFrigoObjet.onload = function () {
			kImageFrigoRouge = new Konva.Image({
				x: mapPerso.frigos.rouge.x * config.size,
				y: mapPerso.frigos.rouge.y * config.size,
				image: imageFrigoObjet,
				width: 47,
				height: 57
			});
			mapPersoLayer.add(kImageFrigoRouge);
			mapPersoLayer.draw();
		}
		imageFrigoObjet.src = 'img/mondes/frigo.png';
	}

	// Positions de spawn
	var posSpawnRouge = new Konva.Rect({
		x: mapPerso.positionsRespawn.rouge.x * config.size,
		y: mapPerso.positionsRespawn.rouge.y * config.size,
		height: 10,
		width: 10,
		fill: 'red'
	});
	// Positions de spawn
	var posSpawnBleu = new Konva.Rect({
		x: mapPerso.positionsRespawn.bleu.x * config.size,
		y: mapPerso.positionsRespawn.bleu.y * config.size,
		height: 10,
		width: 10,
		fill: 'blue'
	});
	mapPersoLayer.add(posSpawnRouge);
	mapPersoLayer.add(posSpawnBleu);

	// Zones de respawn
	for(var i = mapPerso.zonesRespawn[0]; i < mapPerso.zonesRespawn[2]; i++) {
		for(var j = mapPerso.zonesRespawn[1]; j < mapPerso.zonesRespawn[3]; j++) {
			var cube = new Konva.Rect({
				x: i * config.size,
				y: j * config.size,
				width: config.size,
				height: config.size,
				stroke: 'red',
				strokeWidth: 1,
				name: 'zoneRespawn'
			});
			if(!config.displayZones) cube.hide();
			mapPersoLayer.add(cube);
		}
	}

	for(var i = mapPerso.zonesRespawn[4]; i < mapPerso.zonesRespawn[6]; i++) {
		for(var j = mapPerso.zonesRespawn[5]; j < mapPerso.zonesRespawn[7]; j++) {
			var cube = new Konva.Rect({
				x: i * config.size,
				y: j * config.size,
				width: config.size,
				height: config.size,
				stroke: 'red',
				strokeWidth: 1,
				name: 'zoneRespawn'
			});
			if(!config.displayZones) cube.hide();
			mapPersoLayer.add(cube);
		}
	}

	// Mires
	var mire1 = new Konva.Line({
		points: [0,mapPerso.miresPerso,2000,mapPerso.miresPerso],
		stroke: 'red',
		strokeWidth: 1,
		name: 'mire'
	});
	var mire2 = new Konva.Line({
		points: [1000,0,1000,1000],
		stroke: 'red',
		strokeWidth: 1,
		name: 'mire'
	});
	if(!config.displayMire) mire1.hide();
	if(!config.displayMire) mire1.hide();

	mapPersoLayer.add(mire1);
	mapPersoLayer.add(mire2);
	mapPersoLayer.draw();
}

// Charge les cases d'un fichier
function loadCases(cases) {
	for(var i = 0; i<cases.length; i++) {
		allCubes[i].fill(colors[cases[i]].color);
		allCubes[i].setAttr('code', cases[i]);
	}
	carte.draw();
}

// Dessine les zones de spawn et mires d'une map non perso
function drawZones() {
	mapPersoLayer.removeChildren();
	mapPersoLayer.draw();

	var curZone = zones[config.monde];

	for(var i = curZone[0]; i < curZone[2]; i++) {
		for(var j = curZone[1]; j < curZone[3]; j++) {
			var cube = new Konva.Rect({
				x: i * config.size,
				y: j * config.size,
				width: config.size,
				height: config.size,
				stroke: 'red',
				strokeWidth: 1,
				name: 'zoneRespawn'
			});
			if(!config.displayZones) cube.hide();
			mapPersoLayer.add(cube);
		}
	}

	for(var i = curZone[4]; i < curZone[6]; i++) {
		for(var j = curZone[5]; j < curZone[7]; j++) {
			var cube = new Konva.Rect({
				x: i * config.size,
				y: j * config.size,
				width: config.size,
				height: config.size,
				stroke: 'red',
				strokeWidth: 1,
				name: 'zoneRespawn'
			});
			if(!config.displayZones) cube.hide();
			mapPersoLayer.add(cube);
		}
	}

	var curMire = mires[config.monde];
	var mire1 = new Konva.Line({
		points: [0,curMire,2000,curMire],
		stroke: 'red',
		strokeWidth: 1,
		name: 'mire'
	});
	if(!config.displayMire) mire1.hide();

	var mire2 = new Konva.Line({
		points: [1000,0,1000,1000],
		stroke: 'red',
		strokeWidth: 1,
		name: 'mire'
	});
	if(!config.displayMire) mire2.hide();

	mapPersoLayer.add(mire1);
	mapPersoLayer.add(mire2);

	mapPersoLayer.draw();
}

// Charge un monde
function loadMonde(loadedMonde) {
	if(imageMonde) imageMonde.destroy();
	if(loadedMonde == '-1') loadedMonde = 'empty';
	config.monde = loadedMonde;
	var imageObj = new Image();
	imageObj.onload = function () {
		imageMonde = new Konva.Image({
			x: 0,
			y: 0,
			image: imageObj,
			width: 2000,
			height: 1000,
			name: 'monde'
		});
		// add the shape to the layer
		if(!config.displayMonde) imageMonde.hide();
		mondeLayer.add(imageMonde);
		mondeLayer.draw();
	}
	imageObj.src = 'img/mondes/'+config.monde+'.png';

	if(loadedMonde >= 0) {
		$("#list-mondes").prop('disabled', false);
		drawZones();
	} else {
		$("#list-mondes").prop('disabled', 'disabled');
	}
	$("#list-mondes").val(config.monde);
}

// Initialise le menu
function initMenu() {
	for(var k in colors) {
		var active = '';
		if(k == config.currentCode) active = 'active';
		$('#menu').append('<button class="btn btn-change-code '+active+'" role="button" data-code="'+k+'" style="background-color: '+colors[k].color+'">'+colors[k].label+'</button>');
		$('#modal-convertir .convert-items, #modal-intervertir .invert-items').append('<option value="'+k+'">'+colors[k].label+'</option>');
	}
	$('#menu').append('<button class="btn btn-change-libre btn-primary">Mode libre : désactivé</button>');
}

function updateFormColors() {
	$('#modal-changer-couleurs .modal-body').html('');
	for(var k in colors) {
		$('#modal-changer-couleurs .modal-body').append('<div class="form-group"><label for="cc-'+k+'">'+colors[k].label+'</label><input data-code="'+k+'" id="cc-'+k+'" class="form-control colorpicker" type="text" value="'+colors[k].color+'"></div>');
	}
	$('.colorpicker').colorpicker({
		useAlpha: false,
		format: 'hex'
	});
}

function updateColors() {
	for(var k in colors) {
		$(".btn-change-code[data-code="+k+"]").css('background-color', colors[k].color);
	}
	for(var k in allCubes) {
		var obj = allCubes[k];
		obj.fill(colors[obj.getAttr('code')].color);
	}
	dragLayer.draw();
	globalLayer.draw();
	if(config.currentRoom != null) socket.emit('updateColors', {colors: colors});
	if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
	if(config.typeLoaded == 0) config.typeLoaded = 1;
}

// Reset les couleurs par défaut
function resetColors() {
	for(var k in colors) {
		colors[k].color = defaultColors[k].color;
		$(".btn-change-code[data-code="+k+"]").css('background-color', defaultColors[k].color);
	}
}

// Reset tout et refait la map
function nouvelleMap() {
	allCubes.length = 0;
	allCubes = [];
	config.currentCode = 0;
	config.monde = 7;
	config.typeLoaded = 0;
	config.isModified = false;
	globalLayer.destroy();
	dragLayer.destroy();
	mondeLayer.destroy();
	mapPersoLayer.destroy();
	carte.removeChildren();
	initAll();
	resetColors();
	updateFormColors();
	if(config.currentRoom != null) socket.emit('updateColors', {colors: colors}); // reset des colors
	config.currentCode = $('.btn-change-code.active').attr('data-code');
}

// Renvoi les cases actuelles
function getCurrentCases() {
	var cases = [];
	for(var i = 0; i<allCubes.length; i++) {
		cases.push(allCubes[i].getAttr('code'));
	}
	cases = cases.join('');

	return cases;
}

function getFinalCode() {
	var cases = [];
	for(var i = 0; i<allCubes.length; i++) {
		cases.push(allCubes[i].getAttr('code'));
	}
	cases = cases.join('');

	if(config.typeLoaded == 0) {
		var codeFinal = config.monde+'-';
		codeFinal+=cases;
	} else if(config.typeLoaded == 1) {
		var couleurs = '';
		for(var k in colors) {
			if(colors[k].color != defaultColors[k].color) {
				couleurs += k+':'+colors[k].color.replace('#', '')+'-';
			}
		}

		var codeFinal = config.monde+'-'+couleurs+cases;
	} else if(config.typeLoaded == 2) {
		if(mapPerso.nbFrigos == 2) var frigosString = "2-"+(mapPerso.frigos.rouge.x*config.size)+"-"+(mapPerso.frigos.rouge.y*config.size)+"-"+(mapPerso.frigos.bleu.x*config.size)+"-"+(mapPerso.frigos.bleu.y*config.size)+"-";
		if(mapPerso.nbFrigos == 1) var frigosString = "1-"+(mapPerso.frigos.rouge.x*config.size)+"-"+(mapPerso.frigos.rouge.y*config.size)+"-";
		if(mapPerso.nbFrigos == 0) var frigosString = "0-";

		var zonesRespawnString = mapPerso.zonesRespawn.join('-');
		var positionsRespawnString = (mapPerso.positionsRespawn.rouge.x*config.size)+"-"+(mapPerso.positionsRespawn.rouge.y*config.size)+"-"+(mapPerso.positionsRespawn.bleu.x*config.size)+"-"+(mapPerso.positionsRespawn.bleu.y*config.size);
		var parameters = frigosString+mapPerso.miresPerso+"-"+zonesRespawnString+"-"+positionsRespawnString+"-"+mapPerso.hauteurPlafond+mapPerso.hauteurSol;

		var couleurs = '';
		for(var k in colors) {
			if(colors[k].color != defaultColors[k].color) {
				couleurs += k+':'+colors[k].color.replace('#', '')+'-';
			}
		}

		var codeFinal = 'P-'+parameters+'-'+couleurs+cases;
	}

	return codeFinal;
}

$(function(){
	carte = new Konva.Stage({
		container: 'carte',
		width: config.width,
		height: config.height,
	});
	// Quand on change de "bloc"
	$(document).on('click', '.btn-change-code', function(e) {
		e.preventDefault();
		config.currentCode = $(this).attr('data-code');
		$('.btn.active').removeClass('active');
		$(this).addClass('active');
	});

	// Quand on active le mode "libre"
	$(document).on('click', '.btn-change-libre', function(e) {
		e.preventDefault();
		config.isLibre = !config.isLibre;
		var text = (config.isLibre?'activé':'désactivé');
		$(this).html('Mode libre : '+text);
	});

	// Quand on change les couleurs
	$('#btn-changer-couleurs').on('click', function(e){
		$('#modal-changer-couleurs input').each(function(){
			var code = $(this).attr('data-code');
			var color = $(this).val();
			colors[code].color = color;
		});
		updateColors();
	});

	// Quand on convertit
	$('#btn-convertir').on('click', function(e) {
		e.preventDefault();
		var codeLeft = $('#convert-left').val();
		var codeRight = $('#convert-right').val();
		for(var k in allCubes) {
			var rect = allCubes[k];
			if(rect.getAttr('code') == codeLeft) {
				rect.fill(colors[codeRight].color);
				rect.setAttr('code', codeRight);
			}
		}
		if(config.currentRoom != null) socket.emit('convertir', {codeLeft: codeLeft, codeRight, codeRight});
		if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
		globalLayer.draw();
		dragLayer.draw();
	});

	// Quand on intervertit
	$('#btn-intervertir').on('click', function(e) {
		e.preventDefault();
		var codeLeft = $('#invert-left').val();
		var codeRight = $('#invert-right').val();
		for(var k in allCubes) {
			var rect = allCubes[k];
			if(rect.getAttr('code') == codeLeft) {
				rect.fill(colors[codeRight].color);
				rect.setAttr('code', codeRight);
			} else if(rect.getAttr('code') == codeRight) {
				rect.fill(colors[codeLeft].color);
				rect.setAttr('code', codeLeft);
			}
		}
		if(config.currentRoom != null) socket.emit('intervertir', {codeLeft: codeLeft, codeRight, codeRight});
		if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
		globalLayer.draw();
		dragLayer.draw();
	});

	// Quand on enregistre
	$('#btn-enregistrer-sous').on('click', function(e){
		e.preventDefault();

		// Récupération des cases
		var childrens = dragLayer.getChildren();
		while(childrens.length > 0) {
			for(var i = 0; i<childrens.length; i++) {
				var children = childrens[i];
				children.moveTo(globalLayer);
			}
		}
		globalLayer.draw();

		var cases = [];
		for(var i = 0; i<allCubes.length; i++) {
			cases.push(allCubes[i].getAttr('code'));
		}
		cases = cases.join('');

		if(config.typeLoaded == 0) {
			var codeFinal = config.monde+'-';
			codeFinal+=cases;
		} else if(config.typeLoaded == 1) {
			var couleurs = '';
			for(var k in colors) {
				if(colors[k].color != defaultColors[k].color) {
					couleurs += k+':'+colors[k].color.replace('#', '')+'-';
				}
			}

			var codeFinal = config.monde+'-'+couleurs+cases;
		} else if(config.typeLoaded == 2) {
			if(mapPerso.nbFrigos == 2) var frigosString = "2-"+(mapPerso.frigos.rouge.x*config.size)+"-"+(mapPerso.frigos.rouge.y*config.size)+"-"+(mapPerso.frigos.bleu.x*config.size)+"-"+(mapPerso.frigos.bleu.y*config.size)+"-";
			if(mapPerso.nbFrigos == 1) var frigosString = "1-"+(mapPerso.frigos.rouge.x*config.size)+"-"+(mapPerso.frigos.rouge.y*config.size)+"-";
			if(mapPerso.nbFrigos == 0) var frigosString = "0-";

			var zonesRespawnString = mapPerso.zonesRespawn.join('-');
			var positionsRespawnString = (mapPerso.positionsRespawn.rouge.x*config.size)+"-"+(mapPerso.positionsRespawn.rouge.y*config.size)+"-"+(mapPerso.positionsRespawn.bleu.x*config.size)+"-"+(mapPerso.positionsRespawn.bleu.y*config.size);
			var parameters = frigosString+mapPerso.miresPerso+"-"+zonesRespawnString+"-"+positionsRespawnString+"-"+mapPerso.hauteurPlafond+mapPerso.hauteurSol;

			var couleurs = '';
			for(var k in colors) {
				if(colors[k].color != defaultColors[k].color) {
					couleurs += k+':'+colors[k].color.replace('#', '')+'-';
				}
			}

			var codeFinal = 'P-'+parameters+'-'+couleurs+cases;
		}

		if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode()); // On enregistre

		var carteName = prompt("Nom de la carte", "");

		if(carteName != null) {
			var realCarteName = carteName.replace(/[^\w\s]/gi, '');
			var element = document.createElement('a');
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(codeFinal));
			element.setAttribute('download', realCarteName+'.txt');
			element.click();
		}
	});

	// Quand on clique sur le bouton "ouvrir"
	$('#btn-ouvrir').on('click', function(e){
		e.preventDefault();
		$('#file-carte').trigger('click');
	});

	$('.btn-toggle-option').on('click', function(e){
		e.preventDefault();
		var option = $(this).attr('data-option');
		var optionName = $(this).attr('data-name');
		config[option] = !config[option];
		if(optionName != 'monde') {
			var allObjects = mapPersoLayer.find('.'+optionName);
		} else {
			var allObjects = mondeLayer.find('.'+optionName);
		}
		if(!config[option]) {
			allObjects.hide();
			$(this).find('.text-toggle').html('Afficher');
		} else {
			allObjects.show();
			$(this).find('.text-toggle').html('Cacher');
		}
		if(optionName != 'monde') {
			mapPersoLayer.draw();
		} else {
			mondeLayer.draw();
		}
	});

	// Quand on charge un fichier
	$('#file-carte').on('change', function(e){
		var file = e.target.files[0];
		if (file && file.type.match(/text.*/)) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var contents = e.target.result;
				load(contents);
				if(config.currentSocket != null) socket.emit('openFile', {map: contents});
				if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
			};
			reader.readAsText(file);
		} else {
			// Todo : alert
		}
	});

	// Quand on clique sur la carte
	$('#carte').on('mousedown', function(e) {
		if(e.which == 1) {
			config.isDragging = true;
			var mousePos = carte.getPointerPosition();
			if(mousePos) {
				var x = (Math.ceil(mousePos.x/config.size) * config.size);
				var y = (Math.ceil(mousePos.y/config.size) * config.size);

				mousePosition.x1 = x;
				mousePosition.y1 = y;
			}
		}
	});

	// Quand on bouge le curseur sur la carte
	$('#carte').on('mousemove', function(e){
		var mousePos = carte.getPointerPosition();
		if(mousePos) {
			var x = (Math.ceil(mousePos.x/config.size) * config.size);
			var y = (Math.ceil(mousePos.y/config.size) * config.size);

			mousePosition.x2 = x;
			mousePosition.y2 = y;

			$("#cursor").css({
				top: y,
				left: x
			});

			if(config.currentRoom != null) socket.emit('positionMove', {x: x, y: y, room: config.currentRoom, id: config.currentSocket});

			if(config.isDragging && !config.isLibre) {
				var width = Math.abs(mousePosition.x1 - mousePosition.x2);
				var height = Math.abs(mousePosition.y1 - mousePosition.y2);
				var realX = Math.min(mousePosition.x1, mousePosition.x2);
				var realY = Math.min(mousePosition.y1, mousePosition.y2);
				$("#cursor").css({
					top: realY,
					left: realX,
					width: width,
					height: height
				});
			}

			if(config.isDragging && config.isLibre) {
				var obj = carte.find('#'+x+';'+y)[0];
				obj.moveTo(dragLayer);
				obj.setAttr('code', config.currentCode);
				obj.fill(colors[config.currentCode].color);
				if(config.currentRoom != null) socket.emit('drawLibre', {x: x, y: y, room: config.currentRoom, code: config.currentCode});
				if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
				dragLayer.draw();
			}
		}
	});

	// Quand on lâche le clic sur la carte
	$('#carte').on('mouseup', function(e){
		if(config.isDragging && !config.isLibre) {
			var width = Math.abs(mousePosition.x1 - mousePosition.x2);
			var height = Math.abs(mousePosition.y1 - mousePosition.y2);
			var realX = Math.min(mousePosition.x1, mousePosition.x2);
			var realY = Math.min(mousePosition.y1, mousePosition.y2); 
			drawRects(realX, realY, width, height, config.currentCode);
			if(config.currentRoom != null) socket.emit('drawRects', {x: realX, y: realY, width: width, height: height, room: config.currentRoom, code: config.currentCode});
			if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
			globalLayer.draw();
		}
		config.isDragging = false;
		resetCursor();
	});

	// Quand on change de monde dans la liste
	$('#list-mondes').change(function(e) {
		loadMonde($(this).val());
		if(config.currentRoom != null) socket.emit('updateMonde', {monde: window.config.monde});
		if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
	});

	// Quand on clique sur un lien désactivé
	$(document).on('click', '#menu-header a.link-disabled', function(e){
		e.preventDefault();
		e.stopPropagation();
	});

	$(document).on('click', '#creer-session-ligne', function(e) {
		var username = prompt("Votre pseudo", "");

		if(username != null && username.length > 0) {
			$.ajax({
				type: 'POST',
				url: config.serverURL+'api/createSession',
				data: {map: window.getFinalCode()},
				dataType: 'json',
				success: function(result) {
					notify('success', result.message);
					socket.emit('connectToMap', {idCarte: result.sessionId, username: username});
					$('#creer-session-ligne').remove();
				}, error: function(error) {
					notify('danger', 'Impossible de créer votre session en ligne ! ');
				}
			});
		} else {
			notify('warn', 'Vous devez préciser votre pseudo');
		}
	});

	$('#btn-nouvelle-map').on('click', function(e) {
		e.preventDefault();
		$('#modal-welcome').remove();
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open');
		$('#navbarSupportedContent ul').append('<li class="nav-item"><a class="nav-link btn-dark text-white link-disabled" href="#" id="creer-session-ligne">Créer une session en ligne</a></li>');
		$('#editeur, #menu-header').fadeIn();

	});

	$('#btn-nouvelle').on('click', function(e) {
		e.preventDefault();
		nouvelleMap();
		if(config.currentRoom != null) socket.emit('nouvelleMap');
		if(config.currentRoom != null) socket.emit('updateDataMap', window.getFinalCode());
	});

	initAll(); // Charge la map
	initMenu(); // Charge les informations du menu
	updateFormColors(); // Charge les couleurs par défaut

	$('[data-toggle="tooltip"]').tooltip();
});

function notify(type, message, item) {
	if(!item) item = '#notify-center';
	//$('.notification').remove();
	//$(item).append('<div class="alert notification alert-'+type+'">'+message+'</div>');
	$.notify(message, type);
}