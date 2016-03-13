var SoundManager = Class.create({
initialize: function(audioListener) {
  this.assets = game.assets;
  this.audioListener = audioListener;
},
play: function(name, emitterx, emittery) {
  var sound = this.assets[name].clone();
  var volume = distance2(
    this.audioListener.x, this.audioListener.y,
    emitterx, emittery) / (HEARDISTANCE * HEARDISTANCE);
  sound.volume = clamp(SEVOLUME * (1.0 - volume), 0.0, SEVOLUME);
  sound.play();
}
});
