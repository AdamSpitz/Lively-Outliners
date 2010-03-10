Object.subclass("Zoomer", {
  initialize: function(morph, destinationPt, functionToCallWhenDone) {
    this.morph = morph;
    this.destinationPt = destinationPt;
    this.done = functionToCallWhenDone;
    this.originalPosition = morph.position();
    this.distancePerStep = 75.0;
    return this;
  },

  totalRemainingVector:   function() {return this.destinationPt.subPt(this.morph.position());},

  estimatedNumberOfSteps: function() {return Math.ceil(this.totalRemainingVector().r() / this.distancePerStep);},

  doOneStep: function(pe) {
    var totalRemainingVector = this.totalRemainingVector();
    var totalRemainingDistance = totalRemainingVector.r();
    if (totalRemainingDistance < 10) {
      pe.stop();
      this.done();
      return;
    }
    var stepVector = totalRemainingVector.scaleToLength(Math.min(totalRemainingDistance, this.distancePerStep));
    this.morph.translateBy(stepVector);
  },
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

Morph.addMethods({
  // zooming around

  startZoomingOuttaHere: function() {
    this.startZoomingTo(pt(this.world().getExtent().x + 300, -300), function() {this.remove();}.bind(this));
  },

  startZoomingTo: function(loc, functionToCallWhenDone) {
    this.stopZoomingAround();
    functionToCallWhenDone = functionToCallWhenDone || function() {};
    var zoomer = new Zoomer(this, loc, function() {this.stopZoomingAround(); functionToCallWhenDone();}.bind(this));
    this._zoomerProcess = new PeriodicalExecuter(function(pe) {
      zoomer.doOneStep(pe);
    }, 0.04);
  },

  stopZoomingAround: function() {
    if (this._zoomerProcess) {
      this._zoomerProcess.stop();
      delete this._zoomerProcess;
    }
  },


  // adding and removing to/from the world

  ensureIsInWorld: function(w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
    this.stopZoomingAround();
    if (this.world() !== w) {
      w.addMorphAt(this, pt(-100,-100));
      if (desiredLoc) {
        this.startZoomingTo(desiredLoc);
      }
    } else {
      if (desiredLoc && shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startZoomingTo(desiredLoc);
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
