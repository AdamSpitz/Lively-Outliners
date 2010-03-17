lobby.transporter.module.create('animation', function(thisModule) {


thisModule.addSlots(modules.animation, function(add) {
    
    add.data('_directory', 'lk-ext');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('animation', {}, {category: ['animation']}, {comment: 'Taking a crack at some of those cartoon animation techniques that Self\'s UI1 uses.\nhttp://selflanguage.org/documentation/published/animation.html'});

});


thisModule.addSlots(animation, function(add) {

  add.data('timePerStep', 40);

  add.creator('abstract', {});

  add.creator('simultaneous', Object.create(animation.abstract));

  add.creator('sequential', Object.create(animation.abstract));

  add.creator('timeSegment', Object.create(animation.abstract));

  add.creator('resetter', Object.create(animation.abstract));

  add.creator('accelerator', {});

  add.creator('nothingDoer', {});

  add.creator('pathMover', {});

  add.creator('morphResizer', {});

  add.creator('wiggler', {});

  add.creator('straightPath', {});

  add.creator('arcPath', {});

  add.method('newWiggler', function (morph, centerPt) {
    var timePerStep = animation.timePerStep;
    var wigglingDuration = 200;
    centerPt = centerPt || morph.getPosition();

    var wigglerizer = Object.newChildOf(this.sequential, "wiggler", timePerStep);
    wigglerizer.timeSegments().push(Object.newChildOf(this.timeSegment, "wiggling",   timePerStep, wigglingDuration / timePerStep, Object.newChildOf(this.wiggler, centerPt)));
    wigglerizer.timeSegments().push(Object.newChildOf(this.resetter,    "reset loc",  function(morph) {morph.setPosition(centerPt);}));

    return Object.newChildOf(this.simultaneous, "wiggler", timePerStep, [wigglerizer]);
  });

  add.method('newMovement', function (morph, destinationPt, shouldAnticipateAtStart, shouldWiggleAtEnd) {
    var shouldDecelerateAtEnd   = ! shouldWiggleAtEnd;

    // Don't bother anticipating if the morph is off-screen - it just feels like nothing's happening.
    if (shouldAnticipateAtStart) {
      var w = morph.world();
      var isStartingOnScreen = w && w.bounds().containsPoint(morph.getPosition());
      shouldAnticipateAtStart = isStartingOnScreen;
    }

    var currentPt = morph.getPosition();
    var vector = destinationPt.subPt(currentPt);
    var distance = vector.r();
    if (distance >= 0.1) {

      var timePerStep = animation.timePerStep;
      
      var  anticipationDuration = 120;
      var       waitingDuration = 120;
      var    mainMovingDuration = (distance / 3) * (shouldDecelerateAtEnd ? 4/3 : 1);
      var  accelOrDecelDuration = shouldDecelerateAtEnd ? mainMovingDuration * 5/12 : mainMovingDuration * 5/9;
    
      var wholeThing = Object.newChildOf(this.sequential, "whole movement", timePerStep);

      var arcStartPt = currentPt;

      if (shouldAnticipateAtStart) {
        var a = this.anticipator(timePerStep, currentPt, vector, anticipationDuration, waitingDuration);
        wholeThing.timeSegments().push(a);
        arcStartPt = a.path.destination();
      }

      wholeThing.timeSegments().push(this.moverizer(timePerStep, arcStartPt, destinationPt, accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd));

      if (shouldWiggleAtEnd) {
        wholeThing.timeSegments().push(this.newWiggler(morph, destinationPt));
      }

      return wholeThing;

    } else {
      return Object.newChildOf(this.resetter, "set final loc", function(morph) {morph.setPositionAndDoMotionBlurIfNecessary(destinationPt, animation.timePerStep);});
    }

  });

  add.method('anticipator', function (timePerStep, currentPt, actualTravelVector, anticipationDuration, waitingDuration) {
    var a = Object.newChildOf(this.sequential, "anticipator", timePerStep);
    a.path = Object.newChildOf(this.straightPath, currentPt, currentPt.addPt(actualTravelVector.scaleBy(-0.05)));
    var speedHolder = {speed: timePerStep / anticipationDuration};
    var pathMover = Object.newChildOf(this.pathMover, a.path, speedHolder);

    a.timeSegments().push(Object.newChildOf(this.timeSegment, "anticipating",    timePerStep, anticipationDuration / timePerStep, pathMover));
    a.timeSegments().push(Object.newChildOf(this.timeSegment, "waiting to move", timePerStep,      waitingDuration / timePerStep, Object.newChildOf(this.nothingDoer)));
    return a;
  });

  add.method('speederizer', function (timePerStep, accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd) {
    // accelerating or decelerating is like travelling at half speed; use that as a shortcut in the math
    var halfSpeedDuration = shouldDecelerateAtEnd ? accelOrDecelDuration + accelOrDecelDuration : accelOrDecelDuration;
    var fullSpeedDuration = mainMovingDuration - halfSpeedDuration;
    var imaginaryTotalDurationIfWeWereGoingFullSpeedTheWholeTime = fullSpeedDuration + (0.5 * halfSpeedDuration);
    var    fullSpeed = timePerStep / imaginaryTotalDurationIfWeWereGoingFullSpeedTheWholeTime;
    var acceleration = timePerStep * fullSpeed / accelOrDecelDuration;

    var speedHolder = {speed: 0};

    var s = Object.newChildOf(this.sequential, "speederizer", timePerStep);
    s.speedHolder = function() {return speedHolder;};
    s.timeSegments().push(Object.newChildOf(this.timeSegment, "accelerating",    timePerStep, accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator,  acceleration, speedHolder)));
    s.timeSegments().push(Object.newChildOf(this.timeSegment, "cruising along",  timePerStep,    fullSpeedDuration / timePerStep, Object.newChildOf(this.nothingDoer)));
    if (shouldDecelerateAtEnd) {
      s.timeSegments().push(Object.newChildOf(this.timeSegment, "decelerating",    timePerStep, accelOrDecelDuration / timePerStep, Object.newChildOf(this.accelerator, -acceleration, speedHolder)));
    }
    return s;
  });

  add.method('moverizer', function (timePerStep, startPt, endPt, accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd) {
    var s = this.speederizer(timePerStep, accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd);
    var m = Object.newChildOf(this.sequential, "mover steps", timePerStep);
    m.path = Object.newChildOf(this.arcPath, startPt, endPt);
    var pathMover = Object.newChildOf(this.pathMover, m.path, s.speedHolder());
    m.timeSegments().push(Object.newChildOf(this.timeSegment, "main arc",      timePerStep, mainMovingDuration / timePerStep, pathMover));
    m.timeSegments().push(Object.newChildOf(this.resetter,    "set final loc", function(morph) {morph.setPositionAndDoMotionBlurIfNecessary(endPt, animation.timePerStep);}));
    return Object.newChildOf(this.simultaneous, "moverizer", timePerStep, [s, m]);
  });

  add.method('newResizer', function (morph, endingSize) {
    // Don't bother if the morph is off-screen - it just feels like nothing's happening.
    var w = morph.world();
    var isStartingOnScreen = w && w.bounds().containsPoint(morph.getPosition());
    if (! isStartingOnScreen) {
      return Object.newChildOf(this.resetter, "set final size", function(morph) {morph.setExtent(endingSize);});
    }

    var timePerStep = animation.timePerStep;
    var accelOrDecelDuration = 40;
    var mainResizingDuration = 100;
    var startingSize = morph.getExtent();

    var s = this.speederizer(timePerStep, accelOrDecelDuration, mainResizingDuration, true);
    var morphResizer = Object.newChildOf(this.morphResizer, startingSize, endingSize, s.speedHolder());
    var r = Object.newChildOf(this.sequential, "resizer steps", timePerStep);
    r.timeSegments().push(Object.newChildOf(this.timeSegment, "resizing",       timePerStep, mainResizingDuration / timePerStep, morphResizer));
    r.timeSegments().push(Object.newChildOf(this.resetter,    "set final size", function(morph) {morph.setExtent(endingSize);}));
    return Object.newChildOf(this.simultaneous, "resizer", timePerStep, [s, r]);
  });

});


thisModule.addSlots(animation.abstract, function(add) {

  add.method('initialize', function (name, timePerStep) {
    this._name = name;
    this._timePerStep = timePerStep;
  });

  add.method('timePerStep', function () { return this._timePerStep; });

  add.method('whenDoneCall', function (f) { this._functionToCallWhenDone = f; return this; });

  add.method('done', function () {
    this.stopAnimating();
    var f = this._functionToCallWhenDone;
    if (f) { f(); }
  });

  add.method('startAnimating', function (morph) {
    this._animationProcess = new PeriodicalExecuter(function(pe) {
      this.doOneStep(morph);
    }.bind(this), this.timePerStep() / 1000);
  });

  add.method('stopAnimating', function() {
    if (this._animationProcess) {
      this._animationProcess.stop();
      delete this._animationProcess;
    }
  });
});

thisModule.addSlots(animation.simultaneous, function(add) {

  add.method('initialize', function ($super, name, timePerStep, simultaneousProcesses) {
    $super(name, timePerStep);
    this._simultaneousProcesses = simultaneousProcesses || [];
  });

  add.method('simultaneousProcesses', function () { return this._simultaneousProcesses; });

  add.method('doOneStep', function (morph) {
    var anyAreNotDoneYet = false;
    for (var i = 0, n = this._simultaneousProcesses.length; i < n; ++i) {
      if (this._simultaneousProcesses[i].doOneStep(morph)) {
        anyAreNotDoneYet = true;
      }
    }
    if (! anyAreNotDoneYet) { this.done(); }
    return anyAreNotDoneYet;
  });

});


thisModule.addSlots(animation.sequential, function(add) {

  add.method('initialize', function ($super, name, timePerStep, timeSegments) {
    $super(name, timePerStep);
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
      if (!s) { this.done(); return false; }
      var isNotDoneYet = s.doOneStep(morph);
      if (isNotDoneYet) { return true; } else { this._currentSegmentIndex += 1; }
    }
  });

});


thisModule.addSlots(animation.timeSegment, function(add) {

  add.method('initialize', function ($super, name, timePerStep, stepsLeft, movement) {
    $super(name, timePerStep);
    this._stepsLeft = stepsLeft;
    this._movement = movement;
  });

  add.method('doOneStep', function (morph) {
    if (this._stepsLeft <= 0) { this.done(); return false; }
    this._movement.doOneStep(morph);
    --this._stepsLeft;
    return true;
  });

});


thisModule.addSlots(animation.resetter, function(add) {

  add.method('initialize', function ($super, name, functionToRun) {
    $super(name);
    this._functionToRun = functionToRun;
  });

  add.method('doOneStep', function (morph) {
    this._functionToRun(morph);
    this.done();
    return false;
  });

});


thisModule.addSlots(animation.nothingDoer, function(add) {

  add.method('doOneStep', function (morph) {
  });

});


thisModule.addSlots(animation.accelerator, function(add) {

  add.method('initialize', function (acceleration, speedHolder) {
    this._acceleration = acceleration;
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph) {
    this._speedHolder.speed += this._acceleration;
  });

});


thisModule.addSlots(animation.pathMover, function(add) {

  add.method('initialize', function (path, speedHolder) {
    this._path = path;
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph) {
    morph.setPositionAndDoMotionBlurIfNecessary(this._path.move(this._speedHolder.speed, morph.getPosition()), animation.timePerStep);
  });

});


thisModule.addSlots(animation.morphResizer, function(add) {

  add.method('initialize', function (from, to, speedHolder) {
    this._endingSize = to;
    this._totalSizeDifference = to.subPt(from);
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph) {
    var speed = this._speedHolder.speed;
    var currentSize = morph.getExtent();
    var difference = this._endingSize.subPt(currentSize);
    if (difference.x === 0 && difference.y === 0) {return;}
    var amountToChange = this._totalSizeDifference.scaleBy(speed);
    var newSize = currentSize.addPt(amountToChange);
    var newDifference = this._endingSize.subPt(newSize);
    if (newDifference.x.sign() !== difference.x.sign()) {newSize = newSize.withX(this._endingSize.x);} // don't go past it
    if (newDifference.y.sign() !== difference.y.sign()) {newSize = newSize.withY(this._endingSize.y);} // don't go past it
    morph.setExtent(newSize);
  });

});


thisModule.addSlots(animation.wiggler, function(add) {

  add.method('initialize', function (loc) {
    this._center = loc;
    var wiggleSize = 3;
    this._extreme1 = loc.addXY(-wiggleSize, 0);
    this._extreme2 = loc.addXY( wiggleSize, 0);
    this._isMovingTowardExtreme1 = false;
    this._distanceToMovePerStep = wiggleSize * 1.5;
  });

  add.method('doOneStep', function (morph) {
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

  add.method('destination', function () { return this._destination; });

  add.method('move', function (speed, curPos) {
    var vector = this._destination.subPt(curPos);
    var difference = vector.r();
    if (difference < 0.1) {return curPos;}

    var distanceToMove = Math.min(difference, speed * this._totalDistance);
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
    var angleDifference = this._destinationAngle - curAngle;
    if (angleDifference < 0.001) {return curPos;}
    var newAngle = curAngle + angleToMove;
    var newAngleDifference = this._destinationAngle - newAngle;
    if (newAngleDifference.sign() !== angleDifference.sign()) {newAngle = this._destinationAngle;} // don't go past it
    var newPos = this._center.pointOnCircle(this._radius, newAngle);
    //console.log("speed: " + speed + ", angleToMove: " + angleToMove + ", curAngle: " + curAngle + ", newAngle: " + newAngle + ", newPos: " + newPos + ", curPos: " + curPos);
    return newPos;
  });

});



});
