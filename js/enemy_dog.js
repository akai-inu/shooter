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
