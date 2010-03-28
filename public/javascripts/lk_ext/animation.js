lobby.transporter.module.create('animation', function(requires) {}, function(thisModule) {


thisModule.addSlots(modules.animation, function(add) {
    
    add.data('_directory', 'lk_ext');

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

  add.creator('instantaneous', Object.create(animation.abstract));

  add.creator('accelerator', {});

  add.creator('nothingDoer', {});

  add.creator('pathMover', {});

  add.creator('morphResizer', {});

  add.creator('morphScaler', {});

  add.creator('wiggler', {});

  add.creator('straightPath', {});

  add.creator('arcPath', {});

  add.method('newWiggler', function (morph, centerPt, duration) {
    var timePerStep = animation.timePerStep;
    centerPt = centerPt || morph.getPosition();

    var wigglerizer = Object.newChildOf(this.sequential, "wiggler", timePerStep);
    wigglerizer.timeSegments().push(Object.newChildOf(this.timeSegment,   "wiggling",   timePerStep, (duration || 200) / timePerStep, Object.newChildOf(this.wiggler, centerPt)));
    wigglerizer.timeSegments().push(Object.newChildOf(this.instantaneous, "reset loc",  function(morph) {morph.setPosition(centerPt);}));

    return Object.newChildOf(this.simultaneous, "wiggler", timePerStep, [wigglerizer]);
  });

  add.method('newMovement', function (morph, kindOfPath, destinationPt, speed, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd) {
    var currentPt = morph.getPosition();
    var vector = destinationPt.subPt(currentPt);
    var distance = vector.r();

    if (distance >= 0.1) {
      var wholeThing = Object.newChildOf(this.sequential, "whole movement", animation.timePerStep);

      var arcStartPt = currentPt;

      if (shouldAnticipateAtStart && morph.isOnScreen()) { // if it's off-screen, there's no point and it's annoying
        var a = this.anticipator(animation.timePerStep, currentPt, vector, 120, 120);
        wholeThing.timeSegments().push(a);
        arcStartPt = a.path.destination();
      }

      var topSpeed = speed * (shouldDecelerateAtEnd ? 3/4 : 1); // OK, it's not exactly a speed, but it's sorta similar; fix this, maybe.
      var mainMovingDuration = distance / topSpeed;
      var accelOrDecelDuration = mainMovingDuration * (shouldDecelerateAtEnd ? 5/12 : 8/9);
      var speederizer = this.speederizer(animation.timePerStep, accelOrDecelDuration, mainMovingDuration, shouldDecelerateAtEnd);

      var path = Object.newChildOf(kindOfPath, arcStartPt, destinationPt);
      var moverizer = this.moverizer(animation.timePerStep, path, speederizer);

      wholeThing.timeSegments().push(moverizer);

      if (shouldWiggleAtEnd) {
        wholeThing.timeSegments().push(this.newWiggler(morph, destinationPt));
      }

      return wholeThing;

    } else {
      return Object.newChildOf(this.instantaneous, "set final loc", function(morph) {morph.setPositionAndDoMotionBlurIfNecessary(destinationPt, animation.timePerStep);});
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

  add.method('moverizer', function (timePerStep, path, speederizer) {
    var m = Object.newChildOf(this.sequential, "mover steps", timePerStep);
    m.path = path;
    var pathMover = Object.newChildOf(this.pathMover, m.path, speederizer.speedHolder());
    m.timeSegments().push(Object.newChildOf(this.timeSegment,   "main arc",      timePerStep, speederizer.totalDuration() / timePerStep, pathMover));
    m.timeSegments().push(Object.newChildOf(this.instantaneous, "set final loc", function(morph) {morph.setPositionAndDoMotionBlurIfNecessary(path.destination(), animation.timePerStep);}));
    return Object.newChildOf(this.simultaneous, "moverizer", timePerStep, [speederizer, m]);
  });

  // aaa - duplication between the resizer and the scaler
  add.method('newResizer', function (morph, endingSize) {
    // Don't bother if the morph is off-screen - it just feels like nothing's happening.
    var w = morph.world();
    var isStartingOnScreen = w && w.bounds().containsPoint(morph.getPosition());
    if (! isStartingOnScreen) {
      return Object.newChildOf(this.instantaneous, "set final size", function(morph) {morph.setExtent(endingSize);});
    }

    var timePerStep = animation.timePerStep;
    var accelOrDecelDuration = 40;
    var mainResizingDuration = 100;
    var startingSize = morph.getExtent();

    var s = this.speederizer(timePerStep, accelOrDecelDuration, mainResizingDuration, true);
    var morphResizer = Object.newChildOf(this.morphResizer, startingSize, endingSize, s.speedHolder());
    var r = Object.newChildOf(this.sequential, "resizer steps", timePerStep);
    r.timeSegments().push(Object.newChildOf(this.timeSegment,   "resizing",       timePerStep, mainResizingDuration / timePerStep, morphResizer));
    r.timeSegments().push(Object.newChildOf(this.instantaneous, "set final size", function(morph) {morph.setExtent(endingSize);}));
    return Object.newChildOf(this.simultaneous, "resizer", timePerStep, [s, r]);
  });

  add.method('newScaler', function (morph, endingScale) {
    // Don't bother if the morph is off-screen - it just feels like nothing's happening.
    var w = morph.world();
    var isStartingOnScreen = w && w.bounds().containsPoint(morph.getPosition());
    if (! isStartingOnScreen) {
      return Object.newChildOf(this.instantaneous, "set final scale", function(morph) {morph.setExtent(endingScale);});
    }

    var timePerStep = animation.timePerStep;
    var accelOrDecelDuration = 40;
    var mainScalingDuration = 200;
    var startingScale = morph.getScale();

    var s = this.speederizer(timePerStep, accelOrDecelDuration, mainScalingDuration, true);
    var morphScaler = Object.newChildOf(this.morphScaler, startingScale, endingScale, s.speedHolder());
    var r = Object.newChildOf(this.sequential, "scaler steps", timePerStep);
    r.timeSegments().push(Object.newChildOf(this.timeSegment,   "scaling",         timePerStep, mainScalingDuration / timePerStep, morphScaler));
    r.timeSegments().push(Object.newChildOf(this.instantaneous, "set final scale", function(morph) {morph.setScale(endingScale);}));
    return Object.newChildOf(this.simultaneous, "scaler", timePerStep, [s, r]);
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

  add.method('totalDuration', function () {
    return this._simultaneousProcesses.max(function(each) { return each.totalDuration(); });
  });

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

  add.method('totalDuration', function () {
    return this._timeSegments.inject(0, function(sum, each) { return sum + each.totalDuration(); });
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

  add.method('totalDuration', function () {
    // aaa - might be better to just store the total duration? I want to make the frame rate auto-adjust anyway.
    return this._stepsLeft * this._timePerStep;
  });

  add.method('doOneStep', function (morph) {
    if (this._stepsLeft <= 0) { this.done(); return false; }
    this._movement.doOneStep(morph);
    --this._stepsLeft;
    return true;
  });

});


thisModule.addSlots(animation.instantaneous, function(add) {

  add.method('initialize', function ($super, name, functionToRun) {
    $super(name);
    this._functionToRun = functionToRun;
  });

  add.method('totalDuration', function () {
    return 0;
  });

  add.method('doOneStep', function (morph) {
    // console.log("About to run instantaneous action " + this._name);
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


thisModule.addSlots(animation.morphScaler, function(add) {

  add.method('initialize', function (from, to, speedHolder) {
    this._endingScale = to;
    this._totalScaleDifference = to - from;
    this._speedHolder = speedHolder;
  });

  add.method('doOneStep', function (morph) {
    var speed = this._speedHolder.speed;
    var currentScale = morph.getScale();
    var difference = this._endingScale - currentScale;
    if (difference === 0) {return;}
    var amountToChange = this._totalScaleDifference * speed;
    var newScale = currentScale + amountToChange;
    var newDifference = this._endingScale - newScale;
    if (newDifference.sign() !== difference.sign()) {newScale = this._endingScale;} // don't go past it
    morph.setScale(newScale);
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
    var vectorToMove = vector.normalized().scaleBy(distanceToMove);
    // console.log("speed: " + speed + ", distanceToMove: " + distanceToMove + ", vectorToMove: " + vectorToMove + ", curPos: " + curPos);
    return curPos.addPt(vectorToMove);
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

  add.method('destination', function () { return this._destination; });

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


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('isOnScreen', function () {
    var w = this.world();
    return w && w.bounds().containsPoint(this.getPosition());
  }, {category: 'testing'});

  add.method('startZoomingOuttaHere', function() {
    var w = this.world();
    if (w) {
      return this.startZoomingTo(pt(w.getExtent().x + 300, -300), true, false, function() {this.remove();}.bind(this));
    } else {
      return null;
    }
  }, {category: 'zooming around'});

  add.method('startZoomingTo', function(loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    return this.startAnimating(animation.newMovement(this, animation.arcPath, loc, 3, shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
  }, {category: 'zooming around'});

  add.method('startZoomingInAStraightLineTo', function(loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
    return this.startAnimating(animation.newMovement(this, animation.straightPath, loc, 2, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
  }, {category: 'zooming around'});

  add.method('startAnimating', function(animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(this);
    return animator;
  }, {category: 'zooming around'});

  add.method('wiggle', function(duration) {
    return this.startAnimating(animation.newWiggler(this, null, duration));
  }, {category: 'wiggling'});

  add.method('setPositionAndDoMotionBlurIfNecessary', function(newPos, blurTime) {
    var world = this.world();
    if (world) {
      var extent = this.getExtent();
      var oldPos = this.getPosition();
      var difference = newPos.subPt(oldPos);
      var ratio = Math.max(Math.abs(difference.x) / extent.x, Math.abs(difference.y) / extent.y);
      if (ratio > 0.5) {
        var bounds = this.bounds();
        var allVertices = bounds.vertices().concat(bounds.translatedBy(difference).vertices());
        var convexVertices = quickhull.getConvexHull(allVertices).map(function(a) {return a.pointA;});
        var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
        // could try adjusting the opacity based on the distance, but I tried that and
        // couldn't figure out how to make it look non-weird
        motionBlurMorph.setFillOpacity(0.3); 
        world.addMorphBack(motionBlurMorph);
        setTimeout(function() {motionBlurMorph.remove();}, blurTime);
      }
    }
    this.setPosition(newPos);
    if (this.justDidAnimatedPositionChange) { this.justDidAnimatedPositionChange(); }
  }, {category: 'motion blur'});


  // adding and removing to/from the world

  add.method('ensureIsInWorld', function(w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    var owner = this.owner;
    if (owner !== w) {
      var initialLoc = (!owner || this.world() !== w) ? pt(-50,-20) : owner.worldPoint(this.getPosition());
      w.addMorphAt(this, initialLoc);
      this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
    } else {
      if (shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
      } else {
        functionToCallWhenDone();
      }
    }
  }, {category: 'adding and removing'});

  add.method('ensureIsNotInWorld', function() {
    if (this.world()) {this.startZoomingOuttaHere();}
  }, {category: 'adding and removing'});

  add.method('createDismissButton', function() {
    var b = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.orange);
    b.relayToModel(this, {Trigger: "=ensureIsNotInWorld"});
    return b;
  }, {category: 'adding and removing'});

  add.method('smoothlyResizeTo', function(desiredSize, functionToCallWhenDone) {
    this.startAnimating(animation.newResizer(this, desiredSize), functionToCallWhenDone);
  }, {category: 'resizing'});

  add.method('smoothlyScaleTo', function(desiredScale, startingScale, functionToCallWhenDone) {
    if (startingScale !== undefined) { this.setScale(startingScale); }
    this.startAnimating(animation.newScaler(this, desiredScale), functionToCallWhenDone);
  }, {category: 'scaling'});

});

thisModule.addSlots(WindowMorph.prototype, function(add) {

  add.method('initiateShutdown', function() {
    if (this.isShutdown()) { return; }
    this.targetMorph.shutdown(); // shutdown may be prevented ...
    this.ensureIsNotInWorld(); // used to say this.remove(), changed by Adam so that it does the cool zooming-off-the-screen thing
    this.state = 'shutdown'; // no one will ever know...
    return true;
  }, {category: 'closing'});

});

thisModule.addSlots(SelectionMorph.prototype, function(add) {

  add.method('startZoomingOuttaHere', function($super) {
    this.selectedMorphs.invoke('startZoomingOuttaHere');
    $super();
  }, {category: 'zooming around'});

});


});
