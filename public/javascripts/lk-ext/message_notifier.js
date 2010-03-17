ColumnMorph.subclass("MessageNotifierMorph", {
  initialize: function($super, msg, color) {
    $super();
    this.shape.roundEdgesBy(10);
    this._message = "" + msg;
    this.setFill(defaultFillWithColor(color || Color.red));
    this.setRows([createLabel(this._message)]);
  },

  wasJustDroppedOnWorld: function(world) {
    this.zoomOuttaHereTimer = setInterval(function() {this.startZoomingOuttaHere();}.bind(this), 5000);
  }
});

Object.extend(MessageNotifierMorph, {
  showIfErrorDuring: function(f, evt) {
    try {
      return f();
    } catch (ex) {
      new this(ex, Color.red).grabMe(evt);
    }
  }
});
