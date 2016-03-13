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
