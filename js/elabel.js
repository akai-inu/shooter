var ELabel = Class.create(Group, {
initialize: function(shadow, round) {
	Group.call(this);
	this.shadow = shadow;
	this.round = round;

	this.label = new Label();
}
});
