var tickNumber = 0;
var periodicArrowUpdatingProcess = PeriodicalExecuter.createButDontStartYet(function(pe) {
  updateAllArrows();
}, 0.1);

var allArrows = [];

function eachArrowThatShouldBeUpdated(f) {
  allArrows.each(function(a) {if (!a.noLongerNeedsToBeUpdated) {f(a);}});
}

function updateAllArrows() {
  eachArrowThatShouldBeUpdated(function(a) {
    if (a.shouldUpdateOnThisTick(tickNumber)) {
      a.putVerticesInTheRightPlace();
    }
  });
  tickNumber = (tickNumber + 1) % 5;
}

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
    this.tickSlowly();
  },

  initializeUI: function() {
    // aaa - Wait, is this ever called?
    this.closeDnD();
    this.ignoreEvents();
    this.beUngrabbable();

    return this;
  },

  // Optimization suggested by Dan Ingalls: slow down ticking when things are pretty quiet.
  tickQuickly: function() { this.shouldUpdateOnEveryTick = true;  /* this.periodicalExecuter.changeFrequency(this.frequencyWhenStuffIsHappening  ); */ },
  tickSlowly:  function() { this.shouldUpdateOnEveryTick = false; /* this.periodicalExecuter.changeFrequency(this.frequencyWhenStuffIsPrettyQuiet); */ },
  shouldUpdateOnThisTick: function(n) {return this.shouldUpdateOnEveryTick || n == 0;},

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
    var m1 = this.endpoint1.determineWhichMorphToAttachTo();
    var m2 = this.endpoint2.determineWhichMorphToAttachTo();
    var w  = WorldMorph.current();
    return m1 && m2 && (m1 != w || m2 != w);
  },

  calculateCenterPoints: function() {
    this.endpoint1.cachedCenterPoint = this.endpoint1.globalBoundsNotIncludingStickouts().center();
    this.endpoint2.cachedCenterPoint = this.endpoint2.globalBoundsNotIncludingStickouts().center();
  },

  changeVerticesIfNecessary: function() {
    var oldVertices = this.shape.vertices();
    // Rounding seems to be necessary because comparing floats doesn't work? Weird.
    var newVertices = [this.endpoint1.lineEndpoint().roundTo(1), this.endpoint2.lineEndpoint().roundTo(1)];
    if (oldVertices[0].roundTo(1).eqPt(newVertices[0]) && oldVertices[1].roundTo(1).eqPt(newVertices[1])) {
      this.tickSlowly();
    } else {
      //alert("aaa: " + oldVertices[0] + " != " + newVertices[0] + " or " + oldVertices[1] + " != " + newVertices[1]);
      this.changeVertices(newVertices);
      this.tickQuickly();
    }
  },

  changeVertices: function(newVertices) {
    this.setVertices(newVertices);

    if (! newVertices[0].eqPt(newVertices[1])) {
      this.endpoint1.setShapeToLookLikeACircle();
      this.endpoint2.setShapeToLookLikeAnArrow();
      var arrowDirection = newVertices[1].subPt(newVertices[0]);
      this.endpoint1.setRotation(arrowDirection          .theta());
      this.endpoint2.setRotation(arrowDirection.negated().theta());
    }

    var typeRef = this.association && this.association.getAssociationTypeRef && this.association.getAssociationTypeRef();
    if (typeRef) {
      typeRef.morph().setPosition(newVertices[0].midPt(newVertices[1]).subPt(typeRef.morph().bounds().extent().scaleBy(0.5)));
    }
  },

  grabEndpoint:  function(evt, endpoint) {endpoint.grabMe(evt);},
  grabEndpoint1: function(evt) {this.grabEndpoint(evt, this.endpoint1);},
  grabEndpoint2: function(evt) {this.grabEndpoint(evt, this.endpoint2);},
});

Morph.subclass("ArrowEndpoint", {
  initialize: function($super, tr, a, isTransient) {
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    this.relativeLineEndpoint = pt(5, 5);
    this.isArrowEndpoint = true;
    this.shouldNotBePartOfRowOrColumn = true;
    this.topicRef = tr;
    this.association = a;
    this.setFill(Color.black);
    this.shouldDisappearAfterAttaching = isTransient;

    this.layoutRepulsiveCharge = 0.25;
  },

  suppressHandles: true,
  okToDuplicate: Functions.False,

  determineWhichMorphToAttachTo: function() {
    if (this.owner instanceof HandMorph) {return this.morphToAttachTo = this.owner;}
    var slotContents = this.topicRef.contents();
    var outliner = WorldMorph.current().existingOutlinerFor(slotContents);
    return this.morphToAttachTo = outliner ? (outliner.world() ? outliner : null) : null;
  },

  attachToTheRightPlace: function() {
    if (this.morphToAttachTo instanceof HandMorph) {return;}
    if (this.morphToAttachTo == this.owner && this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner) {return;}
    if (this.morphToAttachTo != WorldMorph.current()) {

      // aaa - Do outliners need this stuff?
      var index = this.association.rankAmongArrowsWithSameEndpoints();
      var offsetFromMidpoint = Math.floor((index + 1) / 2) * (index % 2 == 0 ? 1 : -1);
      //console.log("Index thingy:" + index + ", offsetFromMidpoint: " + offsetFromMidpoint);

      var localCenter = this.ownerRelativeCenterpoint();
      var vectorFromHereToMidpoint = this.otherEndpoint.ownerCenterpoint().subPt(this.ownerCenterpoint()).scaleBy(0.5);
      var normal = vectorFromHereToMidpoint.perpendicularVector().unitVector() || pt(0,0);
      var vectorFromMidpointToOffsetPlaceThingamajig = normal.scaleBy(offsetFromMidpoint * 100);
      var localPositionToBeClosestTo = localCenter.addPt(vectorFromHereToMidpoint.addPt(vectorFromMidpointToOffsetPlaceThingamajig));
      var localNewLoc = this.localPositionClosestTo(localPositionToBeClosestTo, localCenter).roundTo(1);
      //console.log("aaa x:" + localNewLoc.x + ", y: " + localNewLoc.y);

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

  setShapeToLookLikeACircle: function() {
    if (! this.wasAlreadySetToLookLikeACircle) {
      this.setShape(new lively.scene.Ellipse(pt(0,0).extent(pt(10,10))));
      this.wasAlreadySetToLookLikeACircle = true;
    }
  },

  setShapeToLookLikeAnArrow: function() {
    if (! this.wasAlreadySetToLookLikeAnArrow) {
      var parallelVector = pt(1,0);
      var pointOnTipOfArrow = this.relativeLineEndpoint;
      var middleOfBaseOfArrow = pointOnTipOfArrow.addPt(parallelVector.scaleBy(15.0));
      var vectorToPointOnBaseOfArrow = parallelVector.perpendicularVector().scaleBy(6.0);
      var verticesOfArrow = [pointOnTipOfArrow, middleOfBaseOfArrow.addPt(vectorToPointOnBaseOfArrow), middleOfBaseOfArrow.subPt(vectorToPointOnBaseOfArrow)];
      this.setShape(new lively.scene.Polygon(verticesOfArrow, Color.black, 1, Color.black));
      this.wasAlreadySetToLookLikeAnArrow = true;
    }
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

  okToBeGrabbedBy: function(evt) { return this.association.isReadOnly ? null : this; },

  inspect: function() {
    var topic = this.topicRef ? this.topicRef.getTopic() : null;
    return topic ? topic.inspect() : "an association endpoint";
  },

  morphMenu: function(evt) {
    // This shouldn't really have a menu at all. How do I get rid of it?
    var menu = new MenuMorph([], this);
    return menu;
  },

  // aaa - make this cleaner, so that ArrowEndpoint can be more general, not just for outliners
  wasJustDroppedOnOutliner: function(outliner) {
    if (this.shouldDisappearAfterAttaching) {
      this.topicRef.setterArrow = null;
      this.noLongerNeedsToBeVisibleAsArrowEndpoint();
      this.association.noLongerNeedsToBeVisible();
    } else {
      this.doesNotNeedToBeRepositionedIfItStaysWithTheSameOwner = false;
    }
    this.vectorFromOtherEndpoint = null;
    this.topicRef.setContents(outliner.mirror());
  },
});

Object.extend(ArrowEndpoint, {
  createForSetting: function(evt, tr, fep) {
    var arrow = tr.setterArrow;
    if (arrow == null) {
      arrow = tr.setterArrow = new TopicRefArrow(tr, fep || tr.morph());
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

CanHaveArrowsAttachedToIt = {
  eachArrowEndpoint: function(f) {
    // aaa - I think this could (and probably should) be optimized.
    this.submorphs.each(function(m) {
      if (m.isArrowEndpoint) {f(m);}
    });
  },
};
