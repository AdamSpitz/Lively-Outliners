Morph.subclass("RowOrColumnMorph", {
  initialize: function($super, d) {
    this.direction = d;
    this.sPadding = 10;
    this.fPadding = 10;
    this.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    this.  verticalLayoutMode = LayoutModes.ShrinkWrap;
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    return this;
  },

  minimumExtent: function() {
    if (this._cachedMinimumExtent) { return this._cachedMinimumExtent; }

    var direction = this.direction;
    var sPadding  = this.sPadding;
    var fPadding  = this.fPadding;

    var biggestSideways = sPadding + sPadding;
    var totalForwards   = fPadding;
    this.eachThingy(function(m) {
      var mMinExt = m.minimumExtent();
      biggestSideways = Math.max(biggestSideways, direction.sidewaysCoordinateOfPoint(mMinExt) + sPadding + sPadding);
        totalForwards =          totalForwards  + direction. forwardCoordinateOfPoint(mMinExt) + fPadding;
    });

    var p = this._cachedMinimumExtent = direction.point(totalForwards, biggestSideways);

    return p;
  },

  new_rejiggerTheLayout: function(availableSpace) {
    // console.log(this.inspect() + " has asked for at least " + this._cachedMinimumExtent + " and received " + availableSpace);
    
    var availableSpaceToUse = pt(this.horizontalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.x : availableSpace.x,
                                 this.  verticalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.y : availableSpace.y);

    if (this._spaceUsedLastTime && this._spaceUsedLastTime.eqPt(availableSpaceToUse)) { return; }
    this._spaceUsedLastTime = availableSpaceToUse;

    var direction = this.direction;
    var sPadding  = this.sPadding;
    var fPadding  = this.fPadding;

    var availableSpaceToPassOn = availableSpaceToUse.addPt(direction.point(0, -sPadding - sPadding));

    var extraForwardSpace = this.direction.forwardCoordinateOfPoint(availableSpaceToPassOn) - this.direction.forwardCoordinateOfPoint(this._cachedMinimumExtent);
    
    var allChildren = $A(this.submorphs).reject(function(m) {return m.shouldNotBePartOfRowOrColumn;});

    var forwardSpaceFillingChildren = allChildren.select(function(m) {return direction.forwardLayoutModeOf(m) === LayoutModes.SpaceFill;});
    var extraForwardSpacePerSpaceFillingChild = 0;
    if (forwardSpaceFillingChildren.size() === 0) {
      // Nobody wants it; just put in extra padding.
      var numberOfPads = allChildren.size() + 1;
      fPadding += (extraForwardSpace / numberOfPads);
    } else {
      // Divvy it up among those who want it.
      extraForwardSpacePerSpaceFillingChild = extraForwardSpace / forwardSpaceFillingChildren.size();
    }
    
    var forward = fPadding;
    if (this.aaaDebugMe) { console.log("Starting off, availableSpace: " + availableSpace + ", forward: " + forward); }
    this.eachThingy(function(m) {
      var availableSpaceToPassOnToThisChild = direction.point(direction. forwardCoordinateOfPoint(m._cachedMinimumExtent),
                                                              direction.sidewaysCoordinateOfPoint(availableSpaceToPassOn));
      if (direction.forwardLayoutModeOf(m) === LayoutModes.SpaceFill) {
        availableSpaceToPassOnToThisChild = availableSpaceToPassOnToThisChild.addPt(direction.point(extraForwardSpacePerSpaceFillingChild, 0));
      }
      m.new_rejiggerTheLayout(availableSpaceToPassOnToThisChild);
      
      var f = direction.forwardCoordinateOfPoint(m.getExtent());
      if (this.aaaDebugMe) { console.log("f is: " + f + ", m.extent is " + m.getExtent()); }
      var unusedSidewaysSpace = direction.sidewaysCoordinateOfPoint(availableSpaceToPassOnToThisChild) - direction.sidewaysCoordinateOfPoint(m.getExtent());
      var p = direction.point(forward, sPadding + (unusedSidewaysSpace / 2));
      m.setPosition(p);
      if (f != 0) {forward += f + fPadding;}
      if (this.aaaDebugMe) { console.log("Added " + m.inspect() + ", forward is now: " + forward); }
    }.bind(this));

    if (this.aaaDebugMe) { console.log("Gonna set newExtent to availableSpaceToUse: " + availableSpaceToUse); }
    var newExtent = availableSpaceToUse;
    var shapeBounds = this.shape.bounds();
    if (! newExtent.eqPt(shapeBounds.extent())) {
      var b = shapeBounds.topLeft().addPt(this.origin).extent(newExtent.scaleBy(this.getScale()));
      this.setBounds(b);
      if (this.aaaDebugMe) { console.log("Setting bounds to " + b); }
    }
  },

     addThingy: function(m) {this.   addMorph(m); this.minimumExtentChanged();},
  removeThingy: function(m) {this.removeMorph(m); this.minimumExtentChanged();},

  replaceThingiesWith: function(ms) {
    var old = $A(this.submorphs);
    for (var i = 0, n = old.length; i < n; ++i) { var m = old[i]; if (! m.shouldNotBePartOfRowOrColumn) {this.removeMorph(m);}}
    for (var i = 0, n =  ms.length; i < n; ++i) { this.addMorph(ms[i]); }
    this.minimumExtentChanged();
  },

  eachThingy: function(f) {
    $A(this.submorphs).each(function(m) {
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    });
  },

  beInvisible: function() {
    this.sPadding = 0;
    this.fPadding = 0;
    this.setFill(null);
    this.setBorderWidth(0);
    this.beUngrabbable();
    this.ignoreEvents(); // aaa - just added this, not sure it's the right thing to do
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
