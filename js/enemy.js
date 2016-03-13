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
