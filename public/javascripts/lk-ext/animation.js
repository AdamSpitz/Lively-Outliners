lobby.transporter.module.create('animation', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('animation', {}, {category: ['animation']}, {comment: 'Taking a crack at some of those cartoon animation techniques that Self\'s UI1 uses.\nhttp://selflanguage.org/documentation/published/animation.html'});

});


thisModule.addSlots(animation, function(add) {

  add.creator('wholeThing', {});

  add.creator('multiSegment', {});

  add.creator('timeSegment', {});

  add.creator('resetter', {});

  add.creator('accelerator', {});

  add.creator('nothingDoer', {});

  add.creator('pathMover', {});

  add.creator('wiggler', {});

  add.creator('straightPath', {});

  add.creator('arcPath', {});

  add.method('newMovement', function (morph, destinationPt, shouldWiggleAtEnd, functionToCallWhenDone) {
    var           timePerStep = 40;

    var  anticipationDuration = 120;
    var       waitingDuration = 120;
    var  accelOrDecelDuration = 200;
    var    mainMovingDuration = 480;
    var      wigglingDuration = 200;

    var constantSpeedDuration = mainMovingDuration - accelOrDecelDuration - accelOrDecelDuration;
    var             fullSpeed = 1 / ((mainMovingDuration - accelOrDecelDuration) / timePerStep);
    var          acceleration = fullSpeed / (accelOrDecelDuration / timePerStep);
    
    var currentPt = morph.getPosition();
    var vector = currentPt.subPt(destinationPt);
    var distanceToTravel = vector.r();
    if (distanceToTravel < 0.1) { return Object.newChildOf(this.resetter, "already there", function() {}); }
    var anticipationPt = currentPt.addPt(vector.scaleToLength(distanceToTravel / 20));
    var anticPath = Object.newChildOf(this.straightPath,      currentPt, anticipationPt);
    var  mainPath = Object.newChildOf(this.arcPath,      anticipationPt,  destinationPt);

    var speederizer = Object.newChildOf(this.multiSegment);
    speederizer.timeSegments().push(Object.newChildOf(this.resetter,    "start antic.",    function(morph) {morph._speed = 1 / (anticipationDuration / timePerStep);}));
    speederizer.timeSegments().push(Object.newChildOf(this.timeSegment, "anticipating",    anticipationDuration / timePerStep, Object.newChildOf(this.accelerator,  acceleration)));
    speederizer.timeSegments().push(Object.newChildOf(this.resetter,    "done antic.",     function(morph) {morph._speed = 0;}));
    speederizer.timeSegments().push(Object.newChildOf(this.timeSegment, "waiting",              waitingDuration / timePerStep, Object.newChildOf(this.nothingDoer               )));
    speederizer.timeSegments().push(Object.newChildOf(this.timeSegment, "accelerating",    accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator,  acceleration)));
    speederizer.timeSegments().push(Object.newChildOf(this.timeSegment, "cruising along", constantSpeedDuration / timePerStep, Object.newChildOf(this.nothingDoer               )));
    speederizer.timeSegments().push(Object.newChildOf(this.timeSegment, "decelerating",    accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator, -acceleration)));
    speederizer.timeSegments().push(Object.newChildOf(this.resetter,    "done",            function(morph) {morph._speed = 0;}));

    var moverizer = Object.newChildOf(this.multiSegment);
    moverizer.timeSegments().push(Object.newChildOf(this.timeSegment, "anticipation line", anticipationDuration / timePerStep, Object.newChildOf(this.pathMover, anticPath)));
    moverizer.timeSegments().push(Object.newChildOf(this.timeSegment, "waiting to move",        waitingDuration / timePerStep, Object.newChildOf(this.nothingDoer         )));
    moverizer.timeSegments().push(Object.newChildOf(this.timeSegment, "main arc",            mainMovingDuration / timePerStep, Object.newChildOf(this.pathMover,  mainPath)));

    if (shouldWiggleAtEnd) {
      moverizer.timeSegments().push(Object.newChildOf(this.resetter,    "pre-wiggling",      function(morph) {morph.setPosition(destinationPt);}));
      moverizer.timeSegments().push(Object.newChildOf(this.timeSegment, "wiggling",              wigglingDuration / timePerStep, Object.newChildOf(this.wiggler, destinationPt)));
    }

    moverizer.timeSegments().push(Object.newChildOf(this.resetter,    "set final loc",     function(morph) {morph.setPosition(destinationPt);}));

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
    this._timeSegments = timeSegments || [];
    this._currentSegmentIndex = 0;
  });

  add.method('timeSegments', function () {
    return this._timeSegments;
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


thisModule.addSlots(animation.resetter, function(add) {

  add.method('initialize', function (name, functionToRun) {
    this._name = name;
    this._functionToRun = functionToRun;
  });

  add.method('doOneStep', function (morph) {
    this._functionToRun(morph);
    return false;
  });

});


thisModule.addSlots(animation.nothingDoer, function(add) {

  add.method('initialize', function () {
  });

  add.method('doOneStep', function (morph, stepsLeft) {
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


thisModule.addSlots(animation.wiggler, function(add) {

  add.method('initialize', function (loc) {
    this._center = loc;
    var wiggleSize = 5;
    this._extreme1 = loc.addXY(-wiggleSize, 0);
    this._extreme2 = loc.addXY( wiggleSize, 0);
    this._isMovingTowardExtreme1 = false;
    this._distanceToMovePerStep = wiggleSize / 2;
  });

  add.method('doOneStep', function (morph, stepsLeft) {
    var curPos = morph.getPosition();
    var dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    if (curPos.subPt(dstPos).rSquared() < 0.01) {
      this._isMovingTowardExtreme1 = ! this._isMovingTowardExtreme1;
      dstPos = this._isMovingTowardExtreme1 ? this._extreme1 : this._extreme2;
    }
    morph.setPosition(curPos.addPt(dstPos.subPt(curPos).scaleToLength(this._distanceToMovePerStep)));
  });

});


thisModule.addSlots(animation.straightPath, function(add) {

  add.method('initialize', function (from, to) {
    this._destination = to;
    this._totalDistance = to.subPt(from).r();
  });

  add.method('move', function (speed, curPos) {
    var vector = this._destination.subPt(curPos);
    if (vector.rSquared() < 0.01) {return curPos;}

    var distanceToMove = speed * this._totalDistance;
    //console.log("speed: " + speed + ", distanceToMove: " + distanceToMove + ", curPos: " + curPos);
    return curPos.addPt(vector.normalized().scaleBy(distanceToMove));
  });

});


thisModule.addSlots(animation.arcPath, function(add) {

  add.method('initialize', function (from, to) {
    this._destination = to;

    // Find the center of a circle that hits both points.
    var vector = to.subPt(from);
    var normal = vector.perpendicularVector().scaleToLength(vector.r() * 4); // can fiddle with the length until it looks good
    this._center = from.midPt(to).addPt(normal);
    var fromVector = from.subPt(this._center);
    var   toVector =   to.subPt(this._center);
    this._radius = fromVector.r();
    this._destinationAngle = toVector.theta();
    this._totalAngle = this._destinationAngle - fromVector.theta();
  });

  add.method('move', function (speed, curPos) {
    var vector = this._destination.subPt(curPos);
    if (vector.r() < 0.1) {return curPos;}

    var angleToMove = speed * this._totalAngle;
    var curAngle = curPos.subPt(this._center).theta();
    if (this._destinationAngle - curAngle < 0.001) {return curPos;}
    var newAngle = curAngle + angleToMove;
    var newPos = this._center.pointOnCircle(this._radius, newAngle);;
    //console.log("speed: " + speed + ", angleToMove: " + angleToMove + ", curAngle: " + curAngle + ", newAngle: " + newAngle + ", newPos: " + newPos + ", curPos: " + curPos);
    return newPos;
  });

});



});
