Morph.subclass("ArrowMorph", {
  initialize: function($super, assoc, ep1, ep2) {
    $super(new lively.scene.Polyline([pt(0,0), pt(0,0)]));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.setFill(null);
    this.notificationFunction = function() {setTimeout(this.putVerticesInTheRightPlace.bind(this), 0);}.bind(this);
    this.endpoint1 = ep1 || new ArrowEndpoint(assoc, this);
    this.endpoint2 = ep2 || new ArrowEndpoint(assoc, this);
    this.endpoint1.otherEndpoint = this.endpoint2;
    this.endpoint2.otherEndpoint = this.endpoint1;
    this.closeDnD();
    this.ignoreEvents();
    this.beUngrabbable();
    this.needsToBeVisible();
  },

  shouldGrowSmoothly: true,

  stopUpdating: function() {
    if (this._updateProcess) {
      this._updateProcess.stop();
      delete this._updateProcess;
    }
  },

  changeUpdateFrequency: function(newFrequency) {
    if (this._updateProcess && this._updateProcess.frequency === newFrequency) { return; }
    // Optimization suggested by Dan Ingalls: slow down ticking when things are pretty quiet.
    this.stopUpdating();
    this._updateProcess = new PeriodicalExecuter(function(pe) {
      this.putVerticesInTheRightPlace();
    }.bind(this), newFrequency);
  },

  tickQuickly: function() { this.changeUpdateFrequency(0.05); },
  tickSlowly:  function() { this.changeUpdateFrequency(0.5); },

  noLongerNeedsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = true;
    this.disappear(function() {
      this.stopUpdating();
    }.bind(this));
  },

  needsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = false;
    this.tickQuickly();
  },

  putVerticesInTheRightPlace: function() {
    if (this.shouldBeShown()) {
      this.endpoint1.attachToTheRightPlace();
      this.endpoint2.attachToTheRightPlace();
      if (! this.owner) {
        WorldMorph.current().addMorph(this);
      }
      this.changeVerticesIfNecessary();
    } else {
      this.disappear();
    }
  },

  disappear: function(callWhenDone) {
    waitForAllCallbacks(function(finalCallback) {
      this.endpoint1.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback());
      this.endpoint2.noLongerNeedsToBeVisibleAsArrowEndpoint(finalCallback());
    }.bind(this), function() {
      if (this.owner) {
        this.remove();
        this.tickSlowly();
      }
      if (callWhenDone) { callWhenDone(); }
    }.bind(this), "making the arrow disappear");
  },

  shouldBeShown: function() {
    if (this.noLongerNeedsToBeUpdated) { return false; }
    var m1 = this.endpoint1.determineWhichMorphToAttachTo();
    var m2 = this.endpoint2.determineWhichMorphToAttachTo();
    var w  = WorldMorph.current();
    return m1 && m2 && (m1 !== w || m2 !== w);
  },

  changeVerticesIfNecessary: function() {
    var oldVertices = this.shape.vertices();
    // Rounding seems to be necessary to make sure the floats are precisely equal.
    var newVertices = [this.endpoint1.lineEndpoint().roundTo(1), this.endpoint2.lineEndpoint().roundTo(1)];
    if (oldVertices[0].roundTo(1).eqPt(newVertices[0]) && oldVertices[1].roundTo(1).eqPt(newVertices[1])) {
      this.tickSlowly();
    } else {
      this.changeVertices(newVertices);
      this.tickQuickly();
    }
  },

  changeVertices: function(newVertices) {
    this.setVertices(newVertices);

    if (! newVertices[0].eqPt(newVertices[1])) {
      var arrowDirection = newVertices[1].subPt(newVertices[0]);
      if (arrowDirection.rSquared() >= 225) {
        //console.log("endpoint1: " + newVertices[0] + ", endpoint2: " + newVertices[1] + ", arrowDirection: " + arrowDirection + ", arrowDirection.theta(): " + arrowDirection.theta());
        this.endpoint1.setShapeToLookLikeACircle(arrowDirection          .theta());
        this.endpoint2.setShapeToLookLikeAnArrow(arrowDirection.negated().theta());
      } else {
        // Workaround: the endpoint keeps being in weird places when it's very near the source,
        // and so the arrow head kept pointing in weird directions. Until I figure out the cause,
        // let's just not show the arrow head until it gets a bit further away.
        this.endpoint2.setShapeToLookLikeNothing();
      }
    }
  },

  grabEndpoint:  function(evt, endpoint) {endpoint.grabMe(evt);},
  grabEndpoint1: function(evt) {this.grabEndpoint(evt, this.endpoint1);},
  grabEndpoint2: function(evt) {this.grabEndpoint(evt, this.endpoint2);},

  shouldIgnorePoses: function(uiState) { return true; }
});

Morph.subclass("ArrowEndpoint", {
  initialize: function($super, tr, a) {
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    this.relativeLineEndpoint = pt(5, 5);
    this.isArrowEndpoint = true;
    this.shouldNotBePartOfRowOrColumn = true;
    this.topicRef = tr;
    this.arrow = a;
    this.setFill(Color.black);
  },

  suppressHandles: true,
  okToDuplicate: Functions.False,
  relativeLineEndpoint: pt(0,0),

  determineWhichMorphToAttachTo: function() {
    var m = this.owner instanceof HandMorph ? this.owner : this.whichMorphToAttachTo();
    this.morphToAttachTo = m;
    return m;
  },

  // aaa
  whichMorphToAttachTo: function() {
    var slotContents = this.topicRef.contents();
    var outliner = WorldMorph.current().existingMorphFor(slotContents);
    return outliner ? (outliner.world() ? outliner : null) : null;
  },

  stopCurrentAnimationIfAny: function() {
    if (this._animator) { this._animator.stopAnimating(); }
  },

  isZoomingTo: function() {
    return this._animator ? this._animator.isZoomingTo : undefined;
  },

  attachToTheRightPlace: function() {
    var morphToAttachTo = this.morphToAttachTo;
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === morphToAttachTo) {return;}
    this.stopCurrentAnimationIfAny();
    var oldOwner = this.owner;
    if (! (morphToAttachTo instanceof HandMorph)) {
      if (morphToAttachTo === oldOwner && this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner) {return;}
      
      if (morphToAttachTo !== WorldMorph.current()) {
        var otherEndpointLoc = this.otherEndpoint.worldPoint(this.otherEndpoint.relativeLineEndpoint);
        var localCenterOfMorphToAttachTo = morphToAttachTo.relativeCenterpoint();
        var globalCenterOfMorphToAttachTo = morphToAttachTo.worldPoint(localCenterOfMorphToAttachTo);
        var vectorFromCenterToOtherEndpoint = otherEndpointLoc.subPt(globalCenterOfMorphToAttachTo);
        var localPositionOfOtherEndpoint = localCenterOfMorphToAttachTo.addPt(vectorFromCenterToOtherEndpoint);
        var localNewLoc = this.localPositionClosestTo(localPositionOfOtherEndpoint, localCenterOfMorphToAttachTo).roundTo(1);
        var globalNewLoc = morphToAttachTo.worldPoint(localNewLoc);
        
        if (this.arrow.shouldGrowSmoothly) {
          var world = this.world();
          var globalCurLoc;
          if (world) {
            globalCurLoc = this.owner.worldPoint(this.getPosition());
          } else {
            globalCurLoc = otherEndpointLoc;
            world = this.otherEndpoint.world();
          }
          world.addMorphAt(this, globalCurLoc);
          this.stopCurrentAnimationIfAny();
          // aaa console.log("Now zooming from " + globalCurLoc + " to " + globalNewLoc + "; morphToAttachTo is " + Object.inspect(morphToAttachTo) + "; noLongerNeedsToBeUpdated is " + this.arrow.noLongerNeedsToBeUpdated);
          this._animator = this.startZoomingInAStraightLineTo(globalNewLoc, false, false, false, function() {
            var wasAlreadyAttachedToThisMorph = morphToAttachTo === this.owner;
            morphToAttachTo.addMorphAt(this, localNewLoc);
            if (!wasAlreadyAttachedToThisMorph) { morphToAttachTo.wiggle(100); }
            delete this._animator;
          }.bind(this));
          this._animator.isZoomingTo = morphToAttachTo;
        } else {
          morphToAttachTo.addMorphAt(this, localNewLoc);
        }
        
        this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = true;
      } else {
        if (! this.vectorFromOtherEndpoint) {this.vectorFromOtherEndpoint = this.calculateDefaultVectorFromOtherEndpoint();}
        var newLoc = this.otherEndpoint.world() ? this.otherEndpoint.worldPoint(pt(0,0)).addPt(this.vectorFromOtherEndpoint) : pt(0,0);
        morphToAttachTo.addMorphAt(this, newLoc);
      }
    }

    this.registerForChangeNotification(oldOwner, morphToAttachTo);
  },

  registerForChangeNotification: function(oldOwner, newOwner) {
    // Not really necessary because we have the update process, but it makes the UI look smoother
    // if we register to be notified whenever the owner changes position.
    if (newOwner !== oldOwner) {
      this.unregisterFromChangeNotification(oldOwner);
      newOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().add_observer(this.arrow.notificationFunction);
    }
  },

  unregisterFromChangeNotification: function(oldOwner) {
    if (oldOwner) { oldOwner.topmostOwnerBesidesTheWorldAndTheHand().changeNotifier().remove_observer(this.arrow.notificationFunction); }
  },

  noLongerNeedsToBeVisibleAsArrowEndpoint: function(callWhenDone) {
    var isZoomingTo = this.isZoomingTo();
    if (isZoomingTo === null) {return;}
    this.unregisterFromChangeNotification(this.owner);
    this.stopCurrentAnimationIfAny();
    var world = this.world();
    if (this.arrow.shouldGrowSmoothly && world && this.otherEndpoint.world()) {
      var globalCurLoc = this.owner.worldPoint(this.getPosition());
      var globalNewLoc = this.otherEndpoint.worldPoint(this.otherEndpoint.relativeLineEndpoint);
      // aaa console.log("OK, zooming from " + globalCurLoc + " to " + globalNewLoc + "; noLongerNeedsToBeUpdated is " + this.arrow.noLongerNeedsToBeUpdated);
      world.addMorphAt(this, globalCurLoc);
      this._animator = this.startZoomingInAStraightLineTo(globalNewLoc, false, false, false, function() {
        delete this._animator;
        this.remove();
        callWhenDone();
      }.bind(this));
      this._animator.isZoomingTo = null;
    } else {
      this.remove();
      callWhenDone();
    }
  },

  justDidAnimatedPositionChange: function() {
    this.arrow.changeVerticesIfNecessary();
  },

  localPositionClosestTo: function(localPositionToBeClosestTo, localCenter) {
    var vectorFromCenterToPositionToBeClosestTo = localPositionToBeClosestTo.subPt(localCenter);
    var s1 = vectorFromCenterToPositionToBeClosestTo.x !== 0 ? Math.abs(localCenter.x / vectorFromCenterToPositionToBeClosestTo.x) : null;
    var s2 = vectorFromCenterToPositionToBeClosestTo.y !== 0 ? Math.abs(localCenter.y / vectorFromCenterToPositionToBeClosestTo.y) : null;
    var positonToBeClosestToIsAlongAVerticalEdge = s2 === null || s1 < s2;
    var s = positonToBeClosestToIsAlongAVerticalEdge ? s1 : s2;
    return localCenter.addPt(vectorFromCenterToPositionToBeClosestTo.scaleBy(s));
  },

  setShapeToLookLikeACircle: function(arrowTheta) {
    if (! this.wasAlreadySetToLookLikeACircle) {
      this.setShape(new lively.scene.Ellipse(pt(0,0).extent(pt(10,10))));
      this.wasAlreadySetToLookLikeACircle = true;
      this.wasAlreadySetToLookLikeAnArrow = false;
    }
    this.setRotation(arrowTheta);
  },

  setShapeToLookLikeNothing: function(arrowTheta) {
    this.setShape(new lively.scene.Rectangle(pt(0,0).extent(pt(0,0))));
    this.wasAlreadySetToLookLikeACircle = false;
    this.wasAlreadySetToLookLikeAnArrow = false;
  },

  setShapeToLookLikeAnArrow: function(arrowTheta) {
    if (! this.wasAlreadySetToLookLikeAnArrow) {
      var parallelVector = pt(1,0);
      var pointOnTipOfArrow = this.relativeLineEndpoint;
      var middleOfBaseOfArrow = pointOnTipOfArrow.addPt(parallelVector.scaleBy(15.0));
      var vectorToPointOnBaseOfArrow = parallelVector.perpendicularVector().scaleBy(6.0);
      var verticesOfArrow = [pointOnTipOfArrow, middleOfBaseOfArrow.addPt(vectorToPointOnBaseOfArrow), middleOfBaseOfArrow.subPt(vectorToPointOnBaseOfArrow)];
      this.setShape(new lively.scene.Polygon(verticesOfArrow, Color.black, 1, Color.black));
      this.wasAlreadySetToLookLikeAnArrow = true;
      this.wasAlreadySetToLookLikeACircle = false;
    }
    this.setRotation(arrowTheta);
  },

  calculateDefaultVectorFromOtherEndpoint: function() {
    var e = this.otherEndpoint.lineEndpoint();
    var c = this.otherEndpoint.ownerCenterpoint();
    var d = e.subPt(c);
    var s = d.scaleToLength(50);
    return s;
  },

  okToBeGrabbedBy: function(evt) { return this.arrow.isReadOnly ? null : this; },

  wasJustDroppedOn: function(m) {
    this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = false;
    this.vectorFromOtherEndpoint = null;
  }
});

Object.extend(ArrowEndpoint, {
  createForSetting: function(evt, tr, fep) {
    var arrow = tr.setterArrow;
    if (! arrow) {
      arrow = tr.setterArrow = new ArrowMorph(tr, fep || tr.morph());
      evt.hand.world().addMorph(arrow);
    } else {
      arrow.endpoint2.setPosition(evt.hand.position());
    }
    evt.hand.grabMorph(arrow.endpoint2, evt);
  }
});

Morph.addMethods({
  topmostOwnerBesidesTheWorldAndTheHand: function() {
    var m = this;
    while (m.owner && ! (m.owner instanceof WorldMorph) && ! (m.owner instanceof HandMorph)) {
      m = m.owner;
    }
    return m;
  },

  detachArrowEndpoints: function() {
    var world = this.world();
    if (world) {
      this.submorphs.each(function(m) {
        if (m instanceof ArrowEndpoint) {
          world.addMorphAt(m, this.worldPoint(m.getPosition()));
        }
      }.bind(this));
    }
  },

  beArrowEndpoint: function() {
    this.determineWhichMorphToAttachTo = function() { return !!this.world(); };
    this.attachToTheRightPlace = function() {};
    this.noLongerNeedsToBeVisibleAsArrowEndpoint = function(callWhenDone) {callWhenDone();};
    this.relativeLineEndpoint = this.getExtent().scaleBy(0.5);
    this.setShapeToLookLikeACircle = function() {};
  },

  ownerCenterpoint: function() {
    var o = this.owner;
    if (!o || !o.world()) {return pt(0, 0);}
    return o.worldPoint(o.shape.bounds().center());
  },

  relativeCenterpoint: function() {
    return this.shape.bounds().extent().scaleBy(0.5);
  },

  lineEndpoint: function() {
    if (! this.world()) {return pt(0,0);}
    return this.worldPoint(this.relativeLineEndpoint);
  }
});
