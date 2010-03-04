ColumnMorph.subclass("EvaluatorMorph", {
  initialize: function($super, outliner) {
    $super();
    this._outliner = outliner;
    
    this.setFill(Color.gray);
    this.beUngrabbable();

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
    
    var bp = this.buttonsPanel = new RowMorph().beInvisible();
    bp.replaceThingiesWith([createButton("Do it",  function(evt) {this. doIt(evt);}.bind(this)),
                            createButton("Get it", function(evt) {this.getIt(evt);}.bind(this)),
                            createButton("Close",  function(evt) {this.close(evt);}.bind(this))]);


    this.replaceThingiesWith([tm, bp]);
  },

   outliner: function() { return this._outliner;  },
  textMorph: function() { return this._textMorph; },

  runTheCode: function() {
    var __codeToRun__ = this.textMorph().getText();
    // run the code with "this" set to the outliner's object
    return (function() { return eval("(" + __codeToRun__ + ")"); }).call(this.outliner().mirror().reflectee());
  },

   doIt: function(evt) { MessageNotifierMorph.showIfErrorDuring(function() {                                      this.runTheCode()              ; }.bind(this), evt); },
  getIt: function(evt) { MessageNotifierMorph.showIfErrorDuring(function() { evt.hand.world().outlinerFor(reflect(this.runTheCode())).grabMe(evt); }.bind(this), evt); },

  close: function(evt) {
    var owner = this.owner;
    this.remove();
    owner.minimumExtentChanged();
  },
});
