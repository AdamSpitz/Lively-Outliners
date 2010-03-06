lobby.transporter.module.create('evaluator', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('EvaluatorMorph', function EvaluatorMorph() { Class.initializer.apply(this, arguments); }, {category: ['E']}, {});

});


thisModule.addSlots(EvaluatorMorph, function(add) {

  add.data('superclass', ColumnMorph, {});

  add.creator('prototype', Object.create(ColumnMorph.prototype), {}, {});

  add.data('type', EvaluatorMorph, {});

});


thisModule.addSlots(EvaluatorMorph.prototype, function(add) {

  add.data('constructor', EvaluatorMorph, {});

  add.method('initialize', function ($super, outliner) {
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
  }, {}, {});

  add.method('outliner', function () { return this._outliner;  }, {}, {});

  add.method('textMorph', function () { return this._textMorph; }, {}, {});

  add.method('runTheCode', function () {
    var __codeToRun__ = this.textMorph().getText();
    // run the code with "this" set to the outliner's object
    return (function() { return eval("(" + __codeToRun__ + ")"); }).call(this.outliner().mirror().reflectee());
  }, {}, {});

  add.method('doIt', function (evt) { MessageNotifierMorph.showIfErrorDuring(function() {                                      this.runTheCode()              ; }.bind(this), evt); }, {}, {});

  add.method('getIt', function (evt) { MessageNotifierMorph.showIfErrorDuring(function() { evt.hand.world().outlinerFor(reflect(this.runTheCode())).grabMe(evt); }.bind(this), evt); }, {}, {});

  add.method('close', function (evt) {
    var owner = this.owner;
    this.remove();
    owner.minimumExtentChanged();
  }, {}, {});

});


});