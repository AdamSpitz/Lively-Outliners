Morph.subclass("RowOrColumnMorph", {
  initialize: function($super, d) {
    this.direction = d;
    this.sPadding = 10;
    this.fPadding = 10;
    this.horizontalLayoutMode = LayoutModes.ShrinkWrap;
    this.  verticalLayoutMode = LayoutModes.ShrinkWrap;
    this.rejiggerer = new BatcherUpper(this.rejiggerTheLayout.bind(this));
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    return this;
  },

  calculateMinimumExtent: function() {
    var direction = this.direction;
    var sPadding  = this.sPadding;
    var fPadding  = this.fPadding;

    var biggestSideways = sPadding + sPadding;
    var totalForwards   = fPadding;
    this.eachThingy(function(m) {
      var mMinExt = m.calculateMinimumExtent();
      biggestSideways = Math.max(biggestSideways, direction.sidewaysCoordinateOfPoint(mMinExt) + sPadding + sPadding);
        totalForwards =          totalForwards  + direction. forwardCoordinateOfPoint(mMinExt) + fPadding;
    });

    return this._cachedMinimumExtent = direction.point(totalForwards, biggestSideways);
  },

  new_rejiggerTheLayout: function(availableSpace) {
    if (this.rejiggerer.should_not_bother_yet()) {return;}

    if (availableSpace.x === 0) {throw "Hey, what's up with the no space?";}
    
    var direction = this.direction;
    var sPadding  = this.sPadding;
    var fPadding  = this.fPadding;

    var availableSpaceToUse = pt(this.horizontalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.x : availableSpace.x,
                                 this.  verticalLayoutMode === LayoutModes.ShrinkWrap ? this._cachedMinimumExtent.y : availableSpace.y);

    var availableSpaceToPassOn = availableSpaceToUse.addXY(0, -sPadding - sPadding);

    var extraForwardSpace = this.direction.forwardCoordinateOfPoint(availableSpaceToPassOn) - this.direction.forwardCoordinateOfPoint(this._cachedMinimumExtent);
    
    var allChildren = this.getThingies();
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
      var p = direction.point(forward, sPadding);
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

  rejiggerTheLayout: function() {
    if (this.rejiggerer.should_not_bother_yet()) {return;}

    this.eachThingy(function(m) {m.bounds();});

    var direction = this.direction;
    var sPadding  = this.sPadding;
    var fPadding  = this.fPadding;

    var maxSideways = direction.externallySpecifiedFreeSpaceSideways(this) || sPadding + sPadding;
    this.eachThingy(function(m) {
      var s = direction.sidewaysCoordinateOfPoint(m.getExtent()) + sPadding + sPadding;
      maxSideways = (maxSideways >= s) ? maxSideways : s;
    });

    var forward = fPadding;
    if (this.aaaDebugMe) { console.log("Starting off, forward: " + forward); }
    this.eachThingy(function(m) {
      //var f = direction.forwardDimensionOfRect(m.bounds()); // old way, gave me weird extra padding
      var f = direction.forwardCoordinateOfPoint(m.getExtent());
      if (this.aaaDebugMe) { console.log("f is: " + f + ", m.extent is " + m.getExtent()); }
      direction.specifyFreeSpaceSideways(m, maxSideways - sPadding - sPadding);
      var p = direction.point(forward, sPadding);
      m.setPosition(p);
      if (f != 0) {forward += f + fPadding;}
      if (this.aaaDebugMe) { console.log("Added " + m.inspect() + ", forward is now: " + forward); }
    }.bind(this));

    var newExtent = direction.point(forward, maxSideways);
    var shapeBounds = this.shape.bounds();
    if (! newExtent.eqPt(shapeBounds.extent())) {
      var b = shapeBounds.topLeft().addPt(this.origin).extent(newExtent.scaleBy(this.getScale()));
      this.setBounds(b);
      if (this.aaaDebugMe) { console.log("Setting bounds to " + b); }
    }
  },

  dontBotherRejiggeringTheLayoutUntilTheEndOf: function(f) {
    this.rejiggerer.dont_bother_until_the_end_of(f);
  },

     addThingy: function(m) {this.   addMorph(m); this.rejiggerTheLayout();},
  removeThingy: function(m) {this.removeMorph(m); this.rejiggerTheLayout();},

  addThingies: function(ms) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      for (var i = 0, n = ms.length; i < n; ++i) {
        this.addThingy(ms[i]);
      }
    }.bind(this));
  },

  replaceThingiesWith: function(ms) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      this.removeAllThingies();
      this.addThingies(ms);
    }.bind(this));
  },

  eachThingy: function(f) {
    $A(this.submorphs).each(function(m) {
      if (! m.shouldNotBePartOfRowOrColumn) {f(m);}
    });
  },

  getThingies: function() {
    return $A(this.submorphs).reject(function(m) {return m.shouldNotBePartOfRowOrColumn;});
  },

  removeAllThingies: function() {
    return this.removeThingies(this.getThingies());
  },

  removeThingies: function(ms) {
    ms.each(function(m) {this.removeMorph(m);}.bind(this));
    this.rejiggerTheLayout();
    return ms;
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
