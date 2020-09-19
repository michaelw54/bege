// Import Application class that is the main part of our PIXI project
import { Application } from '@pixi/app'

// In order that PIXI could render things we need to register appropriate plugins
import { Renderer } from '@pixi/core' // Renderer is the class that is going to register plugins

import { BatchRenderer } from '@pixi/core' // BatchRenderer is the "plugin" for drawing sprites
Renderer.registerPlugin('batch', BatchRenderer)

import { TickerPlugin } from '@pixi/ticker' // TickerPlugin is the plugin for running an update loop (it's for the application class)
Application.registerPlugin(TickerPlugin)

// And just for convenience let's register Loader plugin in order to use it right from Application instance like app.loader.add(..) etc.
import { AppLoaderPlugin } from '@pixi/loaders'
Application.registerPlugin(AppLoaderPlugin)

// Sprite is our image on the stage
import { Sprite } from '@pixi/sprite'

import * as PIXI from 'pixi.js'

import * as io from "socket.io-client"
const ioClient = io.connect("http://localhost:8000");

let players = new Map();
let shurikens = [];

// App with width and height of the page
const app = new Application({
	width: window.innerWidth,
	height: window.innerHeight
})
document.body.appendChild(app.view) // Create Canvas tag in the body

const MOVEMENT_SPEED = 1.5;
const PROJECTILE_SPEED = 5;

const euclideanDistance = (x1, y1, x2, y2) => {
	return Math.sqrt(Math.pow(x2 - x1, 2) +  Math.pow(y2 - y1, 2) * 1.0);
}

// Load the logo
app.loader.add('zed', './assets/zed.png')
app.loader.add('shuriken', './assets/shuriken.png')
app.loader.load(() => {
	const sprite = Sprite.from('zed')
	sprite.anchor.set(0.5)
	sprite.scale.set(0.3, 0.3);
	app.stage.addChild(sprite)

	ioClient.on("updateClient", (data) => {
		data.forEach(p => {
			if (players.has(p.name)) {
				players.get(p.name).x = p.x;
				players.get(p.name).y = p.y;
			} else {
				const newPlayer = Sprite.from('zed');
				newPlayer.anchor.set(0.5);
				newPlayer.x = p.x;
				newPlayer.y = p.y;
				newPlayer.scale.set(0.3, 0.3);
				app.stage.addChild(newPlayer);
				players.set(p.name, newPlayer);
			}
		});

		const names = data.map(p => p.name);

		// remove disconnected players
		Array.from(players.keys()).forEach(e => {
			if (!names.includes(e)) {
				app.stage.removeChild(players.get(e));
				players.delete(e);
			}
		});

	});

	// Position the sprite at the center of the stage
	sprite.x = app.screen.width * 0.5
	sprite.y = app.screen.height * 0.5

	var x = sprite.x;
	var y = sprite.y;

	const renderer = PIXI.autoDetectRenderer();
	document.addEventListener('contextmenu', e => {
		e.preventDefault();
		x = renderer.plugins.interaction.eventData.data.originalEvent.pageX;
		y = renderer.plugins.interaction.eventData.data.originalEvent.pageY;
		// move the sprite towards click location
	}, false);

	document.addEventListener('keydown', e => {
		e.preventDefault();
		if (e.keyCode == 113 || e.keyCode == 81) { // Q
			const shuriken = Sprite.from('shuriken')
			shuriken.anchor.set(0.5)
			shuriken.scale.set(0.2, 0.2);
			shuriken.x = sprite.x;
			shuriken.y = sprite.y;
			const target_x = renderer.plugins.interaction.eventData.data.originalEvent.pageX;
			const target_y = renderer.plugins.interaction.eventData.data.originalEvent.pageY;
			shuriken.rotation = Math.atan2(y - sprite.y, x - sprite.x);
			app.stage.addChild(shuriken);
			app.ticker.add(delta => {
				if (euclideanDistance(shuriken.x, shuriken.y, target_x, target_y) > 100) {
					shuriken.x += Math.cos(shuriken.rotation) * delta * PROJECTILE_SPEED;
					shuriken.y += Math.sin(shuriken.rotation) * delta * PROJECTILE_SPEED; 
				} else {
					app.stage.removeChild(shuriken);
				}
			});
		}
	});

	app.ticker.add(delta => {
		if (sprite.x < x) {
			sprite.x += MOVEMENT_SPEED * delta;
		} else if (sprite.x > x) {
			sprite.x -= MOVEMENT_SPEED * delta;
		}

		if (sprite.y < y) {
			sprite.y += MOVEMENT_SPEED * delta;
		} else if (sprite.y > y) {
			sprite.y -= MOVEMENT_SPEED * delta;
		}
	});

	setInterval(() => {
		ioClient.emit("updateServer", {x: sprite.x, y: sprite.y});
	}, 10);

})