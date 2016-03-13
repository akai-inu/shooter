function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
};
function within(value, min, max) {
	return min <= value && value <= max;
};
function without(value, min, max) {
	return value < min || max < value;
};
function lerp(value, start, end) {
	return (end - start) * clamp(value, 0.0, 1.0) + start;
};
var toRadianVal = Math.PI / 180.0;
function toRadian(value) {
	return value * toRadianVal;
};
var toDegreeVal = 180.0 / Math.PI;
function toDegree(value) {
	return value * toDegreeVal;
};
function distance(x1, y1, x2, y2) {
	var x = x1 - x2;
	var y = y1 - y2;
	return Math.sqrt(x*x+y*y);
}
function distance2(x1, y1, x2, y2) {
  var x = x1 - x2;
  var y = y1 - y2;
  return x*x+y*y;
}

var MOUSEX = 0;
var MOUSEY = 0;
(function() {
	window.document.onmousemove = function(e) {
		MOUSEX = e.pageX;
		MOUSEY = e.pageY;
	};
})();
