Morph.addMethods({
  // zooming around

  startZoomingOuttaHere: function() {
    this.startZoomingTo(pt(this.world().getExtent().x + 300, -300), false, function() {this.remove();}.bind(this));
  },

  startZoomingTo: function(loc, shouldWiggleAtEnd, functionToCallWhenDone) {
    this.startAnimating(animation.newMovement(this, loc, shouldWiggleAtEnd));
  },

  startAnimating: function(animator, functionToCallWhenDone) {
    this.stopAnimationProcess();

    functionToCallWhenDone = functionToCallWhenDone || function() {};
    animator.whenDoneCall(function() {this.stopAnimationProcess(); functionToCallWhenDone();}.bind(this))

    this._animationProcess = new PeriodicalExecuter(function(pe) {
      animator.doOneStep(pe);
    }, animator.timePerStep() / 1000);
  },

  stopAnimationProcess: function() {
    if (this._animationProcess) {
      this._animationProcess.stop();
      delete this._animationProcess;
    }
  },


  // wiggling

  wiggle: function() {
    this.startAnimating(animation.newWiggler(this));
  },


  // adding and removing to/from the world

  ensureIsInWorld: function(w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
    this.stopAnimationProcess();
    if (this.world() !== w) {
      w.addMorphAt(this, pt(-100,-100));
      if (desiredLoc) {
        this.startZoomingTo(desiredLoc, true);
      }
    } else {
      if (desiredLoc && shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startZoomingTo(desiredLoc, true);
      }
    }
  },

  ensureIsNotInWorld: function() {
    if (this.world()) {this.startZoomingOuttaHere();}
  },

  createDismissButton: function() {
    var b = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.orange);
    b.relayToModel(this, {Trigger: "=ensureIsNotInWorld"});
    return b;
  },


  // scaling

  smoothlyScaleBackToNormalSize: function() {
    if (Math.abs(1.0 - this.getScale()) > 0.01) {
      var scaler = new Scaler(this, this.getExtent(), 10, function() {this.setScale(1.0);}.bind(this));
      new PeriodicalExecuter(function(pe) {
        try {
          scaler.doOneStep(pe);
        } catch (e) {
          logError(e, "smoothlyScaleBackToNormalSize()");
        }
      }, 0.1);
    }
  }
});



Object.subclass("Scaler", {
  initialize: function(morph, targetSize, numberOfSteps, functionToCallWhenDone) {
    this.morph = morph;
    this.targetSize = targetSize;
    this.numberOfSteps = numberOfSteps;
    this.done = functionToCallWhenDone;
    this.scalingFactor = this.calculateScalingFactor();
    return this;
  },

  calculateScalingFactor: function() {
    var originalBounds = this.morph.bounds();
    var targetRatio = Math.min(this.targetSize.x / originalBounds.width, this.targetSize.y / originalBounds.height);
    var ratioForEachStep = Math.pow(targetRatio, 1.0 / this.numberOfSteps);
    return ratioForEachStep;
  },

  doOneStep: function(pe) {
    if (this.numberOfSteps <= 0) {
      pe.stop();
      this.done();
      return;
    }
    this.numberOfSteps -= 1;
    this.morph.scaleBy(this.scalingFactor);
  },
});

