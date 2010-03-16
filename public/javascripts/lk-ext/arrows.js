Morph.subclass("ArrowMorph", {
  initialize: function($super) {
    $super(new lively.scene.Polyline([pt(0,0), pt(0,0)]));
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.setFill(null);
    this.createEndpoints();
    this.endpoint1.otherEndpoint = this.endpoint2;
    this.endpoint2.otherEndpoint = this.endpoint1;
    this.endpoint2.relativeLineEndpoint = pt(0,0);
    this.closeDnD();
    this.ignoreEvents();
    this.beUngrabbable();
    this.needsToBeVisible();
  },

  stopUpdating: function() {
    if (this._updateProcess) {
      this._updateProcess.stop();
      delete this._updateProcess;
    }
  },

  changeUpdateFrequency: function(newFrequency) {
    // Optimization suggested by Dan Ingalls: slow down ticking when things are pretty quiet.
    this.stopUpdating();
    this._updateProcess = new PeriodicalExecuter(function(pe) {
      this.putVerticesInTheRightPlace();
    }.bind(this), newFrequency);
  },

  tickQuickly: function() { this.changeUpdateFrequency(0.1); },
  tickSlowly:  function() { this.changeUpdateFrequency(0.5); },

  noLongerNeedsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = true;
    this.stopUpdating();
    this.remove();
    this.endpoint2.remove();
  },

  needsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = false;
    this.tickSlowly();
  },

  putVerticesInTheRightPlace: function() {
    if (this.shouldBeShown()) {
      this.calculateCenterPoints();
      this.endpoint1.attachToTheRightPlace();
      this.endpoint2.attachToTheRightPlace();
      if (! this.owner) {
        WorldMorph.current().addMorph(this);
      }
      this.changeVerticesIfNecessary();
    } else {
      this.endpoint1.noLongerNeedsToBeVisibleAsArrowEndpoint();
      this.endpoint2.noLongerNeedsToBeVisibleAsArrowEndpoint();
      if (this.owner) {
        this.remove();
        this.tickSlowly();
      }
    }
  },

  shouldBeShown: function() {
    if (this.noLongerNeedsToBeUpdated) { return false; }
    var m1 = this.endpoint1.determineWhichMorphToAttachTo();
    var m2 = this.endpoint2.determineWhichMorphToAttachTo();
    var w  = WorldMorph.current();
    return m1 && m2 && (m1 !== w || m2 !== w);
  },

  calculateCenterPoints: function() {
    this.endpoint1.cachedCenterPoint = this.endpoint1.globalBoundsNotIncludingStickouts().center();
    this.endpoint2.cachedCenterPoint = this.endpoint2.globalBoundsNotIncludingStickouts().center();
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
      this.endpoint1.setShapeToLookLikeACircle(arrowDirection          .theta());
      this.endpoint2.setShapeToLookLikeAnArrow(arrowDirection.negated().theta());
    }
  },

  grabEndpoint:  function(evt, endpoint) {endpoint.grabMe(evt);},
  grabEndpoint1: function(evt) {this.grabEndpoint(evt, this.endpoint1);},
  grabEndpoint2: function(evt) {this.grabEndpoint(evt, this.endpoint2);},

  shouldIgnorePoses: function(uiState) { return true; },
});

Morph.subclass("ArrowEndpoint", {
  initialize: function($super, tr, a, isTransient) {
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    this.relativeLineEndpoint = pt(5, 5);
    this.isArrowEndpoint = true;
    this.shouldNotBePartOfRowOrColumn = true;
    this.topicRef = tr;
    this.arrow = a;
    this.setFill(Color.black);
    this.shouldDisappearAfterAttaching = isTransient;

    this.layoutRepulsiveCharge = 0.25;
  },

  suppressHandles: true,
  okToDuplicate: Functions.False,

  determineWhichMorphToAttachTo: function() {
    if (this.owner instanceof HandMorph) {return this.morphToAttachTo = this.owner;}
    return this.morphToAttachTo = this.whichMorphToAttachTo();
  },

  // aaa
  whichMorphToAttachTo: function() {
    var slotContents = this.topicRef.contents();
    var outliner = WorldMorph.current().existingMorphFor(slotContents);
    return outliner ? (outliner.world() ? outliner : null) : null;
  },

  attachToTheRightPlace: function() {
    if (this.morphToAttachTo instanceof HandMorph) {return;}
    if (this.morphToAttachTo == this.owner && this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner) {return;}
    if (this.morphToAttachTo != WorldMorph.current()) {

      // aaa - Do outliners need this stuff?
      var localCenter = this.ownerRelativeCenterpoint();
      var vectorFromHereToMidpoint = this.otherEndpoint.ownerCenterpoint().subPt(this.ownerCenterpoint()).scaleBy(0.5);
      var localPositionToBeClosestTo = localCenter.addPt(vectorFromHereToMidpoint);
      var localNewLoc = this.localPositionClosestTo(localPositionToBeClosestTo, localCenter).roundTo(1);

      // aaa - shouldn't really be necessary, but might be faster.
      if (this.owner == this.morphToAttachTo) {
        //this.setPosition(localNewLoc);
        this.translateBy(localNewLoc.subPt(this.origin || pt(0,0))) // aaa really silly, but let's try it - I don't know why the above line wasn't working quite right
      } else {
        this.morphToAttachTo.addMorphAt(this, localNewLoc);
      }
      this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = true;
    } else {
      if (this.vectorFromOtherEndpoint == null) {this.vectorFromOtherEndpoint = this.calculateDefaultVectorFromOtherEndpoint();}
      var newLoc = this.otherEndpoint.world() ? this.otherEndpoint.worldPoint(pt(0,0)).addPt(this.vectorFromOtherEndpoint) : pt(0,0);
      this.morphToAttachTo.addMorphAt(this, newLoc);
    }
  },

  localPositionClosestTo: function(localPositionToBeClosestTo, localCenter) {
    var vectorFromCenterToPositionToBeClosestTo = localPositionToBeClosestTo.subPt(localCenter);
    var s1 = vectorFromCenterToPositionToBeClosestTo.x != 0 ? Math.abs(localCenter.x / vectorFromCenterToPositionToBeClosestTo.x) : null;
    var s2 = vectorFromCenterToPositionToBeClosestTo.y != 0 ? Math.abs(localCenter.y / vectorFromCenterToPositionToBeClosestTo.y) : null;
    var positonToBeClosestToIsAlongAVerticalEdge = s2 == null || s1 < s2;
    var s = positonToBeClosestToIsAlongAVerticalEdge ? s1 : s2;
    return localCenter.addPt(vectorFromCenterToPositionToBeClosestTo.scaleBy(s));
  },

  setShapeToLookLikeACircle: function(arrowTheta) {
    if (! this.wasAlreadySetToLookLikeACircle) {
      this.setShape(new lively.scene.Ellipse(pt(0,0).extent(pt(10,10))));
      this.wasAlreadySetToLookLikeACircle = true;
    }
    this.setRotation(arrowTheta);
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
    }
    this.setRotation(arrowTheta);
  },

  noLongerNeedsToBeVisibleAsArrowEndpoint: function() {
    this.remove();
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
    if (this.shouldDisappearAfterAttaching) {
      this.topicRef.setterArrow = null;
      this.noLongerNeedsToBeVisibleAsArrowEndpoint();
      this.arrow.noLongerNeedsToBeVisible();
    } else {
      this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = false;
    }
    this.vectorFromOtherEndpoint = null;
  },
});

Object.extend(ArrowEndpoint, {
  createForSetting: function(evt, tr, fep, arrowClass) {
    var arrow = tr.setterArrow;
    if (arrow == null) {
      arrow = tr.setterArrow = new arrowClass(tr, fep || tr.morph());
      WorldMorph.current().addMorph(arrow);
    } else {
      arrow.endpoint2.setPosition(evt.hand.position());
    }
    evt.hand.grabMorph(arrow.endpoint2, evt);
  },

  cached_friction: pt(5,5),
});

Morph.addMethods({
  ownerCenterpoint: function() {
    var o = this.owner;
    if (o == null || !o.world()) {return pt(0, 0);}
    return o.worldPoint(o.shape.bounds().center());
  },

  ownerRelativeCenterpoint: function() {
    var o = this.owner;
    if (o == null || !o.world()) {return pt(0, 0);}
    return o.shape.bounds().extent().scaleBy(0.5);
  },

  lineEndpoint: function() {
    if (! this.world()) {return pt(0,0);}
    return this.worldPoint(this.relativeLineEndpoint);
  },
});


function beArrowEndpoint(m) {
  m.determineWhichMorphToAttachTo = function() {return !!this.world();};
  m.attachToTheRightPlace = function() {};
  m.noLongerNeedsToBeVisibleAsArrowEndpoint = function() {};
  m.relativeLineEndpoint = m.getExtent().scaleBy(0.5);
  m.setShapeToLookLikeACircle = function() {};
}
