lobby.transporter.module.create('animation', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('animation', {}, {category: ['animation']}, {comment: 'Taking a crack at some of those cartoon animation techniques that Self\'s UI1 uses.\nhttp://selflanguage.org/documentation/published/animation.html'});

});


thisModule.addSlots(animation, function(add) {

  add.creator('wholeThing', {});

  add.creator('multiSegment', {});

  add.creator('timeSegment', {});

  add.creator('accelerator', {});

  add.creator('pathMover', {});

  add.creator('straightPath', {});

  add.method('newMovement', function (morph, destinationPt, functionToCallWhenDone) {
    var timePerStep = 40;
    var accelOrDecelDuration = 240;
    var totalMovingDuration = 600;
    var constantSpeedDuration = totalMovingDuration - accelOrDecelDuration - accelOrDecelDuration;
    var fullSpeed = 1 / ((totalMovingDuration - accelOrDecelDuration) / timePerStep);
    var acceleration = fullSpeed / (accelOrDecelDuration / timePerStep);
    
    var path = Object.newChildOf(this.straightPath, morph.getPosition(), destinationPt);

    var timeSegments = [];
    timeSegments.push(Object.newChildOf(this.timeSegment, "accelerating",    accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator,  acceleration)));
    timeSegments.push(Object.newChildOf(this.timeSegment, "cruising along", constantSpeedDuration / timePerStep, Object.newChildOf(this.accelerator,  0           )));
    timeSegments.push(Object.newChildOf(this.timeSegment, "decelerating",    accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator, -acceleration)));

    var speederizer = Object.newChildOf(this.multiSegment, timeSegments);

    var moverizer = Object.newChildOf(this.timeSegment, "whole arc", totalMovingDuration / timePerStep, Object.newChildOf(this.pathMover, path));

    return Object.newChildOf(this.wholeThing, morph, [speederizer, moverizer], functionToCallWhenDone);

  });

});


thisModule.addSlots(animation.wholeThing, function(add) {

  add.method('initialize', function (morph, simulaneousProcesses, functionToCallWhenDone) {
    this._morph = morph;
    this._simulaneousProcesses = simulaneousProcesses;
    this._functionToCallWhenDone = functionToCallWhenDone;
  });

  add.method('doOneStep', function () {
    var anyAreNotDoneYet = false;
    for (var i = 0, n = this._simulaneousProcesses.length; i < n; ++i) {
      if (this._simulaneousProcesses[i].doOneStep(this._morph)) {
        anyAreNotDoneYet = true;
      }
    }
    if (! anyAreNotDoneYet) {
      this._functionToCallWhenDone();
    }
    return anyAreNotDoneYet;
  });

});


thisModule.addSlots(animation.multiSegment, function(add) {

  add.method('initialize', function (timeSegments) {
    this._timeSegments = timeSegments;
    this._currentSegmentIndex = 0;
  });

  add.method('currentSegment', function () {
    return this._timeSegments[this._currentSegmentIndex];
  });

  add.method('doOneStep', function (morph) {
    while (true) {
      var s = this.currentSegment();
      if (!s) { return false; }
      var isNotDoneYet = s.doOneStep(morph);
      if (isNotDoneYet) { return true; } else { this._currentSegmentIndex += 1; }
    }
  });

});


thisModule.addSlots(animation.timeSegment, function(add) {

  add.method('initialize', function (name, stepsLeft, movement) {
    this._name = name;
    this._stepsLeft = stepsLeft;
    this._movement = movement;
  });

  add.method('doOneStep', function (morph) {
    //console.log(this._name + " has " + this._stepsLeft + " steps left.");
    if (this._stepsLeft <= 0) { return false; }
    this._movement.doOneStep(morph, this._stepsLeft);
    --this._stepsLeft;
    return true;
  });

});


thisModule.addSlots(animation.accelerator, function(add) {

  add.method('initialize', function (acceleration) {
    this._acceleration = acceleration;
  });

  add.method('doOneStep', function (morph, stepsLeft) {
    if (morph._speed === undefined) { morph._speed = 0; }
    morph._speed += this._acceleration;
    //console.log("acceleration: " + this._acceleration + ", speed: " + morph._speed);
  });

});


thisModule.addSlots(animation.pathMover, function(add) {

  add.method('initialize', function (path) {
    this._path = path;
  });

  add.method('doOneStep', function (morph, stepsLeft) {
    morph.setPosition(this._path.move(morph._speed, morph.getPosition()));
  });

});


thisModule.addSlots(animation.straightPath, function(add) {

  add.method('initialize', function (from, to) {
    this._source = from;
    this._destination = to;
    this._totalDistance = to.subPt(from).r();
  });

  add.method('move', function (speed, curPos) {
    var distanceToMove = speed * this._totalDistance;
    //console.log("speed: " + speed + ", distanceToMove: " + distanceToMove + ", curPos: " + curPos);
    var vector = this._destination.subPt(curPos);
    if (vector.r() < 0.1) {return curPos;}
    return curPos.addPt(vector.normalized().scaleBy(distanceToMove));
  });

});



});
