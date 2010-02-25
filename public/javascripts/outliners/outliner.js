ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, m) {
    $super();
    this._mirror = m;

    this.sPadding = this.fPadding = 5;
    this.shape.roundEdgesBy(10);

    this._highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this._highlighter.setChecked(false);

    this._expander = new ExpanderMorph(this);

    this.titleLabel = createLabel("");
    this.titleLabel.getRefreshedText = function() {return m.inspect();};

    //this.evaluatorButton = createButton("E", function(evt) {this.openEvaluator(evt);}.bind(this), 0);

    this.evaluatorButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.purple);
    this.evaluatorButton.relayToModel(this, {HelpText: "-EvaluatorHelp", Trigger: "=openEvaluator"});

    this.dismissButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.yellow);
    this.dismissButton.relayToModel(this, {HelpText: "-DismissHelp", Trigger: "=removeFromWorld"});

    this.create_header_row();
    this.rejiggerTheLayout();
  },

  mirror: function() { return this._mirror; },

  // Optimization: create the panels lazily. Most will never be needed, and it's bad to make the user wait while we create dozens of them up front.
  // aaa: Can I create a general lazy thingamajig mechanism?
  get_slots_panel:      function() { return this.     slots_panel || (this.     slots_panel = new ColumnMorph().beInvisible()); },
  get_evaluators_panel: function() { return this.evaluators_panel || (this.evaluators_panel = new ColumnMorph().beInvisible()); },

  create_header_row: function() {
    var r = this.headerRow = new RowMorph().beInvisible(); // aaa - put underscores in front of the instvars
    r.fPadding = 3;
    this.titleLabel.refreshText();
    r.replaceThingiesWith([this._expander, this.titleLabel, this.evaluatorButton, this.dismissButton]);
    this.addRow(r);
    return r;
  },


  // rejiggering the layout

  makingManyChangesDuring: function(f) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(f);
  },

  repositionStuff: function() { // aaa - can I have a well-known method name for this, too? and maybe find a way to generalize it, so this method can live up in RowOrColumnMorph?
    var op = this.slots_panel;
    if (op) {
      op.rejiggerTheLayout();
    }
    this.rejiggerTheLayout();
  },

  repositionStuffIncludingTheHeaderRow: function() { // aaa ditto
    var hr = this.headerRow;
    if (hr) {hr.rejiggerTheLayout();}
    this.repositionStuff();
  },


  // updating    // aaa - maybe make a standard method name ("updateAppearance" or something) for all this updating stuff

  updateEverything: function() {
    this.populateSlotsPanel();
    if (! this.world()) {return;}
    this.refillWithAppropriateColor();
    this.titleLabel.refreshText();
    this.rejiggerTheLayout();
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
        this.replaceThingiesWith([this.headerRow, this.get_slots_panel()]);
      } else if (!isExpanded && this.wasAlreadyExpanded) {
        this.replaceThingiesWith([this.headerRow]);
      }
      this.wasAlreadyExpanded = isExpanded;
      this.repositionStuff();
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
    var op = this.get_slots_panel();
    op.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var sps = [];
      this.mirror().eachSlot(function(s) { sps.push(this.slotPanelFor(s)); }.bind(this));
      sps.sort(function(sp1, sp2) {return sp1.slot().name() < sp2.slot().name() ? -1 : 1});
      op.replaceThingiesWith(sps);
      this.rejiggerTheLayout();
    }.bind(this));
  },


  // evaluators

  openEvaluator: function(evt) {
    var e = new EvaluatorMorph(this);
    this.addThingy(e);
    evt.hand.setKeyboardFocus(e.textMorph());
  },

  getEvaluatorHelp: function() {return "Open an evaluator";}, // aaa - I don't think this works but I don't know why.


  // adding and removing to/from the world

  ensureIsInWorld: function(p) {
    this.stopZoomingOuttaHere();
    var shallBeAdded = this.world() == null;
    if (shallBeAdded) {this.addToWorld(p);}
    return shallBeAdded;
  },

  ensureIsNotInWorld: function() {
    var shallBeRemoved = this.world() != null;
    if (shallBeRemoved) {this.removeFromWorld();}
    return shallBeRemoved;
  },

  addToWorld: function(p) {
    if (p) {
      WorldMorph.current().addMorphAt(this, p);
    } else {
      WorldMorph.current().addMorph(this);
    }
  },

  removeFromWorld: function() {
    this.startZoomingOuttaHere();
  },

  destinationForZoomingOuttaHere: function() { return WorldMorph.current().dock; },

  getDismissHelp: function() {return "Hide";}, // aaa - I don't think this works but I don't know why.


  // menu

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addSection([["add slot",     function(evt) { this.    addSlot(evt); }.bind(this)]]);
    menu.addSection([["create child", function(evt) { this.createChild(evt); }.bind(this)]]);
    return menu;
  },

  addSlot: function(evt) {
    var name = this.mirror().findUnusedSlotName("slot");
    this.mirror().reflectee()[name] = null;
    this.updateEverything();
    this.expander().expand();
    this.slotPanelFor(this.mirror().slotAt(name)).labelMorph.beWritableAndSelectAll();
  },

  createChild: function(evt) {
    this.world().outlinerFor(this.mirror().createChild()).grabMe(evt);
  },


  // mouse events

  acceptsDropping: function(m) { // aaa - could this be generalized?
    return m.canBeDroppedOnOutliner;
  },

  justReceivedDrop: function(m) {
    m.wasJustDroppedOnOutliner(this);
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
