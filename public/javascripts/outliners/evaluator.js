ColumnMorph.subclass("EvaluatorMorph", {
  initialize: function($super, outliner) {
    $super();
    this._outliner = outliner;
    
    var tm = this._textMorph = createTextField();
    tm.setExtent(pt(150,60));
    var thisEvaluator = this;
    tm.onKeyPress = function(evt) {
      if (evt.getKeyCode() == Event.KEY_RETURN && (evt.isMetaDown() || evt.isCtrlDown())) {
        thisEvaluator.getIt(evt);
        evt.stop();
        return;
      }
      return TextMorph.prototype.onKeyPress.call(this, evt);
    };
    this.addRow(tm);
    
    var bp = this.buttonsPanel = new RowMorph().beInvisible();
    bp.addThingy(createButton("Do it",  function(evt) {this. doIt(evt);}.bind(this)));
    bp.addThingy(createButton("Get it", function(evt) {this.getIt(evt);}.bind(this)));
    bp.addThingy(createButton("Close",  function(evt) {this.close(evt);}.bind(this)));
    this.addRow(bp);

    this.setFill(Color.gray);
    this.beUngrabbable();
  },

  outliner: function() { return this._outliner; },
  textMorph: function() { return this._textMorph; },

  runTheCode: function() {
    var __codeToRun__ = this.textMorph().getText();
    var __result__;
    (function() { __result__ = eval("(" + __codeToRun__ + ")"); }).call(this.outliner().mirror().reflectee());
    return __result__;
  },

   doIt: function(evt) { MessageNotifierMorph.showIfErrorDuring(function() {                                         this.runTheCode()              ; }.bind(this), evt); },
  getIt: function(evt) { MessageNotifierMorph.showIfErrorDuring(function() { evt.hand.world().outlinerFor(reflect(this.runTheCode())).grabMe(evt); }.bind(this), evt); },

  close: function(evt) {
    var owner = this.owner;
    this.remove();
    owner.minimumExtentChanged();
  },
});
