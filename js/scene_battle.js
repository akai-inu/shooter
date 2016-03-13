// scene_battle.js
var SBattle = Class.create(Scene, {
initialize: function() {
	Scene.call(this);

	// タイムキーパーを初期化
	Time.initialize(FPS);

	this.backgroundColor = "#B4EBFA";

	// レベルを追加
	this.level = new Level(this, "test");
	this.addChild(this.level);

	// 衝突マネージャを追加
	this.collisionManager = new CollisionManager(this);

	// プレイヤーを追加
	this.player = new Player(this, this.level, true);

  // サウンドマネージャーを追加
  this.soundManager = new SoundManager(this.player);

	// フレンドを追加
	this.friend = [
		//new Player(this, this.level, false, "Friend1"),
		//new Player(this, this.level),
		//new Player(this, this.level)
	];

	// エネミーを追加
	this.enemyManager = new EnemyManager(this, this.level);

	this.addChild(this.collisionManager);

	this.makedebugbutton();

	this.slow = new Label();
	this.slow.y = 120;
	this.slow.font = "20px 'メイリオ'";
	this.addChild(this.slow);

  var menu = new BattleMenu();
  this.addChild(menu);
},

makedebugbutton: function() {
	// デバッグボタンを追加
	var debugButtonData = [
		[ "・ハンドガン", function() {
			this.parentNode.player.setGun("handgun");
		}],
		[ "・ショットガン", function() {
			this.parentNode.player.setGun("shotgun");
		}],
		[ "・マシンガン", function() {
			this.parentNode.player.setGun("machinegun");
		}],
		[ "・バーストガン", function() {
			this.parentNode.player.setGun("burstgun");
		}],
		[ "タイトルに戻る", function() {
			game.popScene();
		}],
	];
	for(var i in debugButtonData) {
		var be = new Entity();
		be.width = 140;
		be.height = 24;
		be.backgroundColor = "#777";
		be.on("touchstart", debugButtonData[i][1]);
		be.y = 25 * i;
		var bl = new Label();
		bl.color = "#EEE";
		bl.font = "15px 'メイリオ'";
		bl.text = debugButtonData[i][0];
		bl.on("touchstart", debugButtonData[i][1]);
		bl.y = 25 * i;
		this.addChild(be);
		this.addChild(bl);
	}
},

onenterframe: function(e) {
	Time.updateframe(e.elapsed);
	var t = Math.round(Time.averageFps, 2)+" FPS<br>";
	t += "TotalTime : "+Time.totalElapsedms+"ms<br>";
	t += Time.isSlowly ? "Slow": "";
	this.slow.text = t;
},

ontouchstart: function(e) {
	this.player.mySetRotation(e.x, e.y);
	this.player.gun.shootstart();
},

ontouchmove: function(e) {
	this.player.mySetRotation(e.x, e.y);
},

ontouchend: function(e) {
	this.player.mySetRotation(e.x, e.y);
	this.player.gun.shootend();
}

});
