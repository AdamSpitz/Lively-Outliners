Morph.subclass("RowOrColumnMorph", {
  initialize: function($super, d) {
    this.direction = d;
    this.setPadding(10);
    this.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    this.  verticalLayoutMode = LayoutModes.ShrinkWrap;
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    return this;
  },

  setPadding: function(p) {
    if (typeof p === 'number') {
      this.padding = {left: p, right: p, top: p, bottom: p, between: p};
    } else {
      this.padding = p;
    }
  },

  minimumExtent: function() {
    if (this._cachedMinimumExtent) { return this._cachedMinimumExtent; }

    var direction = this.direction;
    var padding   = this.padding;

    var combinedSidewaysPadding = direction.sidewaysPadding1(padding) + direction.sidewaysPadding2(padding);
    var biggestSideways = combinedSidewaysPadding;
    var totalForwards   = 0;
    var paddingBeforeNextMorph = direction.forwardPadding1(padding);
    this.eachThingy(function(m) {
      var mMinExt = m.minimumExtent();

      biggestSideways = Math.max(biggestSideways, direction.sidewaysCoordinateOfPoint(mMinExt) + combinedSidewaysPadding);
        totalForwards =          totalForwards  + direction. forwardCoordinateOfPoint(mMinExt) + paddingBeforeNextMorph;

      paddingBeforeNextMorph = padding.between;
    });
    totalForwards += direction.forwardPadding2(padding);

    var p = this._cachedMinimumExtent = direction.point(totalForwards, biggestSideways);

    return p;
  },

  rejiggerTheLayout: function(availableSpace) {
    // console.log(this.inspect() + " has asked for at least " + this._cachedMinimumExtent + " and received " + availableSpace);
    
    var availableSpaceToUse = pt(this.horizontalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.x : availableSpace.x,
                                 this.  verticalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.y : availableSpace.y);
    if (this.aaaDebugMe) { console.log("availableSpace: " + availableSpace + ", availableSpaceToUse: " + availableSpaceToUse); }

    if (this._layoutIsStillValid && this._spaceUsedLastTime && this._spaceUsedLastTime.eqPt(availableSpaceToUse)) {
      if (this.aaaDebugMe) { console.log("Not gonna lay out " + this.inspect() + ", since it's already laid out in the appropriate amount of space."); }
      return this.getExtent();
    }
    this._spaceUsedLastTime = availableSpaceToUse;

    var direction = this.direction;
    var padding   = this.padding;
    var combinedSidewaysPadding = direction.sidewaysPadding1(padding) + direction.sidewaysPadding2(padding);
    var paddingBeforeNextMorph  = direction.forwardPadding1(padding);

    var availableSpaceToPassOn = availableSpaceToUse.addPt(direction.point(0, -combinedSidewaysPadding));

    var extraForwardSpace = this.direction.forwardCoordinateOfPoint(availableSpaceToPassOn) - this.direction.forwardCoordinateOfPoint(this._cachedMinimumExtent);
    
    var allChildren = $A(this.submorphs).reject(function(m) {return m.shouldNotBePartOfRowOrColumn;});

    var forwardSpaceFillingChildren = allChildren.select(function(m) {return direction.forwardLayoutModeOf(m) === LayoutModes.SpaceFill;});
    var extraForwardSpacePerSpaceFillingChild = 0;
    if (forwardSpaceFillingChildren.size() === 0) {
      // Nobody wants it; just put in extra padding.
      var numberOfBetweenPads = allChildren.size() - 1;
      padding = Object.clone(padding);
      padding.between += (extraForwardSpace / numberOfBetweenPads);
    } else {
      // Divvy it up among those who want it.
      extraForwardSpacePerSpaceFillingChild = extraForwardSpace / forwardSpaceFillingChildren.size();
    }
    
    var forward = 0;
    if (this.aaaDebugMe) { console.log("Starting off, availableSpace: " + availableSpace); }
    this.eachThingy(function(m) {
      var availableSpaceToPassOnToThisChild = direction.point(direction. forwardCoordinateOfPoint(m._cachedMinimumExtent),
                                                              direction.sidewaysCoordinateOfPoint(availableSpaceToPassOn));
      if (direction.forwardLayoutModeOf(m) === LayoutModes.SpaceFill) {
        availableSpaceToPassOnToThisChild = availableSpaceToPassOnToThisChild.addPt(direction.point(extraForwardSpacePerSpaceFillingChild, 0));
      }

      var mExtent = m.rejiggerTheLayout(availableSpaceToPassOnToThisChild);
      
      var f = direction.forwardCoordinateOfPoint(mExtent);
      if (this.aaaDebugMe) { console.log("f is: " + f + ", m.extent is " + mExtent); }
      var unusedSidewaysSpace = direction.sidewaysCoordinateOfPoint(availableSpaceToPassOnToThisChild) - direction.sidewaysCoordinateOfPoint(mExtent);
      forward += paddingBeforeNextMorph;
      var p = direction.point(forward, direction.sidewaysPadding1(padding) + (unusedSidewaysSpace / 2));
      forward += f;
      m.setPosition(p);
      if (this.aaaDebugMe) { console.log("Added " + m.inspect() + " at " + p + ", forward is now: " + forward); }
      paddingBeforeNextMorph = f === 0 ? 0 : padding.between;
    }.bind(this));
    forward += direction.forwardPadding2(padding);

    if (this.aaaDebugMe) { console.log("Gonna set newExtent to availableSpaceToUse: " + availableSpaceToUse); }
    var newExtent = availableSpaceToUse.scaleBy(this.getScale());
    if (! newExtent.eqPt(this.getExtent())) {
      this.setExtent(newExtent);
      //this.smoothlyResizeTo(newExtent); // aaa - doesn't quite work right yet
      if (this.aaaDebugMe) { console.log("Setting bounds to " + b); }
    }
    this._layoutIsStillValid = true;
    return newExtent;
  },

     addThingy: function(m) {this.   addMorph(m); this.forceLayoutRejiggering();},
  removeThingy: function(m) {this.removeMorph(m); this.forceLayoutRejiggering();},

  areArraysEqual: function(a1, a2) {
    if (a1.length !== a2.length) { return false; }
    for (var i = 0, n = a1.length; i < n; ++i) {
      if (a1[i] !== a2[i]) { return false; }
    }
    return true;
  },

  replaceThingiesWith: function(ms) {
    var old = $A(this.submorphs);

    if (this.areArraysEqual(old, ms)) { return; }

    for (var i = 0, n = old.length; i < n; ++i) { var m = old[i]; if (! m.shouldNotBePartOfRowOrColumn) {this.removeMorph(m);}}
    for (var i = 0, n =  ms.length; i < n; ++i) { this.addMorph(ms[i]); }
    this.forceLayoutRejiggering();
  },

  eachThingy: function(f) {
    $A(this.submorphs).each(function(m) {
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    });
  },

  beInvisible: function() {
    this.setPadding(0);
    this.setFill(null);
    this.setBorderWidth(0);
    this.beUngrabbable();
    this.ignoreEvents(); // allows dragging through me, I think
    this.closeDnD(); // allows dropping through me
    return this;
  }
});

RowOrColumnMorph.subclass("ColumnMorph", {
  initialize: function($super) {
    $super(VerticalDirection);
    return this;
  },
  addRow: function(m) {this.addThingy(m);},
});

RowOrColumnMorph.subclass("RowMorph", {
  initialize: function($super) {
    $super(HorizontalDirection);
    return this;
  },
  addColumn: function(m) {this.addThingy(m);}
});

var VerticalDirection = {
  externallySpecifiedFreeSpaceSideways: function(m) {return m.externallySpecifiedFreeWidth;},
  specifyFreeSpaceSideways: function(m, s) {m.externallySpecifiedFreeWidth = s;},
  forwardDimensionOfRect: function(r) {return r.height;},
  sidewaysDimensionOfRect: function(r) {return r.width;},
  forwardCoordinateOfPoint: function(p) {return p.y;},
  sidewaysCoordinateOfPoint: function(p) {return p.x;},
  rectWithSidewaysDimension: function(r, s) {return r.withWidth(s);},
  rectWithForwardDimension: function(r, f) {return r.withHeight(f);},
  positionAtForwardCoord: function(f) {return pt(0, f);},
  forwardPadding1: function(padding) {return padding.top;},
  forwardPadding2: function(padding) {return padding.bottom;},
  sidewaysPadding1: function(padding) {return padding.left;},
  sidewaysPadding2: function(padding) {return padding.right;},
  point: function(f, s) {return pt(s, f);},
  forwardLayoutModeOf: function(m) {return m.verticalLayoutMode;}
};

var HorizontalDirection = {
  externallySpecifiedFreeSpaceSideways: function(m) {return m.externallySpecifiedFreeHeight;},
  specifyFreeSpaceSideways: function(m, s) {m.externallySpecifiedFreeHeight = s;},
  forwardDimensionOfRect: function(r) {return r.width;},
  sidewaysDimensionOfRect: function(r) {return r.height;},
  forwardCoordinateOfPoint: function(p) {return p.x;},
  sidewaysCoordinateOfPoint: function(p) {return p.y;},
  rectWithSidewaysDimension: function(r, s) {return r.withHeight(s);},
  rectWithForwardDimension: function(r, f) {return r.withWidth(f);},
  positionAtForwardCoord: function(f) {return pt(f, 0);},
  forwardPadding1: function(padding) {return padding.left;},
  forwardPadding2: function(padding) {return padding.right;},
  sidewaysPadding1: function(padding) {return padding.top;},
  sidewaysPadding2: function(padding) {return padding.bottom;},
  point: function(f, s) {return pt(f, s);},
  forwardLayoutModeOf: function(m) {return m.horizontalLayoutMode;}
};

HandMorph.addMethods({
  shouldNotBePartOfRowOrColumn: true
});

function createSpacer(klass) {
  var spacer = new RowMorph().beInvisible();
  spacer.inspect = function() { return "a spacer"; };
  spacer.horizontalLayoutMode = LayoutModes.SpaceFill;
  spacer.  verticalLayoutMode = LayoutModes.SpaceFill;
  return spacer;
}
