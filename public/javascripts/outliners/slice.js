lobby.transporter.module.create('slice', function(requires) {

requires('lk_ext', 'rows_and_columns');

}, function(thisModule) {


thisModule.addSlots(modules.slice, function(add) {
    
    add.data('_directory', 'outliners');

});


thisModule.addSlots(lobby, function(add) {

  add.method('SliceMorph', function SliceMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(SliceMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', 'SliceMorph');

});


thisModule.addSlots(SliceMorph.prototype, function(add) {

  add.data('constructor', SliceMorph);

  add.method('initialize', function ($super, searcher) {
    $super();
    this._searcher = searcher;

    this.setFill(defaultFillWithColor(Color.blue.lighter()));
    this.setPadding(5);
    this.shape.roundEdgesBy(10);

    this._slotsPanel = new ColumnMorph().beInvisible();
    this._slotsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;

    this._expander = new ExpanderMorph(this);
    this.titleLabel = createLabel(function() {return searcher.inspect();});
    this.redoButton = createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    // aaa - redo doesn't work yet because we don't unmark the objects after we're done
    this._headerRow = createSpaceFillingRow([this._expander, this.titleLabel, createSpacer(), /* this.redoButton, */ this.dismissButton],
                                            {top: 0, bottom: 0, left: 3, right: 3, between: 3});

    this.setPotentialContent([this._headerRow, createOptionalMorph(this._slotsPanel, function() {return this.expander().isExpanded();}.bind(this))]);
    this.refreshContent();
  });

  add.method('searcher', function () { return this._searcher; });

  add.method('updateAppearance', function () {
    if (! this.world()) {return;}
    this.titleLabel.refreshText();
    this.minimumExtentChanged();
  });

  add.method('inspect', function () {return this.searcher().inspect();});

  add.method('expander', function () { return this._expander; }, {category: ['expanding and collapsing']});

  add.method('expand', function () {
    this.expander().expand();
  }, {category: ['expanding and collapsing']});

  add.method('collapse', function () {
    this.expander().collapse();
  }, {category: ['expanding and collapsing']});

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    this.refreshContentOfMeAndSubmorphs();
  });

  add.method('redo', function () {
    var ss = this.searcher().go().sort(function(sp1, sp2) {var n1 = sp1.holder().name(); var n2 = sp2.holder().name(); return n1 === n2 ? 0 : n1 < n2 ? -1 : 1;});
    var sms = ss.map(function(s) { return this.createRowForSlot(s); }.bind(this));
    this._slotsPanel.setRows(sms);
    this.expander().expand();
  });

  add.method('createRowForSlot', function (s) {
    var inSituButton = createButton("in situ", function() { this.showInSitu(s, inSituButton); }.bind(this), 2);
    return createSpaceFillingRow([createLabel(s.holder().name()), createSpacer(), new SlotMorph(s), inSituButton],
                                 {top: 0, bottom: 0, left: 3, right: 3, between: 3});
  });

  add.method('showInSitu', function (s, inSituButton) {
    var w = this.world();
    w.morphFor(s.holder()).ensureIsInWorld(w, inSituButton.worldPoint(pt(150,0)), true, true, true);
  });

});


});
