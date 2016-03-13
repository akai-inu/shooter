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
