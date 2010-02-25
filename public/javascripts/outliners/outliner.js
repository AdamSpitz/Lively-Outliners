// aaa - Go through all the methods that we're adding here to the "model" objects and see how
// many of them can be eliminated. For now I'm just trying to get this refactoring done as
// quick as possible so that Andrew can start using the model objects. -- Adam, Feb. 2009

ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, t) {
    this.topic = t;
    $super();

    this.highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this.beUnhighlighted();

    this.shape.roundEdgesBy(10);

    // this.closeDnD(); When this was uncommented, we couldn't drag arrows.

    this.expander = new ExpanderMorph(this);
    this.titleLabel = createLabel("");
    this.titleTopicRef = new TopicRef(this.topic, true, "Title");
    this.evaluatorButton = createButton("E", function() {this.openEvaluator();}.bind(this), 0);
    this.dismissButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.yellow);
    this.dismissButton.relayToModel(this, {HelpText: "-DismissHelp", Trigger: "=removeFromWorld"});
    this.create_header_row();
  },

  suppressHandles: true,
  okToDuplicate: Functions.False,
  
  mirror: function() {return this.topic;},

  // Optimization: create the panels lazily. Most will never be needed, and it's bad to make the user wait while we create dozens of them up front.
  // aaa: Can I create a general lazy thingamajig mechanism?
  get_slots_panel: function() { return this.slots_panel || (this.slots_panel = this.create_slots_panel()); },

  create_slots_panel: function() {
    var p = createLabelledPanel("Slots", "This object's slots");
    p.beInvisible();
    return p;
  },

  create_header_row: function() {
    var r = new RowMorph().beInvisible();
    r.fPadding = 10;
    r.closeDnD();
    r.ignoreEvents();
    r.inspect = function() {return "header row for " + this.titleTopicRef.displayName();}.bind(this);
    this.headerRow = r;
    this.updateHeader();
    this.addRow(r);
    return r;
  },


  // rejiggering the layout

  makingManyChangesDuring: function(f) {
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      this.makingManyChangesToOpinionDuring(this.topic.get__current_users_opinion(), function() {
        this.makingManyChangesToOpinionDuring(this.topic.get__collective_opinion(), f);
      }.bind(this));
    }.bind(this));
  },

  makingManyChangesToOpinionDuring: function(o, f) {
    if (o) {
      o.makingManyChangesDuring(f);
    } else {
      f();
    }
  },

  repositionStuff: function() {
    var ip = this.interest_panel;
    if (ip) {
      ip.labelledMorph.rejiggerTheLayout();
      ip.rejiggerTheLayout();
    }
    var op = this.slots_panel;
    if (op) {
      op.labelledMorph.rejiggerTheLayout();
      op.rejiggerTheLayout();
    }
    this.rejiggerTheLayout();
  },

  repositionStuffIncludingTheHeaderRow: function() {
    var hr = this.headerRow;
    if (hr) {hr.rejiggerTheLayout();}
    this.repositionStuff();
  },


  // updating

  updateEverything: function() {
    this.populateSlotsPanel();
    this.updateAppearance();
  },

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.refillWithAppropriateColor();
    this.updateHeader();
  },

  updateHeader: function() {
    if (!this.headerRow) {return;} // not initialized yet
    this.sPadding = this.fPadding = 5;
    this.updateTitle();
    this.headerRow.replaceThingiesWith([this.expander, this.titleLabel, this.evaluatorButton, this.dismissButton]);
    this.rejiggerTheLayout();
  },

  updateTitle: function() {
    this.titleLabel.setText(this.inspect());
  },


  // inspecting
  inspect: function() {return this.topic.inspect();},


  // color

  calculateAppropriateColor: function() {
    var color = overlays.inject(Color.neutral.gray.lighter(), function(c, overlay) {return overlay.adjustColorOfTopic(this.topic, c);}.bind(this));
    if (this.isHighlighted()) {color = color.lighter().lighter();}
    return color;
  },

  refillWithAppropriateColor: function() {
    this.setFillToDefaultWithColor(this.calculateAppropriateColor());
  },

  beUnhighlighted: function() {        this.highlighter.setChecked(false); },
  beHighlighted:   function() {        this.highlighter.setChecked(true ); },
  isHighlighted:   function() { return this.highlighter. isChecked();      },



  wasJustCreated: function() {
    if (! this.world()) {return;}
    this.expand();
    this.updateTitle();
    this.titleTopicRef.morph().updateAppearance();
    this.titleTopicRef.morph().beWritableAndSelectAll();
  },


  // expanding and collapsing

  isExpanded: function() {return this.expander.isExpanded();},
      expand: function() {this.expander.expand  ();},
    collapse: function() {this.expander.collapse();},
  updateExpandedness: function() {
    if (! this.world()) {return;}
    this.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      var isExpanded = this.isExpanded();
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

  expandIfAnythingIsHighlighted: function() {
    if (this.world() && this.containsAnyHighlightedItems()) {
      this.expand();
    }
  },

  mirror: function() {return this.topic;},

  slotPanels: function() {
    if (! this._slotPanels) {
      this._slotPanels = new BloodyHashTable();
    }
    return this._slotPanels;
  },

  slotPanelFor: function(s) {
    return this.slotPanels().getOrIfAbsentPut(s.name(), function() {
      return new SlotMorph(s);
    }.bind(this));
  },

  populateSlotsPanel: function() {
    var op = this.get_slots_panel();
    op.labelledMorph.dontBotherRejiggeringTheLayoutUntilTheEndOf(function() {
      op.labelledMorph.removeAllThingies();
      this.mirror().eachSlot(function(s) {
        var sp = this.slotPanelFor(s);
        op.labelledMorph.addThingy(sp);
        this.rejiggerTheLayout();
      }.bind(this));
    }.bind(this));
  },

  rejiggerTheColumns: function() {
    if (this.slots_column) {this.slots_column.rejiggerTheLayout();}
  },

  rejiggerThePanels: function() {
    if (this.slots_panel) {this.slots_panel.rejiggerTheLayout();}
    if (this.   interest_panel) {   this.interest_panel.rejiggerTheLayout();}
  },

  repositionJustMyStuff: function() {
    this.rejiggerTheColumns();
    this.rejiggerThePanels();
  },

  containsAnyHighlightedItems: function() {
    var b = false;
    this.topic.eachOpinion(function(o) {
      if (o.containsAnyHighlightedItems()) {b = true;}
    }.bind(this));
    return b;
  },


  // adding and removing to/from the world

  ensureIsInWorld: function() {
    this.stopZoomingOuttaHere();
    var shallBeAdded = this.world() == null;
    if (shallBeAdded) {this.addToWorld();}
    return shallBeAdded;
  },

  ensureIsNotInWorld: function() {
    var shallBeRemoved = this.world() != null;
    if (shallBeRemoved) {this.removeFromWorld();}
    return shallBeRemoved;
  },

  addToWorld: function() {
    WorldMorph.current().addMorph(this);
    // aaa - I do think the outliner will eventually want a title: this.titleTopicRef.morph().updateAppearance();
    // Stop this scaling nonsense:   this.smoothlyScaleBackToNormalSize();
  },

  removeFromWorld: function() {
    this.topic.might_not_have_been_saved_since_being_hidden = true;
    this.startZoomingOuttaHere();
  },

  openEvaluator: function() {
    this.addThingy(new EvaluatorMorph(this));
  },

  destinationForZoomingOuttaHere: function() { return WorldMorph.current().dock; },

  getDismissHelp: function() {return "Hide";}, // aaa - I don't think this works but I don't know why.

  isMovableByForcesFromOtherNodes: function() {
    return ! this.topic.get__was_explicitly_requested();
  },

  focusOnMe: function() {
    loadTopicsWithIDs([this.topic.get__database_object_id()]);
  },

  uniqueID: function() { return this.topic.get__database_object_id(); },

  showDebugInfo: function() {
    this.topic.showDebugInfo();
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    if (debugMode) {
      menu.addSection([["show debug info", function() {this.showDebugInfo();}.bind(this)]]);
    }

    menu.addSection([["add slot", function() {
      /* aaa I don't understand these damned Event things */ evt = new Event(evt); evt.hand = evt.rawEvent.hand;
      var name = this.topic.findUnusedSlotName("slot");
      this.topic.reflectee()[name] = 'argle bargle';
      this.populateSlotsPanel();
      this.updateAppearance();
    }.bind(this)]]);

    menu.addSection([["create child", function() {
      /* aaa I don't understand these damned Event things */ evt = new Event(evt); evt.hand = evt.rawEvent.hand;
      this.world().outlinerFor(this.mirror().createChild()).grabMe(evt);
    }.bind(this)]]);

    return menu;
  },

  acceptsDropping: function(m) {
    return m.canBeDroppedOnTopic;
  },

  justReceivedDrop: function(m) {
    m.wasJustDroppedOnOutliner(this);
  },

  onMouseOver: function(evt) {
    if (evt.hand.submorphs.find(function(m) {return this.morphToGrabOrReceiveDroppingMorph(evt, m);}.bind(this))) {
      this.beHighlighted();
    }
  },

  onMouseOut: function(evt) {
    this.beUnhighlighted();
  },

  handlesMouseDown: function(evt) { return true; },

  onMouseDown: function(evt) {
    if (this.checkForDoubleClick(evt)) {return true;}

    if (evt.isRightMouseButton()) {
      this.showMorphMenu(evt);
      return true;
    }

    return false;
  },

  onDoubleClick: function(evt) {
    this.focusOnMe();
  },

  eachSpring: function(f) {
    this.eachAssociation(function(assoc, otherTopic) {
      f(assoc, otherTopic.morph());
    }.bind(this));
  },

  eachAssociation: function(f) {
    // aaa - I think this could (and probably should) be optimized.
    this.eachArrowEndpoint(function(m) {
      var a = m.association;
      var t1 = a.get__topic1();
      var t2 = a.get__topic2();
      var other =  this.topic == t1 ? t2 : t1;
      if (other != null && other.world()) {
        f(a, other);
      }
    }.bind(this));
  },

  morphForArrowsToAttachTo: function() {
    var r = this.topic.get__referent();
    if (r) {return r.morphForArrowsToAttachTo();}
    return this;
  },
});
Object.extend(OutlinerMorph.prototype, CanHaveArrowsAttachedToIt);

WorldMorph.addMethods({
  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addItem(["create new object", function() {
      /* aaa I don't understand these damned Event things */
      evt = new Event(evt); evt.hand = evt.rawEvent.hand;
      var o = {anObject: {}, anArray: ['zero', 1, 'two'], aNull: null, fortyTwo: 42, aString: 'here is a string', aBoolean: true, aFunction: function(a, b) {argleBargle();}};
      this.outlinerFor(new Mirror(o)).grabMe(evt);
    }]);

    if (debugMode) {
      menu.addSection([
        periodicArrowUpdatingProcess.isRunning() ? [ "stop updating arrows", function() {periodicArrowUpdatingProcess.stop();}]
                                                 : ["start updating arrows", function() {periodicArrowUpdatingProcess.ensureRunning();}],
      ]);

      menu.addSection([[ "aaaaa", function() {
        alert(eval("3 + 4; 5 + 13"));
      }]]);
    }

    return menu;
  },

  outliners: function() {
    if (! this._outliners) {
      this._outliners = new BloodyHashTable();
    }
    return this._outliners;
  },

  existingOutlinerFor: function(mir) {
    return this.outliners().get(mir);
  },

  outlinerFor: function(mir) {
    return this.outliners().getOrIfAbsentPut(mir, function() {return new OutlinerMorph(mir);});
  },


  // dropping stuff

  acceptsDropping: function(m) {
    return m.canBeDroppedOnWorld;
  },

  justReceivedDrop: function(m) {
    if (m.wasJustDroppedOnWorld !== undefined) { m.wasJustDroppedOnWorld(this); }
  },
});

Object.subclass("TopicRef", {
    initialize: function(t, readOnly, title) {
      stats.increment(this.constructor.type + " created");

      this.notifier = new Notifier(this);
      this.isReadOnly = readOnly;
      this.title = title;
      this.setTopic(t);
    },

    getTopic: function( ) { return this._topic; },

    setTopic: function(t) {
      if (this._topic !== t) {
        this._topic = t;
        this.notifier.notify_all_observers();
      }
    },

    inspect: function() {return this.title || "a topic reference";},

    displayName: function() {return displayNameForTopic(this.getTopic());},

    loadTopic: function() { loadTopicsWithIDs([this.getTopic().get__database_object_id()]); },

    beAssociationTypeFor: function(a) {      this.associationThatIAmTheTypeOf = a; return this; },
    isAssociationType:    function() {return this.associationThatIAmTheTypeOf != null; },
    association:          function() {return this.associationThatIAmTheTypeOf; },
});

var overlays = [];


var allTopicRefArrows = [];

ArrowMorph.subclass("SlotContentsPointerArrow", {
  initialize: function($super, slot, fep) {
    this._slot = slot;
    this._fixedEndpoint = fep;
    $super();
    this.initializeUI();
    allTopicRefArrows.push(this);
  },

  createEndpoints: function() {
    this.endpoint1 = this._fixedEndpoint;
    this.endpoint2 = new ArrowEndpoint(this._slot, this);
  },

  noLongerNeedsToBeVisible: function() {
    this.noLongerNeedsToBeUpdated = true;
    this.remove();
  },

  rankAmongArrowsWithSameEndpoints: function() {return 0;},
});


function eachArrowThatShouldBeUpdated(f) {
  allTopicRefArrows.each(function(a) {if (!a.noLongerNeedsToBeUpdated) {f(a);}});
}


TwoModeTextMorph.subclass("SlotNameMorph", {
  initialize: function($super, slot) {
    this.topicRef = slot;
    $super(pt(5, 10).extent(pt(140, 20)), slot.name());
    // aaa - taken out, fix it the proper way: if (this.isReadOnly) {this.ignoreEvents();}
    this.extraMenuItemAdders = [];
    this.normalBorderWidth = 1;
    this.backgroundColorWhenUnwritable = this.constructor.backgroundColorWhenUnwritable;
    this.backgroundColorWhenWritable   = this.constructor.backgroundColorWhenWritable;
    this.setBorderColor(Color.black);
    this.setFill(Color.gray.lighter());
    // aaa do we need this for outliners? this.topicRef.notifier.add_observer(function() {this.updateAppearance();}.bind(this));
    this.updateAppearance();
    this.startPeriodicallyUpdating();
    this.normalBorderWidth = 0;
    this.nameOfEditCommand = "rename";
    this.extraMenuItemAdders.push(function(menu, evt) { this.addEditingMenuItemsTo(menu, evt); }.bind(this));
  },

  slot: function() {return this.topicRef;},
  inspect:  function() {return this.slot().name();},

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  // aaa onMouseDown: function(evt) { return false; },  // don't allow selection

  canBecomeWritable: function() { return true; },

  updateAppearance: function() {
    this.updateLabel();
  },

  startPeriodicallyUpdating: function() {
    new PeriodicalExecuter(function(pe) {this.updateAppearance();}.bind(this), 8);
  },

  updateLabel: function() {
    if (! this.isInWritableMode) {
      var newText = this.slot().name();
      if (newText != this.getText()) {
        this.setText(newText);
      }
    }
  },

  determineWhichMorphToAttachTo: function() {return true;},
  attachToTheRightPlace: function() {},
  noLongerNeedsToBeVisibleAsArrowEndpoint: function() {},
  relativeLineEndpoint: pt(70,10),

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    if (!this.isInWritableMode) { // aaa is this right for outliners?
      this.extraMenuItemAdders.each(function(mia) {mia(menu, evt);});
    }
    return menu;
  },

  returnKeyShouldAccept: function() { return true; },

  getSavedText: function() {
    return this.slot().name();
  },

  setSavedText: function(text) {
    if (text !== this.slot().name()) {
      this.slot().holder().renameSlot(this.slot().name(), text);
      this.outliner().updateEverything();
    }
  },

  captureMouseEvent: function($super, evt, hasFocus) {
    if (evt.type == "MouseDown" && !this.isInWritableMode) {return false;}
    return $super(evt, hasFocus);
  },
});
Object.extend(SlotNameMorph.prototype, CanHaveArrowsAttachedToIt);
Object.extend(SlotNameMorph, {
  backgroundColorWhenUnwritable: Color.gray.lighter(),
  backgroundColorWhenWritable:   Color.gray.lighter(),
});


RowMorph.subclass("SlotMorph", {
  initialize: function($super, slot) {
    $super();
    this._slot = slot;
    //this.beInvisible();
    this.setFill(Color.gray.lighter());
    this.setBorderWidth(1);
    this.setBorderColor(Color.black);
    this.labelMorph = new SlotNameMorph(slot);

    var contentsPointer = this.contentsPointer = new ButtonMorph(pt(0,0).extent(pt(10,10)));

    // aaa Is this the right object to put this stuff on?
    contentsPointer.determineWhichMorphToAttachTo = function() {return true;};
    contentsPointer.attachToTheRightPlace = function() {};
    contentsPointer.noLongerNeedsToBeVisibleAsArrowEndpoint = function() {};
    contentsPointer.relativeLineEndpoint = pt(70,10);
    contentsPointer.setShapeToLookLikeACircle = function() {};
    
    contentsPointer.arrow = new SlotContentsPointerArrow(slot, contentsPointer);
    contentsPointer.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {WorldMorph.current().outlinerFor(slot.contents()).ensureIsInWorld(); WorldMorph.current().addMorph(contentsPointer.arrow);}}}, setValue: "setValue", getValue: "getValue"});
    contentsPointer.suppressHandles = true;
    contentsPointer.okToDuplicate = Functions.False;

    this.addThingies([this.labelMorph, contentsPointer]);
  },

     slot: function() { return this._slot; },
  inspect: function() { return "a slot morph"; },

  outliner: function() {
    return WorldMorph.current().existingOutlinerFor(this.slot().mirror());
  },

  canBeDroppedOnTopic: true,

  wasJustDroppedOnOutliner: function(outliner) {
    this.slot().copyTo(outliner.mirror());
    outliner.expand();
    this.remove();
    outliner.updateEverything();
  },

  wasJustDroppedOnWorld: function(world) {
    var outliner = world.outlinerFor(this.slot().mirror());
    world.addMorphAt(outliner, this.position());
    outliner.expand();
    this.remove();
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);

    menu.addItem(["copy", function(evt) {
      var newSlot = this.slot().copyTo(new Mirror({}));
      evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
    }]);

    menu.addItem(["move", function(evt) {
      var newSlot = this.slot().copyTo(new Mirror({}));
      this.slot().remove();
      evt.hand.grabMorphWithoutAskingPermission(new SlotMorph(newSlot), evt);
      this.outliner().updateEverything();
    }]);

    return menu;
  },
});

ColumnMorph.subclass("EvaluatorMorph", {
  initialize: function($super, outliner) {
    $super();
    this._outliner = outliner;
    
    this.textMorph = createTextField();
    this.textMorph.suppressHandles = true;
    this.addThingy(this.textMorph);
    
    this.buttonsPanel = new RowMorph().beInvisible();
    this.buttonsPanel.addThingy(createButton("Do it",  function() {this.  doIt();}.bind(this)));
    this.buttonsPanel.addThingy(createButton("Get it", function() {this. getIt();}.bind(this)));
    this.buttonsPanel.addThingy(createButton("Close",  function() {this.remove();}.bind(this)));
    this.addThingy(this.buttonsPanel);

    this.setFill(Color.gray);
    this.beUngrabbable();
  },

  outliner: function() { return this._outliner; },

  doIt: function() {
    // aaa - How does LK do this? Maybe new Function()?
    EvaluatorMorph.__aaa_hack_evaluator_receiver__ = this.outliner().mirror().reflectee();
    return eval("var self = EvaluatorMorph.__aaa_hack_evaluator_receiver__; " + this.textMorph.getText());
  },

  getIt: function() {
    var result = this.doIt();
    this.world().hands[0].grabMorphWithoutAskingPermission(this.world().outlinerFor(new Mirror(result)));
    return result;
  },
});
