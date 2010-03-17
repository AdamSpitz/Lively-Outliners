Morph.addMethods({
  // zooming around

  startZoomingOuttaHere: function() {
    var w = this.world();
    if (w) {
      this.startZoomingTo(pt(w.getExtent().x + 300, -300), true, false, function() {this.remove();}.bind(this));
    }
  },

  startZoomingTo: function(loc, shouldAnticipateAtStart, shouldWiggleAtEnd, functionToCallWhenDone) {
    this.startAnimating(animation.newMovement(this, loc, shouldAnticipateAtStart, shouldWiggleAtEnd), functionToCallWhenDone);
  },

  startAnimating: function(animator, functionToCallWhenDone) {
    animator.stopAnimating();
    animator.whenDoneCall(functionToCallWhenDone);
    this._animationProcess = animator.startAnimating(this);
  },


  // wiggling

  wiggle: function() {
    this.startAnimating(animation.newWiggler(this));
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
