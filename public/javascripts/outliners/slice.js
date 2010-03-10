lobby.transporter.module.create('slice', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('SliceMorph', function SliceMorph() { Class.initializer.apply(this, arguments); }, {category: ['outliners']});

});


thisModule.addSlots(SliceMorph, function(add) {

  add.data('superclass', ColumnMorph);

  add.creator('prototype', Object.create(ColumnMorph.prototype));

  add.data('type', SliceMorph);

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
    this._slotsPanel.inspect = function() {return "the slots panel";};

    this._expander = new ExpanderMorph(this);
    this.titleLabel = createLabel(function() {return searcher.inspect();});
    this.redoButton = createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this.createHeaderRow();
  });

  add.method('searcher', function () { return this._searcher; });

  add.method('createHeaderRow', function () {
    var r = this._headerRow = new RowMorph().beInvisible();
    this._headerRowSpacer = createSpacer();
    r.setPadding({top: 0, bottom: 0, left: 3, right: 3, between: 3});
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    // aaa - redo doesn't work yet because we don't unmark the objects after we're done
    r.replaceThingiesWith([this._expander, this.titleLabel, this._headerRowSpacer, /* this.redoButton, */ this.dismissButton]); 
    this.addRow(r);
    return r;
  });

  add.method('updateAppearance', function () {
    if (! this.world()) {return;}
    this.titleLabel.refreshText();
    this.minimumExtentChanged();
  });

  add.method('inspect', function () {return this.searcher().inspect();});

  add.method('expander', function () { return this._expander; });

  add.method('updateExpandedness', function () {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this._slotsPanel); }
    this.replaceThingiesWith(thingies);
  });

  add.method('redo', function () {
    var ss = this.searcher().go().sort(function(sp1, sp2) {var n1 = sp1.holder().name(); var n2 = sp2.holder().name(); n1 === n2 ? 0 : n1 < n2 ? -1 : 1});
    var sms = ss.map(function(s) { return this.createRowForSlot(s); }.bind(this));
    this._slotsPanel.replaceThingiesWith(sms);
    this.expander().expand();
  });

  add.method('createRowForSlot', function (s) {
    var r = new RowMorph().beInvisible();
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.setPadding({top: 0, bottom: 0, left: 3, right: 3, between: 3});
    var inSituButton = createButton("in situ", function() { this.showInSitu(s, inSituButton); }.bind(this), 2);
    var ms = [createLabel(s.holder().name()), createSpacer(), new SlotMorph(s), inSituButton];
    r.replaceThingiesWith(ms);
    return r;
  });

  add.method('showInSitu', function (s, inSituButton) {
    var w = this.world();
    w.outlinerFor(s.holder()).ensureIsInWorld(w, inSituButton.worldPoint(pt(150,0)), true);
  });

});


});
