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
