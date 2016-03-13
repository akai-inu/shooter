var BattleMenu = Class.create(Group, {
initialize: function() {
  Group.call(this);
  var form = new Label();
  form.y = 500;
  form.text = '<form><input type="text"></form>';
  this.addChild(form);
}
});
