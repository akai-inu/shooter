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
