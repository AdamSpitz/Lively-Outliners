ColumnMorph.subclass("SliceMorph", {
  initialize: function($super, searcher) {
    $super();
    this._searcher = searcher;

    this.setFill(defaultFillWithColor(Color.blue.lighter()));
    this.sPadding = this.fPadding = 5;
    this.shape.roundEdgesBy(10);

    this._slotsPanel = new ColumnMorph().beInvisible();
    this._slotsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;
    this._slotsPanel.inspect = function() {return "the slots panel";};

    this._expander = new ExpanderMorph(this);
    this.titleLabel = createLabel(function() {return searcher.inspect();});
    this.redoButton = createButton("Redo", function(evt) { this.redo(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this.createHeaderRow();
  },

  searcher: function() { return this._searcher; },


  // header row

  createHeaderRow: function() {
    var r = this._headerRow = new RowMorph().beInvisible();
    this._headerRowSpacer = createSpacer();
    r.fPadding = 3;
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    r.replaceThingiesWith([this._expander, this.titleLabel, this._headerRowSpacer, this.dismissButton]);
    this.addRow(r);
    return r;
  },


  // updating

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.titleLabel.refreshText();
    this.minimumExtentChanged();
  },


  // inspecting
  inspect: function() {return this.searcher().inspect();},


  // expanding and collapsing

  expander: function() { return this._expander; },

  updateExpandedness: function() {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this.expander().isExpanded()) { thingies.push(this._slotsPanel); }
    this.replaceThingiesWith(thingies);
  },


  // searching

  redo: function() {
    var ss = this.searcher().go().sort(function(sp1, sp2) {var n1 = sp1.holder().name(); var n2 = sp2.holder().name(); n1 === n2 ? 0 : n1 < n2 ? -1 : 1});
    var sms = ss.map(function(s) { return new SlotMorph(s); }.bind(this));
    this._slotsPanel.replaceThingiesWith(sms);
    this.expander().expand();
  },
});
