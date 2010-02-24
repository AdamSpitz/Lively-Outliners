// aaa - Go through all the methods that we're adding here to the "model" objects and see how
// many of them can be eliminated. For now I'm just trying to get this refactoring done as
// quick as possible so that Andrew can start using the model objects. -- Adam, Feb. 2009

Object.subclass("Topic", {
});

Topic.addMethods({
  doesNotNeedToBeCheckedForChanges: function() {
    return  (! this.world()) && !this.might_not_have_been_saved_since_being_hidden;
  },

  morph: function() {
    if (this.lazily_created_morph == null) {
      this.lazily_created_morph = new OutlinerMorph(this);
    }
    return this.lazily_created_morph;
  },

  morphIfAlreadyCreated: function() {
    return this.lazily_created_morph;
  },

  world: function() {
    var m = this.morphIfAlreadyCreated();
    return m && m.world();
  },

  justIncorporatedNewInfo: function() {
    this.might_not_have_been_saved_since_being_hidden = false;
    var m = this.morphIfAlreadyCreated();
    if (m) { m.expandIfAnythingIsHighlighted(); }
  },

  ensureIsInWorld: function() {
    return this.morph().ensureIsInWorld();
  },

  ensureIsNotInWorld: function() {
    var m = this.morphIfAlreadyCreated();
    if (m) { return m.ensureIsNotInWorld(); } else { return false; }
  },

  addToWorld: function() {
    return this.morph().addToWorld();
  },

  removeFromWorld: function() {
    this.might_not_have_been_saved_since_being_hidden = true;
    var m = this.morphIfAlreadyCreated();
    return m && m.removeFromWorld();
  },

  makingManyChangesDuring: function(f) {
    var m = this.morphIfAlreadyCreated();
    if (m) {
      return m.makingManyChangesDuring(f);
    } else {
      return f();
    }
  },

  wasJustCreated: function() {
    var m = this.morphIfAlreadyCreated();
    return m && m.wasJustCreated();
  },

  morphForArrowsToAttachTo: function() {
    var m = this.morphIfAlreadyCreated();
    return m && m.morphForArrowsToAttachTo();
  },

  showDebugInfo: function() {
    alert("id: "                            + this.get__database_object_id()
      + "\ndisplayNameForTopic: "           + displayNameForTopic(this));
  },
});

ColumnMorph.subclass("OutlinerMorph", {
  initialize: function($super, t) {
    this.topic = t;
    $super();

    this.was_already_unobtrusive = true;

    this.highlighter = new BooleanHolder(true).add_observer(function() {this.refillWithAppropriateColor();}.bind(this));
    this.beUnhighlighted();

    this.shape.roundEdgesBy(10);

    // this.closeDnD(); When this was uncommented, we couldn't drag arrows.

    this.expander = new ExpanderMorph(this);
    this.titleTopicRef = new TopicRef(this.topic, true, "Title");
    this.discussButton = createButton("Discuss", function() {this.topic.openDiscussionWindow();}.bind(this), 0);
    this.dismissButton = new WindowControlMorph(new Rectangle(0, 0, 22, 22), 3, Color.primary.yellow);
    this.dismissButton.relayToModel(this, {HelpText: "-DismissHelp", Trigger: "=removeFromWorld"});
    this.create_header_row();
  },

  // Optimization: create the panels lazily. Most will never be needed, and it's bad to make the user wait while we create dozens of them up front.
  // aaa: Can I create a general lazy thingamajig mechanism?
  get_occurrences_panel: function() { return this.occurrences_panel || (this.occurrences_panel = this.create_occurrences_panel()); },

  create_occurrences_panel: function() {
    return createLabelledPanel("Web pages", "Web pages about this specific concept");
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
    var op = this.occurrences_panel;
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

  updateAppearance: function() {
    if (! this.world()) {return;}
    this.refillWithAppropriateColor();
    this.updateHeader();
  },

  updateHeader: function() {
    if (!this.headerRow) {return;} // not initialized yet
    var u = !!this.topic.is_unobtrusive;
    if (u) {this.collapse();}
    if (u == !!this.was_already_unobtrusive && this.headerRow.getThingies().size() > 0) {return;}
    this.was_already_unobtrusive = u;
    this.sPadding = this.fPadding = u ? 2 : 10;
    this.headerRow.replaceThingiesWith(u ? [this.titleTopicRef.morph()] : [this.expander, this.discussButton, this.dismissButton]);
    this.rejiggerTheLayout();
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
        this.populateOccurrencesPanel();
        this.replaceThingiesWith([this.headerRow, this.get_occurrences_panel()]);
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
    return this.slotPanels().getOrIfAbsentPut(s.name(), function() {return createLabel(s.name());});
  },

  populateOccurrencesPanel: function() {
    var op = this.get_occurrences_panel();
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
    if (this.occurrences_column) {this.occurrences_column.rejiggerTheLayout();}
  },

  rejiggerThePanels: function() {
    if (this.occurrences_panel) {this.occurrences_panel.rejiggerTheLayout();}
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
    this.titleTopicRef.morph().updateAppearance();
    // Stop this scaling nonsense:   this.smoothlyScaleBackToNormalSize();
  },

  removeFromWorld: function() {
    this.topic.might_not_have_been_saved_since_being_hidden = true;
    this.startZoomingOuttaHere();
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
      this.populateOccurrencesPanel();
      this.updateAppearance();
    }.bind(this)]]);

    return menu;
  },

  acceptsDropping: function(m) {
    return this.topic.get__current_users_opinion() != null && m.canBeDroppedOnTopic;
  },

  justReceivedDrop: function(m) {
    m.wasJustDroppedOnTopic(this.topic);
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
      var o = {argle: {}, bargle: {}};
      this.outlinerFor(o).grabMe(evt);
    }]);
    return menu;
  },

  outliners: function() {
    if (! this._outliners) {
      this._outliners = new BloodyHashTable();
    }
    return this._outliners;
  },

  outlinerFor: function(o) {
    var m = new Mirror(o);
    return this.outliners().getOrIfAbsentPut(m, function() {return new OutlinerMorph(m);});
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
