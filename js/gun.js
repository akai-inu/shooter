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
