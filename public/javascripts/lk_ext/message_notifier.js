lobby.transporter.module.create('message_notifier', function(requires) {

requires('lk_ext', 'rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(modules.message_notifier, function(add) {
    
  add.data('_directory', 'lk_ext');

});


thisModule.addSlots(lobby, function(add) {

  add.method('MessageNotifierMorph', function MessageNotifierMorph() { Class.initializer.apply(this, arguments); }, {category: ['ui']});

});


thisModule.addSlots(MessageNotifierMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'MessageNotifierMorph');

  add.method('showIfErrorDuring', function(f, evt, color) {
    try {
      return f();
    } catch (ex) {
      new this(ex, color || Color.red).grabMe(evt);
    }
  });

});


thisModule.addSlots(MessageNotifierMorph.prototype, function(add) {

  add.data('constructor', MessageNotifierMorph);

  add.method('initialize', function($super, msg, color) {
    $super();
    this.shape.roundEdgesBy(10);
    this._message = msg.toString();
    this.setFill(defaultFillWithColor(color || Color.red));
    this.setRows([createLabel(this._message)]);
  });

  add.method('wasJustDroppedOnWorld', function(world) {
    this.zoomAwayAfter(5000);
  });

  add.method('zoomAwayAfter', function(ms) {
    this.zoomOuttaHereTimer = setInterval(function() {this.startZoomingOuttaHere();}.bind(this), ms || 5000);
  });

  add.method('showInCenterOfWorld', function(w) {
    this.showInWorldAt(w, w.getExtent().scaleBy(0.5).subPt(this.getExtent().scaleBy(0.5)));
  });

  add.method('showInWorldAt', function(w, p) {
    this.ensureIsInWorld(w, p, true, false, true, function() {this.zoomAwayAfter(5000);}.bind(this));
  });

});


});
