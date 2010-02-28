ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, m) {
    $super();
    this._mirror = m;

    this.rejiggerer = new BatcherUpper(this.rejiggerTheLayoutIncludingSubmorphs.bind(this));

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

    this.evaluatorButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.purple);
    this.evaluatorButton.relayToModel(this, {HelpText: "-EvaluatorHelp", Trigger: "=openEvaluator"});

    this.dismissButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.yellow);
    this.dismissButton.relayToModel(this, {HelpText: "-DismissHelp", Trigger: "=ensureIsNotInWorld"});

    this.create_header_row();
    this.addRow(this._evaluatorsPanel);
    this.rejiggerTheLayoutIncludingSubmorphs();
  },

  mirror: function() { return this._mirror; },

  create_header_row: function() {
    var r = this._headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    r.fPadding = 3;
    this._headerRow.horizontalLayoutMode = LayoutModes.SpaceFill;
    this._headerRow.inspect = function() {return "the header row";};
    r.replaceThingiesWith([this._expander, this.titleLabel, createSpacer(), this.evaluatorButton, this.dismissButton]);
    this.addRow(r);
    return r;
  },


  // rejiggering the layout

  makingManyChangesDuring: function(f) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(f);
  },

  dontBotherRejiggeringTheLayoutUntilTheEndOf: function(f) {
    this.rejiggerer.dont_bother_until_the_end_of(f);
  },

  rejiggerTheLayoutIncludingSubmorphs: function() {
    if (this.rejiggerer.should_not_bother_yet()) {return;}
    this.minimumExtent();
    this.new_rejiggerTheLayout(pt(100000, 100000));
  },


  // updating    // aaa - now, can I make this happen automatically? maybe an update process?

  updateAppearance: function() {
    this.populateSlotsPanel();
    if (! this.world()) {return;}
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this.rejiggerTheLayoutIncludingSubmorphs();
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
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var isExpanded = this.expander().isExpanded();
      if (isExpanded && !this.wasAlreadyExpanded) {
        this.populateSlotsPanel();
        this.replaceThingiesWith([this._headerRow, this._slotsPanel, this._evaluatorsPanel]);
      } else if (!isExpanded && this.wasAlreadyExpanded) {
        this.replaceThingiesWith([this._headerRow, this._evaluatorsPanel]);
      }
      this.wasAlreadyExpanded = isExpanded;
      this.rejiggerTheLayoutIncludingSubmorphs();
    }.bind(this));
  },


  // slot panels

  slotPanels: function() {
    if (! this._slotPanels) { this._slotPanels = new BloodyHashTable(); }
    return this._slotPanels;
  },

  slotPanelFor: function(s) {
    return this.slotPanels().getOrIfAbsentPut(s.name(), function() { return new SlotMorph(s); });
  },

  populateSlotsPanel: function() {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var op = this._slotsPanel;
      var sps = [];
      this.mirror().eachSlot(function(s) { sps.push(this.slotPanelFor(s)); }.bind(this));
      sps.sort(function(sp1, sp2) {return sp1.slot().name() < sp2.slot().name() ? -1 : 1});
      op.replaceThingiesWith(sps);
      this.rejiggerTheLayoutIncludingSubmorphs();
    }.bind(this));
  },


  // evaluators

  openEvaluator: function(evt) {
    var e = new EvaluatorMorph(this);
    this._evaluatorsPanel.addRow(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  },

  getEvaluatorHelp: function() {return "Open an evaluator";}, // aaa - I don't think this works but I don't know why.


  // adding and removing to/from the world

  ensureIsInWorld: function(w, p) {
    this.stopZoomingOuttaHere();
    var shallBeAdded = this.world() == null;
    if (shallBeAdded) {
      if (p) {
        w.addMorphAt(this, p);
      } else {
        w.addMorph(this);
      }
    }
    return shallBeAdded;
  },

  ensureIsNotInWorld: function() {
    var shallBeRemoved = this.world() != null;
    if (shallBeRemoved) {this.startZoomingOuttaHere();}
    return shallBeRemoved;
  },

  destinationForZoomingOuttaHere: function() { return WorldMorph.current().dock; },

  getDismissHelp: function() {return "Hide";}, // aaa - I don't think this works but I don't know why.


  // menu

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    if (this.mirror().canHaveSlots()) {
      menu.addSection([["add slot",     function(evt) { this.    addSlot(evt); }.bind(this)]]);
    }
    if (this.mirror().canHaveChildren()) {
      menu.addSection([["create child", function(evt) { this.createChild(evt); }.bind(this)]]);
    }
    return menu;
  },

  addSlot: function(evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    this.updateAppearance();
    this.expander().expand();
    this.slotPanelFor(this.mirror().slotAt(name)).labelMorph.beWritableAndSelectAll();
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
    if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
      this.highlighter().setChecked(true);
    }
  },

  onMouseOut: function(evt) {
    this.highlighter().setChecked(false);
  },

  handlesMouseDown: function(evt) { return true; },

  onMouseDown: function(evt) {
    if (evt.isRightMouseButton()) {
      this.showMorphMenu(evt);
      return true;
    }
    return false;
  },
});
Object.extend(OutlinerMorph.prototype, CanHaveArrowsAttachedToIt);
