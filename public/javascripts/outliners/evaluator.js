lobby.transporter.module.create('evaluator', function(thisModule) {


thisModule.addSlots(modules.evaluator, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(lobby, function(add) {

  add.method('EvaluatorMorph', function EvaluatorMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(EvaluatorMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', EvaluatorMorph);

});


thisModule.addSlots(EvaluatorMorph.prototype, function(add) {

  add.data('constructor', EvaluatorMorph);

  add.method('initialize', function ($super, outliner) {
    $super();
    this._outliner = outliner;
    
    this.setFill(null);
    this.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.ignoreEvents(); // so we can drag through it, since it doesn't need a menu

    var tm = this._textMorph = createTextField();
    tm.setExtent(pt(150,60));
    // tm.horizontalLayoutMode = LayoutModes.SpaceFill; // doesn't work yet
    tm.setFontFamily('monospace');
    var thisEvaluator = this;
    tm.onKeyPress = function(evt) {
      if (evt.getKeyCode() == Event.KEY_RETURN && (evt.isMetaDown() || evt.isCtrlDown())) {
        thisEvaluator.getIt(evt);
        evt.stop();
        return;
      }
      return TextMorph.prototype.onKeyPress.call(this, evt);
    };
    
    var buttons = [createButton("Do it",  function(evt) {this. doIt(evt);}.bind(this)),
                   createButton("Get it", function(evt) {this.getIt(evt);}.bind(this)),
                   createButton("Close",  function(evt) {this.remove(  );}.bind(this))];

    this.setRows([createSpaceFillingRow([tm]), createSpaceFillingRow(buttons)]);
  }, {category: ['creating']});

  add.method('outliner', function () { return this._outliner;  }, {category: ['accessing']});

  add.method('wasJustShown', function (evt) { this._textMorph.wasJustShown(evt); }, {category: ['events']});

  add.method('runTheCode', function () {
    var __codeToRun__ = this._textMorph.getText();
    // run the code with "this" set to the outliner's object
    return (function() { return eval("(" + __codeToRun__ + ")"); }).call(this.outliner().mirror().reflectee());
  }, {category: ['running the code']});

  add.method('doIt', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() { this.runTheCode(); }.bind(this), evt);
  }, {category: ['running the code']});

  add.method('getIt', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() {
      var resultOutliner = evt.hand.world().outlinerFor(reflect(this.runTheCode()));
      if (resultOutliner === this.outliner()) {
        resultOutliner.wiggle();
      } else {
        resultOutliner.grabMe(evt);
      }
    }.bind(this), evt);
  }, {category: ['running the code']});

});


});
