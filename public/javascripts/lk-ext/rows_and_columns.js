Morph.subclass("RowOrColumnMorph", {
  initialize: function($super, d) {
    this.direction = d;
    this.sPadding = 10;
    this.fPadding = 10;
    this.rejiggerer = new BatcherUpper(this.rejiggerTheLayout.bind(this));
    $super(new lively.scene.Rectangle(pt(0, 0).extent(pt(10, 10))));
    return this;
  },

  rejiggerTheLayout: function() {
    if (this.rejiggerer.should_not_bother_yet()) {return;}

    this.eachThingy(function(m) {m.bounds();});

    var direction = this.direction;
    var sPadding = this.sPadding;
    var fPadding = this.fPadding;

    var maxSideways = direction.externallySpecifiedFreeSpaceSideways(this) || sPadding + sPadding;
    this.eachThingy(function(m) {
      var s = direction.sidewaysDimensionOfRect(m.bounds()) + sPadding + sPadding;
      maxSideways = (maxSideways >= s) ? maxSideways : s;
    });

    var name = this.name;
    var forward = fPadding;
    this.eachThingy(function(m) {
      var f = direction.forwardDimensionOfRect(m.bounds());
      direction.specifyFreeSpaceSideways(m, maxSideways - sPadding - sPadding);
      var p = direction.point(forward, sPadding);
      m.setPosition(p);
      if (f != 0) {forward += f + fPadding;}
    }.bind(this));

    var newExtent = direction.point(forward, maxSideways);
    var shapeBounds = this.shape.bounds();
    if (! newExtent.eqPt(shapeBounds.extent())) {
      var b = shapeBounds.topLeft().addPt(this.origin).extent(newExtent.scaleBy(this.getScale()));
      this.setBounds(b);
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
  },
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
  point: function(f, s) {return pt(s, f);}
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
  point: function(f, s) {return pt(f, s);}
};
