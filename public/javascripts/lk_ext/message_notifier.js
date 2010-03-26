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

  add.method('showIfErrorDuring', function(f, evt) {
    try {
      return f();
    } catch (ex) {
      new this(ex, Color.red).grabMe(evt);
    }
  });

});


thisModule.addSlots(MessageNotifierMorph.prototype, function(add) {

  add.data('constructor', MessageNotifierMorph);

  add.method('initialize', function($super, msg, color) {
    $super();
    this.shape.roundEdgesBy(10);
    this._message = "" + msg;
    this.setFill(defaultFillWithColor(color || Color.red));
    this.setRows([createLabel(this._message)]);
  });

  add.method('wasJustDroppedOnWorld', function(world) {
    this.zoomOuttaHereTimer = setInterval(function() {this.startZoomingOuttaHere();}.bind(this), 5000);
  });

});


});
