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
