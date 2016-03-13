var STitle = Class.create(Scene, {
initialize: function() {
	Scene.call(this);
	this.backgroundColor = "rgb(180,235,250)";

  var surface = new Surface(WIDTH, HEIGHT);
  var c = surface.context;
  c.beginPath();
  var grad = c.createRadialGradient(WIDTH / 2, HEIGHT / 2, 1, WIDTH / 2, HEIGHT / 2, HEIGHT);
  grad.addColorStop(0, 'rgba(102,204,255,0)');
  grad.addColorStop(0.5, 'rgba(102,204,255,0.2)');
  grad.addColorStop(1.0, 'rgba(102,204,255,0.9)');
  c.fillStyle = grad;
  c.fillRect(0, 0, WIDTH, HEIGHT);

  var g = new Sprite(WIDTH, HEIGHT);
  g.image = surface;
  this.addChild(g);

	var title2 = new Label();
	title2.text = "シューター(仮)";
	title2.color = "#000";
	title2.font = "45px 'メイリオ'";
	title2.textAlign = "center";
	title2.x = WIDTH / 2 - title2.width / 2 + 1;
	title2.y = 301;
	this.addChild(title2);

	var title = new Label();
	title.text = "シューター(仮)";
	title.color = "white";
	title.font = "45px 'メイリオ'";
	title.textAlign = "center";
	title.x = WIDTH / 2 - title.width / 2;
	title.y = 300;
	this.addChild(title);

	var start = new Label();
	start.text = "画面をクリックして開発版シングルプレイを開始！";
  start.color = "#111";
	start.font = "30px 'メイリオ'";
	start.textAlign = "center";
	start.width = 900;
	start.height = 30;
	start.x = WIDTH / 2 - start.width / 2;
	start.y = 550;
	this.addChild(start);
	this.start = start;

	var ver = new Label();
	ver.text = "version : "+VERSION;
	ver.color = "#111";
	ver.font = "20px 'メイリオ'";
  ver.x = 5;
	ver.y =  HEIGHT - 30;
	this.addChild(ver);
},
ontouchstart: function(e) {
	game.pushScene(new SBattle());
},
onenterframe: function() {
	this.start.y += Math.sin(Time.frame / 30) * 0.5;
}
});
