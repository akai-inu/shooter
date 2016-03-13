var ADJUSTSCROLLX = WIDTH * 0.5;
var ADJUSTSCROLLY = HEIGHT * 0.2;
var Level = Class.create(Group, {
initialize: function(scene, type) {
	Group.call(this);
	this.scene = scene;
	this.type = type;
	this.scrollX = 0;
	this.scrollY = 0;
	this.outLeft = 0;
	this.outRight = 1000000;
	this.outUp = -1000000;
	this.outDown = 1000000;
  this.layers = [];

	this.createLevel();
},

createLevel: function() {
	this.outLeft = 0;
	this.outRight = 15000;
	this.outUp = 0;
	this.outDown = HEIGHT;


  // 背景グラデーション
  var l = new BackgroundLayer(this, 1);
  var bg = new Sprite(1, HEIGHT);
  bg.image = this.getbgGradient('rgb(102,204,255)', 'rgb(180,235,250)');;
  bg.width = WIDTH;
  l.addChild(bg);
  this.layers.push(l);

  // 雲
  l = new BackgroundLayer(this, 0.8);
  var cloud = new Sprite(800, 256);
  cloud.image = game.assets["res/cloud.png"];
  cloud.x = Math.random() * 300;
  cloud.y = Math.random() * 100;
  l.addChild(cloud);
  this.layers.push(l);

	// 地面追加
  l = new BackgroundLayer(this, 0);
	var ground = new Entity();
	ground.y = HEIGHT - 100;
	ground.width = this.outRight;
	ground.height = 1000;
	ground.backgroundColor = "#333";
  l.addChild(ground);
  this.layers.push(l);

	var ey = HEIGHT - 100 - 32;
	this.enemyData = [
		{ x: 1500, y: ey, type: "dog" },
		{ x: 1550, y: ey, type: "dog" },
		{ x: 1900, y: ey, type: "dog" },
		{ x: 2100, y: ey, type: "dog" },
		{ x: 2300, y: ey, type: "dog" },
	];

	// メジャー文字追加
	for(var i = 0; i < 100; i++) {
		var major = new Label();
		major.text = "|"+i+"00px";
		major.x = i*100;
		major.y = HEIGHT - 100 - 18;
		major.font = '14px "メイリオ"';
		l.addChild(major);
	}

  for(var i in this.layers) {
    this.addChild(this.layers[i]);
  }
},

getbgGradient: function(up, down) {
  var surface = new Surface(1, HEIGHT);
  var c = surface.context;
  c.beginPath();
  var grad = c.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, up);
  grad.addColorStop(1, down);
  c.fillStyle = grad;
  c.rect(0, 0, 1, HEIGHT);
  c.fill();
  return surface;
},

setScroll: function(x, y, vx, vy) {
	var relativeX = this.scrollX + x;
	var relativeY = this.scrollY + y;

	// ゲーム開始時の移動
	if(this.scrollX == 0) {
		this.scrollX = Math.abs(relativeX - (WIDTH - ADJUSTSCROLLX));
		this.scrollY = Math.abs(relativeY - (HEIGHT - ADJUSTSCROLLY));
	}

	// 左右にスクロール
	if(without(relativeX, ADJUSTSCROLLX, WIDTH - ADJUSTSCROLLX)) {
		if(vx > 0 && relativeX > WIDTH - ADJUSTSCROLLX) {
			// 右にスクロール(-scrollX)
			this.scrollX -= Math.abs(relativeX - (WIDTH - ADJUSTSCROLLX));
		} else if(vx < 0 && relativeX < ADJUSTSCROLLX) {
			// 左にスクロール(scrollX)
			this.scrollX += Math.abs(ADJUSTSCROLLX - relativeX);
		}
	}

	// 上下にスクロール
	if(without(relativeY, ADJUSTSCROLLY, HEIGHT - ADJUSTSCROLLY)) {
		if(vy > 0 && relativeY > HEIGHT - ADJUSTSCROLLY) {
			// 下にスクロール(-scrollY)
			this.scrollY -= Math.abs(relativeY - (HEIGHT - ADJUSTSCROLLY));
		} else if(vy < 0 && relativeY < ADJUSTSCROLLY) {
			// 上にスクロール(scrollY)
			this.scrollY += Math.abs(ADJUSTSCROLLY - relativeY);
		}
	}

	// マウスでスクロール
	var mousex = (MOUSEX - WIDTH / 2) / 2;
	var mousey = (MOUSEY - HEIGHT / 2) / 4;

  // マウス分を実際の値に追加してclamp
	this.x = clamp(this.scrollX - mousex, -(this.outRight - WIDTH), -this.outLeft);
	this.y = clamp(this.scrollY - mousey, -(this.outDown - HEIGHT), -this.outUp);

  // 各背景レイヤーをスクロール
  for(var i in this.layers)
    this.layers[i].setScroll(this.x, this.y);

	return { scrollX: this.scrollX, scrollY: this.scrollY };
}
});
