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
  // zooming around and scaling

  startZoomingOuttaHere: function() {
    if (!this.zoomerProcess) {
      var zoomer = new Zoomer(this, pt(WorldMorph.current().getExtent().x + 300, -300), this.doneZoomingOuttaHere.bind(this));
      // This scaling thing isn't working nicely:   var scaler = new Scaler(this, destinationMorph.getExtent(), zoomer.estimatedNumberOfSteps(), function() {});
      this.zoomerProcess = new PeriodicalExecuter(function(pe) {
        zoomer.doOneStep(pe);
        // scaler.doOneStep(pe);
      }, 0.1);
    }
  },

  stopZoomingOuttaHere: function() {
    if (this.zoomerProcess != null) {
      this.zoomerProcess.stop();
      this.zoomerProcess = null;
    }
  },

  doneZoomingOuttaHere: function() {
    this.stopZoomingOuttaHere();
    this.remove();
  },

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
