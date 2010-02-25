ColumnMorph.subclass("ErrorMessageMorph", {
  initialize: function($super, msg) {
    $super();
    this.shape.roundEdgesBy(10);
    this._message = "" + msg;
    this.setFillToDefaultWithColor(Color.red);
    this.addThingy(createLabel("Error:"));
    this.addThingy(createLabel(this._message));
  },

  wasJustDroppedOnWorld: function(world) {
    this.zoomOuttaHereTimer = setInterval(function() {this.startZoomingOuttaHere();}.bind(this), 5000);
  },
});

Object.extend(ErrorMessageMorph, {
  showIfErrorDuring: function(f, evt) {
    try {
      return f();
    } catch (ex) {
      new this(ex).grabMe(evt);
    }
  },
});
