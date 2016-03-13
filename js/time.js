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
