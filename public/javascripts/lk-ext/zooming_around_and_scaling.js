Morph.addMethods({
  // zooming around

  startZoomingOuttaHere: function() {
    var w = this.world();
    if (w) {
      this.startZoomingTo(pt(w.getExtent().x + 300, -300), true, false, function() {this.remove();}.bind(this));
    }
  },

  startZoomingTo: function(loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    this.startAnimating(animation.newMovement(this, animation.arcPath, loc, 3, shouldAnticipateAtStart, shouldWiggleAtEnd, !shouldWiggleAtEnd), functionToCallWhenDone);
  },

  startZoomingInAStraightLineTo: function(loc, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd, functionToCallWhenDone) {
    this.startAnimating(animation.newMovement(this, animation.straightPath, loc, 3, shouldAnticipateAtStart, shouldWiggleAtEnd, shouldDecelerateAtEnd), functionToCallWhenDone);
  },

  startAnimating: function(animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    animator.startAnimating(this);
  },


  // wiggling

  wiggle: function(duration) {
    this.startAnimating(animation.newWiggler(this, null, duration));
  },


  // motion blur

  setPositionAndDoMotionBlurIfNecessary: function(newPos, blurTime) {
    var world = this.world();
    if (world) {
      var extent = this.getExtent();
      var oldPos = this.getPosition();
      var difference = newPos.subPt(oldPos);
      var ratio = Math.max(Math.abs(difference.x) / extent.x, Math.abs(difference.y) / extent.y);
      if (ratio > 0.5) {
        var bounds = this.bounds();
        var allVertices = bounds.vertices().concat(bounds.translatedBy(difference).vertices());
        var convexVertices = getConvexHull(allVertices).map(function(a) {return a[0];});
        var motionBlurMorph = Morph.makePolygon(convexVertices, 0, Color.black, this.getFill());
        // could try adjusting the opacity based on the distance, but I tried that and
        // couldn't figure out how to make it look non-weird
        motionBlurMorph.setFillOpacity(0.3); 
        world.addMorphBack(motionBlurMorph);
        setTimeout(function() {motionBlurMorph.remove();}, blurTime);
      }
    }
    this.setPosition(newPos);
  },


  // adding and removing to/from the world

  ensureIsInWorld: function(w, desiredLoc, shouldMoveToDesiredLocEvenIfAlreadyInWorld, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    var owner = this.owner;
    if (owner !== w) {
      var initialLoc = (!owner || this.world() !== w) ? pt(-50,-20) : owner.worldPoint(this.getPosition());
      w.addMorphAt(this, initialLoc);
      if (desiredLoc) {
        this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
      }
    } else {
      if (desiredLoc && shouldMoveToDesiredLocEvenIfAlreadyInWorld) {
        this.startZoomingTo(desiredLoc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone);
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


  // resizing

  smoothlyResizeTo: function(desiredSize, functionToCallWhenDone) {
    this.startAnimating(animation.newResizer(this, desiredSize), functionToCallWhenDone);
  }
});

WindowMorph.addMethods({
    initiateShutdown: function() {
        if (this.isShutdown()) { return; }
        this.targetMorph.shutdown(); // shutdown may be prevented ...
        this.ensureIsNotInWorld(); // used to say this.remove(), changed by Adam so that it does the cool zooming-off-the-screen thing
        this.state = 'shutdown'; // no one will ever know...
        return true;
    }
});

SelectionMorph.addMethods({
    startZoomingOuttaHere: function($super) {
        this.selectedMorphs.invoke('startZoomingOuttaHere');
        $super();
    },
});
