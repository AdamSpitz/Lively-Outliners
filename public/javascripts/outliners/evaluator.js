ColumnMorph.subclass("EvaluatorMorph", {
  initialize: function($super, outliner) {
    $super();
    this._outliner = outliner;
    
    var tm = this._textMorph = createTextField();
    tm.setExtent(pt(150,60));
    this.addThingy(tm);
    
    var bp = this.buttonsPanel = new RowMorph().beInvisible();
    bp.addThingy(createButton("Do it",  function(evt) {this.  doIt(evt);}.bind(this)));
    bp.addThingy(createButton("Get it", function(evt) {this. getIt(evt);}.bind(this)));
    bp.addThingy(createButton("Close",  function(evt) {this.remove(   );}.bind(this)));
    this.addThingy(bp);

    this.setFill(Color.gray);
    this.beUngrabbable();
  },

  outliner: function() { return this._outliner; },
  textMorph: function() { return this._textMorph; },

  runTheCode: function() {
    // aaa - How does LK do this? Maybe new Function()?
    EvaluatorMorph.__aaa_hack_evaluator_receiver__ = this.outliner().mirror().reflectee();
    return eval("var self = EvaluatorMorph.__aaa_hack_evaluator_receiver__; " + this.textMorph().getText());
  },

   doIt: function(evt) { ErrorMessageMorph.showIfErrorDuring(function() {                                         this.runTheCode()              ; }.bind(this), evt); },
  getIt: function(evt) { ErrorMessageMorph.showIfErrorDuring(function() { evt.hand.world().outlinerFor(new Mirror(this.runTheCode())).grabMe(evt); }.bind(this), evt); },
});
