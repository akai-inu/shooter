// main_post.js
window.onload = function() {
	game = new Game(WIDTH, HEIGHT);
	game.fps = FPS;

	game.keybind('A'.charCodeAt(0), 'left');
	game.keybind('D'.charCodeAt(0), 'right');
	game.keybind('W'.charCodeAt(0), 'up');
	game.keybind('S'.charCodeAt(0), 'down');
	game.keybind('R'.charCodeAt(0), 'r');

	game.preload(RESOURCES);

	game.onload = function() {
		game.pushScene(new STitle());
	};
	game.start();

}; // End of window.onload
