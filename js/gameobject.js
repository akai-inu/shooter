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
