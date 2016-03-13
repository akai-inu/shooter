var CollisionManager = Class.create(Group, {
initialize: function(scene) {
	Group.call(this);
	this.scene = scene;
  this.colliders = [];
},

addcollider: function(collider) {
  this.colliders.push(collider);
},
removecollider: function(collider) {
  for(var i = 0; i < this.colliders.length; i++) {
    if(this.colliders[i] == collider) {
      this.colliders.splice(i, 1);
      return true;
    }
  }
  return false;
},

onenterframe: function() {
  // 衝突判定を行う
  var deleteArray = []; // 削除配列

  for(var i = 0; i < this.colliders.length; i++) {
    for(var j = i + 1; j < this.colliders.length; j++) {
      var obji = this.colliders[i];
      var objj = this.colliders[j];
      
      // オブジェクトがnullの場合
      // 同じタイプの場合
      // enabledがfalseの場合
      // oncollideメソッドがnullの場合判定しない
      if(obji == null ||
        objj == null ||
        obji.name == objj.name ||
        !obji.enabled ||
        !objj.enabled ||
        obji.willdelete ||
        objj.willdelete ||
        obji.oncollide == null ||
        objj.oncollide == null)
        continue;

      if(this.hascollide(obji, objj)) {
        obji.oncollide(objj);
        objj.oncollide(obji);

        if(obji.willdelete)
          deleteArray.push(obji);
        if(objj.willdelete)
          deleteArray.push(objj);
      }
    }
  }

  // 削除するものは削除
  for(var i in deleteArray) {
    this.removecollider(deleteArray[i]);
    if(DEBUG)
      deleteArray[i].line.visible = false;
  }
},

hascollide: function(obj1, obj2) {
  if(obj1.collideType == "rect" &&
    obj2.collideType == "rect") {
    return obj1.intersect(obj2);
  } else if(obj1.collideType != obj2.collideType) {
    if(obj1.collideType == "rect")
      return this.collideRectArc(obj1, obj2);
    else
      return this.collideRectArc(obj2, obj1);
  } else {
    return obj1.within(obj2);
  }
},

collideRectArc: function(rect, arc) {
  // 矩形と円の判定
  var ax = rect.x + rect._offsetX;
  var ay = rect.y + rect._offsetY;
  var a = [
    {x: ax, y: ay},
    {x: ax + rect.width, y: ay},
    {x: ax, y: ay + rect.height},
    {x: ax + rect.width, y: ay + rect.height}
  ];
  var b = {
    x: arc.x + arc._offsetX,
    y: arc.y + arc._offsetY,
    r: Math.max(arc.width, arc.height) / 2
  };

  var result =
    this._collideRectArcFirst(a, b) ||
    this._collideRectArcSecond(a, b) ||
    this._collideRectArcThird(a, b);
  return result;
},

_collideRectArcFirst: function(a, b) {
  // 端点と円
  for(var i = 0; i < 4; i++)
    if(this.collidePointArc(a[i].x, a[i].y, b.x, b.y, b.r))
      return true;

  return false;
},

_collideRectArcSecond: function(a, b) {
  // 線分と円
  var pq, pm, dot, k, pqd2, pmd2, phd2, d2;

  var n = [ [ 0, 1, 3, 2 ], [ 1, 3, 2, 0 ] ];
  for(var i = 0; i < 4; i++) {
    pq = this.getVector(a[(n[0][i])], a[(n[1][i])]);
    pm = this.getVector(a[(n[0][i])], b);

    dot = this.getDot(pq, pm);
    pqd2 = this.getLength2(pq);
    pmd2 = this.getLength2(pm);

    k = dot / pqd2;

    if(k < 0 || 1 < k)
      continue;

    phd2 = (dot * dot) / pqd2;
    d2 = pmd2 - phd2;

    if(d2 < b.r * b.r)
      return true;
  }

  return false;
},

_collideRectArcThird: function(a, b) {
  // 円の侵入
  var pp, pm, dot, cross;
  var theta = [0, 0];

  for(var i = 0; i < 2; i++) {
    pp = this.getVector(a[i * 3], a[1 + i]);
    pm = this.getVector(a[i * 3], b);

    dot = this.getDot(pp, pm);
    cross = this.getCross(pp, pm);

    theta[i] = Math.atan2(cross, dot);
  }

  var result =
    0 <= theta[0] && theta[0] <= Math.PI / 2 &&
    0 <= theta[1] && theta[1] <= Math.PI / 2;
  return result;
},

collidePointArc: function(ax, ay, bx, by, r) {
  var dx = bx - ax;
  var dy = by - ay;
  return ((dx * dx) + (dy * dy)) < (r * r);
},
getVector: function(ax, ay, bx, by) {
  return {x: bx - ax, y: by - ay};
},
getDot: function(a, b) {
  return a.x * b.x + a.y * b.y;
},
getCross: function(a, b) {
  return a.x * b.y - a.y * b.x;
},
getLength2: function(a) {
  return this.getDot(a, a);
}
});
