enchant();
var game = null;

var DEBUG = true;
var SERVERFPS = 15;
var VERSION = "0.0.6";
var WIDTH = 1280;
var HEIGHT = 720;
var FPS = 60;
var SEVOLUME = 0.1;
var BGMVOLUME = 0.2;
var HEARDISTANCE = 5000;
var RESOURCES = [
	"res/smallman.png",
	"res/smallman_head.png",
	"res/beretta.png",
	"res/enemy01.png",
	"res/enemy02.png",
  "res/cloud.png",
	"res/sound/shot2.wav",
	"res/sound/shot3.wav",
	"res/sound/shot4.wav",
	"res/sound/shot5.wav",
	"res/sound/reload.wav",
	"res/sound/walk1.wav"
];
// タイムキーパー。FPSやフレーム間の経過時間などを保持する。
var TimeKeeper = function () {
  this.initialize(60);
};
TimeKeeper.prototype = {
initialize: function(fps) {
	this.startTime = performance.now();
	this.prevTime = this.startTime;

	this.targetElapsed = Math.floor(1000 / fps) + 1; // ms
  this.averageFps = 0;

	this.frame = 0;

  this.elapsedms = 0;
  this.elapsedsec = 0.0;
  this.isSlowly = false;

	this.elapsedArray = []; // 移動平均法によるFPS算出
  this.totalElapsed = 0; // 移動平均の合計
	this.totalElapsedsec = 0.0; // 合計経過時間(秒)
	this.totalElapsedms = 0; // 合計経過時間(ミリ秒)

  this.updateframe(); // 1フレーム目を初期化
},
updateframe: function() {
	this.frame++;

	var elapsed = performance.now() - this.prevTime;
	this.prevTime += elapsed;

	this.totalElapsedms += Math.floor(elapsed);
	this.elapsedms = elapsed;
	this.totalElapsedsec = this.totalElapsedms / 1000;
	this.elapsedsec = elapsed / 1000;

	this.isSlowly = elapsed > this.targetElapsed;

	this.elapsedArray.push(this.elapsedms);
	this.totalElapsed += this.elapsedms;

  // 移動平均の配列が1秒分以上あったら最初を削除
	if(this.elapsedArray.length > FPS) {
		var e = this.elapsedArray.shift();
		this.totalElapsed -= e;
	}

	var t = this.totalElapsed / this.elapsedArray.length;
	this.averageFps = 1000 / t;
},
now: function() {
	return performance.now() - this.startTime;
}
};
var Time = new TimeKeeper();
var ELabel = Class.create(Group, {
initialize: function(shadow, round) {
	Group.call(this);
	this.shadow = shadow;
	this.round = round;

	this.label = new Label();
}
});
var SoundManager = Class.create({
initialize: function(audioListener) {
  this.assets = game.assets;
  this.audioListener = audioListener;
},
play: function(name, emitterx, emittery) {
  var sound = this.assets[name].clone();
  var volume = distance2(
    this.audioListener.x, this.audioListener.y,
    emitterx, emittery) / (HEARDISTANCE * HEARDISTANCE);
  sound.volume = clamp(SEVOLUME * (1.0 - volume), 0.0, SEVOLUME);
  sound.play();
}
});
var Communication = Class.create({
initialize: function(type) {
	
}
});
var CommunicationManager = Class.create({
initialize: function() {
	
}
});
// gameobject.js
// シーン上に存在するオブジェクトのスーパークラス。
// コンストラクタ引数: { scene, name, width, height, collideType }
var GameObject = Class.create(Group, {
initialize: function(args) {
	Group.call(this);

	this.name = args.name;
	this.scene = args.scene;
	this.width = args.width;
	this.height = args.height;
  this.collider = new Collider(this, args.collideType, this.oncollide);
  this.addChild(this.collider);

	if(DEBUG) {
		var t = new Label();
		t.font = '13px "メイリオ"';
		this.addChild(t);
		this.debugTextLabel = t;
		this.debugText = [];
	}
},

onenterframe: function() {
	this.beforemove();

	var moved = this.onmove();
	this.x += moved.x;
	this.y += moved.y;

	this.aftermove(moved.x, moved.y);
	this.centerX = this.x + this.width / 2;
	this.centerY = this.y + this.height / 2;

	if(DEBUG) {
		var y = this.debugText.length * -16;
		var t = "";
		for(var i in this.debugText) {
			t += this.debugText[i]+"<br>";
		}
		this.debugTextLabel.y = y;
		this.debugTextLabel.text = t;
		this.debugText = [];
	}
},

beforemove: function() { },

onmove: function() {
	return {x:0, y:0};
},

aftermove: function(vx, vy) { },

oncollide: function(collider) { },

removecollider: function() {
  this.scene.collisionManager.removecollider(this.collider);
}

});
var CollisionManager = Class.create(Group, {
initialize: function(scene) {
	Group.call(this);
	this.scene = scene;
  this.colliders = [];
},

addcollider: function(collider) {
  this.colliders.push(collider);
},
removecollider: function(collider) {
  for(var i = 0; i < this.colliders.length; i++) {
    if(this.colliders[i] == collider) {
      this.colliders.splice(i, 1);
      return true;
    }
  }
  return false;
},

onenterframe: function() {
  // 衝突判定を行う
  var deleteArray = []; // 削除配列

  for(var i = 0; i < this.colliders.length; i++) {
    for(var j = i + 1; j < this.colliders.length; j++) {
      var obji = this.colliders[i];
      var objj = this.colliders[j];
      
      // オブジェクトがnullの場合
      // 同じタイプの場合
      // enabledがfalseの場合
      // oncollideメソッドがnullの場合判定しない
      if(obji == null ||
        objj == null ||
        obji.name == objj.name ||
        !obji.enabled ||
        !objj.enabled ||
        obji.willdelete ||
        objj.willdelete ||
        obji.oncollide == null ||
        objj.oncollide == null)
        continue;

      if(this.hascollide(obji, objj)) {
        obji.oncollide(objj);
        objj.oncollide(obji);

        if(obji.willdelete)
          deleteArray.push(obji);
        if(objj.willdelete)
          deleteArray.push(objj);
      }
    }
  }

  // 削除するものは削除
  for(var i in deleteArray) {
    this.removecollider(deleteArray[i]);
    if(DEBUG)
      deleteArray[i].line.visible = false;
  }
},

hascollide: function(obj1, obj2) {
  if(obj1.collideType == "rect" &&
    obj2.collideType == "rect") {
    return obj1.intersect(obj2);
  } else if(obj1.collideType != obj2.collideType) {
    if(obj1.collideType == "rect")
      return this.collideRectArc(obj1, obj2);
    else
      return this.collideRectArc(obj2, obj1);
  } else {
    return obj1.within(obj2);
  }
},

collideRectArc: function(rect, arc) {
  // 矩形と円の判定
  var ax = rect.x + rect._offsetX;
  var ay = rect.y + rect._offsetY;
  var a = [
    {x: ax, y: ay},
    {x: ax + rect.width, y: ay},
    {x: ax, y: ay + rect.height},
    {x: ax + rect.width, y: ay + rect.height}
  ];
  var b = {
    x: arc.x + arc._offsetX,
    y: arc.y + arc._offsetY,
    r: Math.max(arc.width, arc.height) / 2
  };

  var result =
    this._collideRectArcFirst(a, b) ||
    this._collideRectArcSecond(a, b) ||
    this._collideRectArcThird(a, b);
  return result;
},

_collideRectArcFirst: function(a, b) {
  // 端点と円
  for(var i = 0; i < 4; i++)
    if(this.collidePointArc(a[i].x, a[i].y, b.x, b.y, b.r))
      return true;

  return false;
},

_collideRectArcSecond: function(a, b) {
  // 線分と円
  var pq, pm, dot, k, pqd2, pmd2, phd2, d2;

  var n = [ [ 0, 1, 3, 2 ], [ 1, 3, 2, 0 ] ];
  for(var i = 0; i < 4; i++) {
    pq = this.getVector(a[(n[0][i])], a[(n[1][i])]);
    pm = this.getVector(a[(n[0][i])], b);

    dot = this.getDot(pq, pm);
    pqd2 = this.getLength2(pq);
    pmd2 = this.getLength2(pm);

    k = dot / pqd2;

    if(k < 0 || 1 < k)
      continue;

    phd2 = (dot * dot) / pqd2;
    d2 = pmd2 - phd2;

    if(d2 < b.r * b.r)
      return true;
  }

  return false;
},

_collideRectArcThird: function(a, b) {
  // 円の侵入
  var pp, pm, dot, cross;
  var theta = [0, 0];

  for(var i = 0; i < 2; i++) {
    pp = this.getVector(a[i * 3], a[1 + i]);
    pm = this.getVector(a[i * 3], b);

    dot = this.getDot(pp, pm);
    cross = this.getCross(pp, pm);

    theta[i] = Math.atan2(cross, dot);
  }

  var result =
    0 <= theta[0] && theta[0] <= Math.PI / 2 &&
    0 <= theta[1] && theta[1] <= Math.PI / 2;
  return result;
},

collidePointArc: function(ax, ay, bx, by, r) {
  var dx = bx - ax;
  var dy = by - ay;
  return ((dx * dx) + (dy * dy)) < (r * r);
},
getVector: function(ax, ay, bx, by) {
  return {x: bx - ax, y: by - ay};
},
getDot: function(a, b) {
  return a.x * b.x + a.y * b.y;
},
getCross: function(a, b) {
  return a.x * b.y - a.y * b.x;
},
getLength2: function(a) {
  return this.getDot(a, a);
}
});
var Collider = Class.create(Entity, {
initialize: function(gameobj, collideType, oncollide) {
	Entity.call(this);

	this.gameobj = gameobj;
	this.scene = gameobj.scene;
	this.name = gameobj.name;
	this.collideType = collideType;

	this.width = gameobj.width;
	this.height = gameobj.height;

  this.enabled = true; // 判定を行うかどうかのフラグ
  this.oncollide = oncollide; // 判定がtrueになった際のイベント関数
  this.willdelete = false; // 判定の最後に削除するかどうかのフラグ

	this.scene.collisionManager.addcollider(this);

	if(DEBUG) {
		var surface = null;
		var c = null;
		var x = 0;
		var y = 0;
		switch(this.collideType) {
			case "rect":
				surface = new Surface(gameobj.width, gameobj.height);
				c = surface.context;
				c.beginPath();
				c.rect(0, 0, gameobj.width, gameobj.height);
				break;
			default:
				var radius = Math.max(gameobj.width, gameobj.height) / 2;
				surface = new Surface(radius * 2, radius * 2);
				c = surface.context;
				c.beginPath();
				c.arc(radius, radius, radius - 2, 0, Math.PI*2);
				x = gameobj.width / 2 - radius;
				y = gameobj.height / 2 - radius;
				break;
		}
		c.strokeStyle = "#000";
		c.lineWidth = 1;
		c.stroke();

		this.line = new Sprite(surface.width, surface.height);
		this.line.image = surface;
		this.line.x = x;
		this.line.y = y;
		this.gameobj.addChild(this.line);
	}

},
});
// player.js
// 操作出来ること
// WASD : XY軸の移動
// クリック : 狙った方向に射撃
// R : 手動リロード
//
var Player = Class.create(GameObject, {
initialize: function(scene, level, isMine, name) {
	var classname = isMine ? "Player" : "Friend";
	GameObject.call(this, {
    scene: scene,
    name: classname,
    width: 64,
    height: 64,
    collideType: "arc"
  });
	this.level = level;
	this.isMine = isMine;
	this.friendname = name;
	this.level.addChild(this);

	// SE
	this.walkse = game.assets["res/sound/walk1.wav"].clone();

	// 子要素の追加
	// Body
	this.body = new Sprite(64, 64);
	this.body.image = game.assets["res/smallman.png"];
	this.addChild(this.body);

	// Head
	this.head = new Sprite(64, 64);
	this.head.image = game.assets["res/smallman_head.png"];
	this.addChild(this.head);

	// Reload Bar
	this.reloadBar = new Entity();
	this.reloadBar.x = 0;
	this.reloadBar.y = -15;
	this.reloadBar.width = 0;
	this.reloadBar.height = 10;
	this.reloadBar.backgroundColor = "green";
	this.addChild(this.reloadBar);
	
	// Gun
	this.gun = new Gun(this, "handgun");
	this.addChild(this.gun);

	// Playerのデータ初期設定
	this.x = Math.random() * 300;
	this.y = HEIGHT - 100 - 64;
	this.movepowerX = 0;
	this.centerX = this.body.width / 2;
	this.centerY = this.body.height / 2;
	this.direction = 0;

	// フレンドの名前表示
	if(!this.isMine) {
    // TODO: もっと使いやすいLabelクラスが欲しい
		this.nameLabel = new Label();
		this.nameLabel.y = - 25;
		this.nameLabel.x = - 110;
		this.nameLabel.textAlign = "center";
		this.nameLabel.text = this.friendname;
		this.nameLabel.font = "14px 'メイリオ'";
		this.addChild(this.nameLabel);
		this.nameLabelW = new Label();
		this.nameLabelW.y = -26;
		this.nameLabelW.x = - 111;
		this.nameLabelW.color = "#FFF";
		this.nameLabelW.textAlign = "center";
		this.nameLabelW.text = this.friendname;
		this.nameLabelW.font = "14px 'メイリオ'";
		this.addChild(this.nameLabelW);
	}

	if(!this.isMine)
		this.collider.enabled = false;

	// 通信データ
	this.sendLerpData = null;
	this.sendFrameData = [];
	this.recvFrameData = [];
	this.lastSendTime = Time.now();
},

oncollide: function(collider) {
  if(collider.name == "Enemy") {
    this.parentNode.debugText.push("エネミーからダメージ!");
  }
},

// 銃を指定したタイプに変更する
setGun: function(type) {
	if(!this.gun)
		this.gun = new Gun(this, type);
	else {
		this.gun.type = type;
		this.gun.initialize(this, type);
	}
},

// 自キャラの回転を設定する(マウス座標)
mySetRotation: function(x, y) {
	var vx = x - (this.level.x + this.x + this.head.width / 2);
	var vy = y - (this.level.y + this.y + this.head.height / 2);
	this.direction = Math.atan2(vx, vy);
},

// フレンドキャラの回転を設定する(direction)
frSetRotation: function(rot) {
	this.direction = rot;	
},

onmove: function() {
	return this.isMine ? this.mymove() : this.othermove();
},

aftermove: function(vx, vy) {
	// レベル端の制限
	this.x = clamp(this.x, this.level.outLeft, this.level.outRight - this.body.width);
	this.y = clamp(this.y, this.level.outUp, this.level.outDown - this.body.height);

	// レベル全体をスクロール
	if(this.isMine)
		this.level.setScroll(this.x, this.y, vx, vy);

	this.rotatesprite(vx, vy);

	// アニメーション
	var anim = vx != 0 ? 8 : 16;
	if (game.frame % anim == 0) {
		this.body.frame = (this.body.frame + 1) % 2;
	}

	// リロードバー表示
	if(this.gun.isReloading)
		this.reloadBar.width = this.gun.reloadRate * 64;
	else
		this.reloadBar.width = 0;
	
	// 弾薬がなくなったらハンドガンに持ち変える
	if(this.gun.ammo <= 0 && this.gun.magazine <= 0) {
		this.setGun("handgun");
	}

	// 送信データを追加
	if(this.isMine && game.frame % SERVERFPS == 0) {
		this.sendLerpData = {
			pos: { x: Math.round(this.x), y: Math.round(this.y) },
			direction: this.direction,
			elapsed: Time.now() - this.lastSendTime,
			frames: this.sendFrameData
		};
		this.lastSendTime = Time.now();
		this.sendFrameData = [];
		// TODO: 送信
	}

	if(DEBUG) {
		this.debugText.push(Math.round(this.x)+","+Math.round(this.y));
		this.debugText.push(Math.round(this.head.rotation));
	}
},

rotatesprite: function(vx, vy) {
	// 身体の反転
	if(vx > 0) this.body.scaleX = 1;
	else if(vx < 0) this.body.scaleX = -1;

	// 銃と頭の回転
	this.head.rotation = this.gun.rotation = -toDegree(this.direction) + 90;
	if(within(Math.abs(this.head.rotation % 360), 90, 270)) {
		// 左向き
		this.head.scaleY = this.gun.scaleY = -1;
	} else {
		// 右向き
		this.head.scaleY = this.gun.scaleY = 1;
	}
},

mymove: function() {
	// 操作による移動
	var SPEED = 200 * Time.elapsedsec;
	var POWER = Time.elapsedsec * 2;
	var moved = {x: 0, y: 0};

	if (game.input.left) {
		this.movepowerX -= POWER * 2;
	} else if (game.input.right) {
		this.movepowerX += POWER * 2;
	} else {
		if(within(this.movepowerX, -0.08, 0.08))
			this.movepowerX = 0;
		else if(this.movepowerX < 0)
			this.movepowerX += POWER;
		else if(this.movepowerX > 0)
			this.movepowerX -= POWER;
	}
	this.movepowerX = clamp(this.movepowerX, -1, 1);

	if (game.input.r) { this.gun.reload(); }

	moved.x = SPEED * this.movepowerX;

	// 撃ってない時はdocumentのイベントでマウス座標を変換
	if(!this.gun.isShooting && MOUSEX != 0 && MOUSEY != 0) {
		this.mySetRotation(MOUSEX, MOUSEY);
	}
	return moved;
},

othermove: function() {
	// 受信データを適当に追加
	var now = Time.now();
	if(game.frame % SERVERFPS == 0 && this.scene.player.sendLerpData) {
		this.lerpData = this.scene.player.sendLerpData;
		this.lerpData.moved = {
			x: Math.floor(this.lerpData.pos.x - this.x) / this.lerpData.elapsed,
			y: Math.floor(this.lerpData.pos.y - this.y) / this.lerpData.elapsed
		};
		// フレームデータを配列に追加
		for(var i in this.lerpData.frames) {
			var me = this.lerpData.frames[i];
			me.lastTime = now;
			this.recvFrameData.push(me);
		}
		
		this.direction = this.lerpData.direction;
	}

	var moved = {x:0,y:0};

	if(this.lerpData != null) {
		// 移動
		moved.x = this.lerpData.moved.x * Time.elapsedms;
		moved.y = this.lerpData.moved.y * Time.elapsedms;

		// フレームデータの処理
		var me = null;
		if(this.recvFrameData.length >= 1)
			me = this.recvFrameData[0];

		if(me != null && me.e <= now - me.lastTime) {
			switch(me.t) {
				case "shootstart":
					this.gun.shootstart();
					break;
				case "shootend":
					this.gun.shootend();
					break;
				case "reload":
					this.gun.reload();
					break;
			}
			// 処理後配列から削除
			this.recvFrameData.shift();
		}
	}

	return moved;
},
});
// x, y, speed, weight, fullAuto,
// burst, multiplier, ammo, magazineSize, accuracy,
// burstInterval, autoInterval, wavName, reloadTime
var GunStatus = {
	"handgun": [
		29, 0, 800, 0.01, false, 1, 1, 9999999, 15, 0.12, 90, 90, "shot5.wav", 1200
	],
	"shotgun": [
		29, 0, 1000, 0.015, false, 1, 7, 70, 7, 4.2, 140, 140, "shot2.wav", 2200
	],
	"machinegun": [
		29, 0, 1300, 0.03, true, 1, 1, 400, 200, 2.5, 60, 60, "shot4.wav", 3000
	],
	"burstgun": [
		29, 0, 1500, 0.02, false, 3, 1, 90, 30, 0.08, 90, 90, "shot3.wav", 1600
	],
};

var Gun = Class.create(Sprite, {
initialize: function(player, type) {
	Sprite.call(this, 128, 64);
	this.image = game.assets["res/beretta.png"];
	this.player = player;
	this.type = type;
  this.scene = player.scene;

	// 銃情報読み込み
	this.offsetx = GunStatus[type][0];
	this.offsety = GunStatus[type][1];
	this.offset = { x: 0, y: 0 };
	this.speed = GunStatus[type][2];
	this.weight = GunStatus[type][3];
	this.fullAuto = GunStatus[type][4];
	this.burst = GunStatus[type][5];
	this.multiplier = GunStatus[type][6];
	this.ammo = GunStatus[type][7];
	this.magazineSize = GunStatus[type][8];
	this.accuracy = GunStatus[type][9];
	this.burstInterval = GunStatus[type][10];
	this.autoInterval = GunStatus[type][11];
	this.wavName = GunStatus[type][12];
	this.reloadTime = GunStatus[type][13];

	// 初期化
	this.x = -32;
	this.y = 0;

	this.se = game.assets["res/sound/"+this.wavName].clone();
	this.se.volume = SEVOLUME;
	this.reloadse = game.assets["res/sound/reload.wav"].clone();
	this.reloadse.volume = SEVOLUME;

	this.isShooting = false;
	this.isReloading = false;
	this.lastTime = null;
	this.reloadStartTime = null;
	this.burstNow = 0;
	this.magazine = this.magazineSize;
},

getOffset: function() {
	return { x: this.offset.x, y: this.offset.y };
},
__getOffset: function() {
	var vx = this.offsetx;
	var vy = this.offsety;
	var rad = -this.player.direction + Math.PI / 2;
	var vxd = vx * Math.cos(rad) - vy * Math.sin(rad);
	var vyd = vx * Math.sin(rad) + vy * Math.cos(rad);
	return {
		x: vxd + 32,
		y: vyd + 32
	};
},

shootstart: function() {
	// 弾がないかリロード中なら撃たない
	if(this.magazine <= 0 || this.isReloading)
		return;

	// 射撃開始
	this.isShooting = true;
	var t = Time.now() - this.lastTime;
	if(this.burstNow == 0 && t >= this.autoInterval) {
		this.burstNow = this.burst; // バースト開始
		this.shoot();
	}

	// 送信データ配列に追加
	if(this.player.isMine)
		this.player.sendFrameData.push({
			t: "shootstart",
			e : Time.now() - this.player.lastSendTime
		});
},
shootend: function() {
	this.isShooting = false;

	if(this.player.isMine)
		this.player.sendFrameData.push({
			t: "shootend",
			e : Time.now() - this.player.lastSendTime
		});
},

reload: function() {
	// 既にリロード中かマガジンが一杯(以上)ならリロードしない
	if(this.isReloading || this.magazine >= this.magazineSize) {
		return;
	}

	this.isReloading = true;
	this.reloadStartTime = Time.now();
	this.reloadRate = 0;
  this.scene.soundManager.play("res/sound/reload.wav", this.player.x, this.player.y);

	if(this.player.isMine) {
		this.player.sendFrameData.push({
			t: "reload",
			e: Time.now() - this.player.lastSendTime
		});
	}
},

onenterframe: function() {
	// オフセット更新
	this.offset = this.__getOffset();

	// 身体に合わせた銃画像移動
	this.y = this.player.body.frameIndex == 1 ? -4 : 0;

	// リロード処理
	if((this.magazine <= 0 && this.ammo >= this.magazineSize) ||
		this.isReloading) {

		this.isShooting = false;

		// リロード開始
		if(!this.isReloading)
			this.reload();

		// マガジンが増えてたらリロード終了
		if(this.magazine >= this.magazineSize)
			this.isReloading = false;
		
		var r = Time.now() - this.reloadStartTime;
		if(r >= this.reloadTime) {
			// リロード完了
			this.magazine = this.magazineSize;
			this.ammo -= this.magazineSize;
			this.isReloading = false;
		} else {
			// リロード中
			this.reloadRate = r / this.reloadTime;
		}
	}

	// オート射撃とバースト射撃
	var t = Time.now() - this.lastTime;
	if((this.isShooting && this.fullAuto && t >= this.autoInterval) ||
	   (this.burstNow > 0 && t >= this.burstInterval)) {
		this.shoot();
	}
},

shoot: function(rotation) {
	// 弾がなかったら撃たない
	if(this.magazine <= 0)
		return;

  this.scene.soundManager.play("res/sound/"+this.wavName, this.player.x, this.player.y);

	for(var i = 0; i < this.multiplier; i++) {
		var bullet = new Bullet(this, this.rotation + (Math.random()-0.5)*2*this.accuracy);
		this.player.level.addChild(bullet);
	}
	this.lastTime = Time.now();
	this.burstNow--;
	this.magazine--;
}
});
var Bullet = Class.create(GameObject, {
initialize: function(gun, rotation) {
	GameObject.call(this, {
   scene: gun.player.scene,
   name: "Bullet",
   width: 3,
   height: gun.speed * (Time.targetElapsed / 1000 * 2),
   collideType: "arc"
  });
	this.gun = gun;
	this.entity = new Entity();
	this.entity.backgroundColor = "#FFF";
	this.entity.width = 3;
	this.entity.height = 20;
	this.addChild(this.entity);

	this.x = this.gun.player.x + this.gun.getOffset().x - this.width / 2;
	this.y = this.gun.player.y + this.gun.getOffset().y - this.height / 2;

	var rad = toRadian(rotation);
	this.vx = Math.cos(rad);
	this.vy = Math.sin(rad);
	this.rotation = -toDegree(Math.atan2(this.vx, this.vy));
	this.shotTime = Time.now();

	this.gravity = 0;
	this.decrease = 1;

},

onmove: function() {
	this.decrease -= this.gun.weight * 0.08;
	if(this.decrease <= 0)
		this.decrease = 0;
	if(this.y < 0)
		this.gravity += this.gun.weight * 20;
	this.gravity += this.gun.weight * 3;
	var x = this.vx * Time.elapsedsec * this.gun.speed * this.decrease;
	var y = this.vy * Time.elapsedsec * this.gun.speed + this.gravity;
	this.rotation = -Math.atan2(x, y)*180/Math.PI;
	this.frame++;

	if(this.y > HEIGHT + 64) {
    this.removecollider();
		this.remove();
	}
	return {"x":x, "y":y};
}
});
var EnemyManager = Class.create(Group, {
initialize: function(scene, level) {
	Group.call(this);
	this.data = level.enemyData;
	this.level = level;
	this.scene = scene;
	this.player = scene.player;
	this.level.addChild(this);

	this.enemies = [];
	for(var i in this.data) {
		this.instanciate(this.data[i]);
	}
},

instanciate: function(data) {
	var e = null;
	switch(data.type) {
		case "dog":
			e = new EnemyDog(this, data);
			break;
	}
	this.enemies.push(e);
	this.addChild(e);
}
});
var EnemyStatus = {
	APPROACHING : 0,
	ATTACKING : 1,
	DEAD : 2
}
var Enemy = Class.create(GameObject, {
initialize: function(manager, data, width, height, collideType) {
	GameObject.call(this, {
    scene: manager.scene,
    name: "Enemy",
    width: width,
    height: height,
    collideType: collideType
  });
	this.manager = manager;
	this.player = manager.player;
	this.data = data;
	this.type = data.type;

	this.x = data.x;
	this.y = data.y;
	this.status = EnemyStatus.APPROACHING;
	this.statusElapsed = 0;
	this.statusStarted = +new Date();
},

beforemove: function() {
	var t = this.decidestatus();
	if(t != this.status) {
		this.status = t;
		this.statusStarted = +new Date();
	}
	this.statusElapsed = new Date() - this.statusStarted;

	if(DEBUG)
		this.debugText.push(this.status);
},

onmove: function() {
	var moved = {x:0, y:0};
	switch(this.status) {
		case EnemyStatus.APPROACHING:
			moved = this.onapproaching();
			break;
		case EnemyStatus.ATTACKING:
			moved = this.onattacking();
			break;
		case EnemyStatus.DEAD:
			moved = this.ondead();
			break;
	}

	return moved;
},

decidestatus: function() {
},

onapproaching: function() {
	return {x:0, y:0};
},

onattacking: function() {
	return {x:0, y:0};
},

ondead: function() {
	return {x:0, y:0};
}
});
var EnemyDog = Class.create(Enemy, {
initialize: function(manager, data) {
	Enemy.call(this, manager, data, 64, 32, "rect");

	this.sprite = new Sprite(this.width, this.height);
	this.sprite.image = game.assets["res/enemy02.png"];
	this.x = data.x;
	this.y = data.y;
	this.addChild(this.sprite);
},

oncollide: function(collider) {
  var e = this.parentNode;
  if(collider.name == "Bullet" && collider.parentNode.gun.player.isMine && e.status != EnemyStatus.DEAD) {
    this.parentNode.status = EnemyStatus.DEAD;
    collider.willdelete = true;
    collider.parentNode.remove();
  }
},

decidestatus: function() {
  if(this.status == EnemyStatus.DEAD)
    return EnemyStatus.DEAD;
	if(Math.abs(this.centerX - this.player.centerX) < this.width ||
		(this.status == EnemyStatus.ATTACKING && this.statusElapsed < 1000))
		return EnemyStatus.ATTACKING;
	else
		return EnemyStatus.APPROACHING;
},

onapproaching: function() {
	var moved = {x:0, y:0};
	if(this.centerX > this.player.centerX) {
		moved.x -= 150 * Time.elapsedsec + Math.sin(this.statusElapsed / 50);
		this.sprite.scaleX = -1;
	} else {
		moved.x += 150 * Time.elapsedsec + Math.sin(this.statusElapsed / 50);
		this.sprite.scaleX = 1;
	}

	return moved;
},

ondead: function() {
	this.sprite.scaleY = -1;
	return {x:0, y:0};
}
});
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
var BackgroundLayer = Class.create(Group, {
initialize: function(level, dist) {
  Group.call(this);
  this.level = level;
  this.distance = dist;
},
setScroll: function(x, y) {
  this.x = -x * this.distance;
  this.y = -y * this.distance;
}
});
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
var BattleMenu = Class.create(Group, {
initialize: function() {
  Group.call(this);
  var form = new Label();
  form.y = 500;
  form.text = '<form><input type="text"></form>';
  this.addChild(form);
}
});
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
