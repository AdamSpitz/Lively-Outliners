lobby.transporter.module.create('test_case_morph', function(thisModule) {



thisModule.addSlots(modules.test_case_morph, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(TestCase.prototype, function(add) {
    
  add.method('newMorph', function() {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(TestCase.prototype.Morph, function(add) {

  add.data('superclass', RowMorph);

  add.creator('prototype', Object.create(RowMorph.prototype));

  add.data('type', 'TestCase.prototype.Morph');

});


thisModule.addSlots(TestCase.prototype.Morph.prototype, function(add) {

  add.data('constructor', TestCase.prototype.Morph);

  add.method('initialize', function ($super, testCase) {
    $super();
    this._testCase = testCase;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 3});
    this.setFill(defaultFillWithColor(Color.purple.darker()));
    this.shape.roundEdgesBy(10);

    this._nameLabel = createLabel(function() { return testCase.name(); });
    this._runButton = createButton('Run', this.runAll.bind(this), 2);

    this.setColumns([this._nameLabel, this._runButton, this.createDismissButton()]);
  }, {category: 'creating'});

  add.method('inspect', function () { return this._testCase.constructor.type; }, {category: ['printing']});

  add.method('runAll', function (evt) {
    var w = evt.hand.world();
    this._testCase.runAll();
    var result = this._testCase.result;
    result.testCase = this._testCase;
    w.morphFor(result).ensureIsInWorld(w, this.worldPoint(pt(this.getExtent().x + 50, 0)), true, true, true);
  }, {category: ['commands']});

});


thisModule.addSlots(TestResult.prototype, function(add) {
    
  add.method('newMorph', function() {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(TestResult.prototype.Morph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'TestResult.prototype.Morph');

});


thisModule.addSlots(TestResult.prototype.Morph.prototype, function(add) {

  add.data('constructor', TestResult.prototype.Morph);

  add.method('initialize', function ($super, testResult) {
    $super();
    this._testResult = testResult;
    this._testCase = testResult.testCase;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 2});
    this.setFill(defaultFillWithColor(this._testResult.failed.length > 0 ? Color.red : Color.green));
    this.shape.roundEdgesBy(10);

    this._nameLabel = createLabel(this._testCase.name());

    var rows = [this._nameLabel];
    testResult.failed.each(function(f) {rows.push(this.createFailureRow(f));}.bind(this));
    this.setRows(rows);
  }, {category: 'creating'});

  add.method('createFailureRow', function (failure) {
    return createSpaceFillingRow([createLabel(failure.selector + " failed: " + failure.err)]);
  }, {category: ['creating']});

  add.method('inspect', function () { return this._testCase.constructor.type; }, {category: ['printing']});

});



});


