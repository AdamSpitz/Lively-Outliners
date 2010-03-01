ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, m) {
    $super();
    this._mirror = m;

    this.sPadding = this.fPadding = 5;
    this.shape.roundEdgesBy(10);

    this.     _slotsPanel = new ColumnMorph().beInvisible();
    this._evaluatorsPanel = new ColumnMorph().beInvisible();
    this.     _slotsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;
    this._evaluatorsPanel.horizontalLayoutMode = LayoutModes.SpaceFill;
    this.     _slotsPanel.inspect = function() {return "the slots panel";};
    this._evaluatorsPanel.inspect = function() {return "the evaluators panel";};

    this._highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);
    this.titleLabel = createLabel(function() {return m.inspect();});
    this.commentButton = createButton("'...'", function(evt) { this.toggleComment(evt); }.bind(this), 1);
    this.evaluatorButton = createButton("E", function(evt) { this.openEvaluator(evt); }.bind(this), 1);
    this.dismissButton = this.createDismissButton();

    this.createHeaderRow();
    this.addRow(this._evaluatorsPanel);

    this.populateSlotsPanel();
  },

  mirror: function() { return this._mirror; },


  // header row

  createHeaderRow: function() {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    this._headerRowSpacer = createSpacer();
    r.fPadding = 3;
    r.horizontalLayoutMode = LayoutModes.SpaceFill;
    r.inspect = function() {return "the header row";};
    r.refreshContent = function() { this.refreshHeaderRow(); };
    this.refreshHeaderRow();
    this.addRow(r);
    return r;
  },

  refreshHeaderRow: function() {
    var ms = [this._expander, this.titleLabel];
    if (this._shouldShowComment || (this.mirror().comment && this.mirror().comment())) { ms.push(this.commentButton); }
    ms.push(this._headerRowSpacer);
    ms.push(this.evaluatorButton);
    ms.push(this.dismissButton);
    this._headerRow.replaceThingiesWith(ms);
  },


  // updating    // aaa - now, can I make this happen automatically? maybe an update process?

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.populateSlotsPanel();
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this._headerRow.refreshContent();
    this.minimumExtentChanged();
  },


  // inspecting
  inspect: function() {return this.mirror().inspect();},


  // color

  calculateAppropriateFill: function() {
    var color = Color.neutral.gray.lighter();
    if (this.highlighter().isChecked()) {color = color.lighter().lighter();}
    return defaultFillWithColor(color);
  },

  refillWithAppropriateColor: function() {
    this.setFill(this.calculateAppropriateFill());
  },

  highlighter: function() { return this._highlighter; },


  // expanding and collapsing

  expander: function() { return this._expander; },

  updateExpandedness: function() {
    if (! this.world()) {return;}
    var thingies = [this._headerRow];
    if (this._shouldShowComment) { thingies.push(this.commentMorph()); }
    if (this.expander().isExpanded()) { thingies.push(this._slotsPanel); }
    thingies.push(this._evaluatorsPanel);
    this.replaceThingiesWith(thingies);
  },


  // slots

  slotMorphs: function() {
    if (! this._slotMorphs) { this._slotMorphs = new BloodyHashTable(); }
    return this._slotMorphs;
  },

  slotMorphFor: function(s) {
    return this.slotMorphs().getOrIfAbsentPut(s.name(), function() { return new SlotMorph(s); });
  },

  populateSlotsPanel: function() {
    var sps = [];
    this.mirror().eachSlot(function(s) { sps.push(this.slotMorphFor(s)); }.bind(this));
    sps.sort(function(sp1, sp2) {return sp1.slot().name() < sp2.slot().name() ? -1 : 1});
    this._slotsPanel.replaceThingiesWith(sps);
  },

  
  // comments
   
  commentMorph: function() {
    var m = this._commentMorph;
    if (m) { return m; }
    m = this._commentMorph = new TextMorphRequiringExplicitAcceptance(pt(5, 10).extent(pt(140, 80)), "");
    m.nameOfEditCommand = "edit comment";
    m.extraMenuItemAdders = [function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this)];
    m.closeDnD();
    m.setFill(null);
    var thisOutliner = this;
    m.getSavedText = function() { return thisOutliner.mirror().comment(); };
    m.setSavedText = function(text) { if (text !== this.getSavedText()) { thisOutliner.mirror().setComment(text); } };
    m.refreshText();
    return m;
  },

  toggleComment: function(evt) {
    this._shouldShowComment = !this._shouldShowComment;
    this.updateExpandedness();
    this.updateAppearance();
    if (this._shouldShowComment) { evt.hand.setKeyboardFocus(this.commentMorph()); }
  },


  // evaluators

  openEvaluator: function(evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  },


  // menu

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    if (this.mirror().canHaveSlots()) {
      menu.addSection([["add slot",     function(evt) { this.    addSlot(evt); }.bind(this)]]);
    }
    if (this.mirror().canHaveChildren()) {
      menu.addSection([["create child", function(evt) { this.createChild(evt); }.bind(this)]]);
    }
    
    menu.addLine();

    if (this.mirror().comment) {
      menu.addItem([this._shouldShowComment ? "hide comment" : "show comment", function(evt) { this.toggleComment(evt); }.bind(this)]);
    }

    menu.addLine();

    menu.addItem(["well-known references", function(evt) {
      evt.hand.world().outlinerFor(reflect(this.mirror().wellKnownReferences())).grabMe(evt);
    }.bind(this)]);
    
    menu.addItem(["well-known children", function(evt) {
      evt.hand.world().outlinerFor(reflect(this.mirror().wellKnownChildren())).grabMe(evt);
    }.bind(this)]);

    return menu;
  },

  addSlot: function(evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    this.updateAppearance();
    this.expander().expand();
    var sm = this.slotMorphFor(this.mirror().slotAt(name));
    sm.toggleSource();
    sm.labelMorph.beWritableAndSelectAll();
  },

  createChild: function(evt) {
    this.world().outlinerFor(this.mirror().createChild()).grabMe(evt);
  },


  // mouse events

  acceptsDropping: function(m) { // aaa - could this be generalized?
    return typeof(m.wasJustDroppedOnOutliner) === 'function';
  },

  justReceivedDrop: function(m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnOutliner(this);
    }
  },

  onMouseOver: function(evt) {
      //if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
    if (evt.hand.submorphs.find(function(m) {return this.acceptsDropping(m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  },

  onMouseOut: function(evt) {
    this.highlighter().setChecked(false);
  },
});
Object.extend(OutlinerMorph.prototype, CanHaveArrowsAttachedToIt);
