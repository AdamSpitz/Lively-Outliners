/// aaa - A lot of duplication with TwoModeTextMorph.
TextMorph.subclass("TextMorphRequiringExplicitAcceptance", {
  initialize: function($super, rect, textString, modelPlugSpec) {
    $super(rect, textString);
    this.dontNotifyUntilTheActualModelChanges = true;
    this.connectModel(modelPlugSpec || {model: this, getText: "getSavedText", setText: "setSavedText"});
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || Color.white);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.changed();
    this.beUngrabbable();
    this.setSavedText(textString);
    return this;
  },

  getSavedText: function( )  {
    return this.savedTextString;
  },

  setSavedText: function(t)  {
    this.savedTextString = t;
    if (this.notifier != null) {this.notifier.notify_all_observers();}
  },

  setTextString: function($super, replacement, delayComposition, justMoreTyping) {
    var x = $super(replacement, delayComposition, justMoreTyping);
    this.updateLayoutIfNecessary();
    return x;
  },

  updateLayoutIfNecessary: function() {
    this.adjustForNewBounds(); // makes the focus halo look right   // aaa should probably be outside the conditional, or even in the Core code
    this.minimumExtentChanged();
  },

  onKeyDown: function($super, evt) {
    if (evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }

    if (evt.getKeyCode() == Event.KEY_RETURN && (this.returnKeyShouldAccept() || evt.isMetaDown() || evt.isCtrlDown())) {
      this.acceptChanges();
      evt.stop();
      return;
    }
    return $super(evt);
  },

  onKeyPress: function($super, evt) {
    if (evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }
    if (evt.getKeyCode() == Event.KEY_RETURN && (this.returnKeyShouldAccept() || evt.isMetaDown() || evt.isCtrlDown())) {
      this.acceptChanges();
      evt.stop();
      return;
    }
    return $super(evt);
  },

  changed: function($super) {
    this.hasChangedFromSavedText = this.getText() !== this.getSavedText();
    if (! this.hasChangedFromSavedText) {
      this.setBorderColor(Color.black);
      this.setBorderWidth(this.normalBorderWidth || 1);
    } else {
      this.setBorderColor(Color.red);
      this.setBorderWidth(this.borderWidthWhenModified || 2);
    }
    this.minimumExtentChanged();
    $super();
  },

  refreshText: function() {
    if (this.hasChangedFromSavedText) {
      // Don't wanna lose the stuff that we've typed.
      this.changed();
    } else {
      var newText = this.getSavedText();
      if (newText !== this.getText()) {
        this.setText(newText);
        this.changed();
      }
    }
  },

  acceptChanges: function() {
    this.setSavedText(this.getText());
    this.changed();
  },

  cancelChanges: function() {
    this.setText(this.getSavedText());
    this.changed();
    this.updateLayoutIfNecessary();
  },

  handlesMouseDown: function(evt) { return true; },

  returnKeyShouldAccept: function() { return false; },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    this.addEditingMenuItemsTo(menu, evt);
    this.addOtherMenuItemsTo(menu, evt);
    return menu.items.size() > 0 ? menu : null;
  },

  addEditingMenuItemsTo: function(menu, evt) {
    menu.addSection([["accept    [alt+enter]", this.acceptChanges.bind(this)],
                     ["cancel    [escape]"   , this.cancelChanges.bind(this)]]);
  },

  addOtherMenuItemsTo: function(menu, evt) {
    // override in children
  },
});

TextMorph.subclass("TwoModeTextMorph", {
  initialize: function($super, rect, textString, modelPlugSpec) {
    $super(rect, textString);
    this.dontNotifyUntilTheActualModelChanges = true;
    this.connectModel(modelPlugSpec || {model: this, getText: "getSavedText", setText: "setSavedText"});
    this.beUnwritable();
    this.setSavedText(textString);
    return this;
  },

  getSavedText: function( )  {
    return this.savedTextString;
  },

  setSavedText: function(t)  {
    this.savedTextString = t;
    if (this.notifier != null) {this.notifier.notify_all_observers();}
  },

  setTextString: function($super, replacement, delayComposition, justMoreTyping) {
    var x = $super(replacement, delayComposition, justMoreTyping);
    this.adjustForNewBounds(); // makes the focus halo look right   // aaa should probably be outside the conditional, or even in the Core code
    this.minimumExtentChanged();
    return x;
  },

  refreshText: function() {
    if (! this.isInWritableMode) {
      var newText = this.getSavedText();
      if (newText != this.getText()) {
        this.setText(newText);
      }
    }
  },

  beUnwritable: function() {
    this.acceptInput = false;
    this.setFill(this.backgroundColorWhenUnwritable || null);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.setNullSelectionAt(0);
    var w = this.world();
    if (w) {this.relinquishKeyboardFocus(w.firstHand());}
    this.changed();
    this.beUngrabbable();
    this.isInWritableMode = false;
    return this;
  },

  beWritable: function() {
    this.acceptInput = true;
    this.setFill(this.backgroundColorWhenWritable || null);
    this.setWrapStyle(lively.Text.WrapStyle.Shrink);
    this.changed();
    this.beUngrabbable();
    this.isInWritableMode = true;
    return this;
  },

  onKeyDown: function($super, evt) {
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }
    $super(evt);
  },

  onKeyPress: function($super, evt) {
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_ESC) {
      this.cancelChanges();
      evt.stop();
      return;
    }
    if (this.isInWritableMode && evt.getKeyCode() == Event.KEY_RETURN && (this.returnKeyShouldAccept() || evt.isMetaDown() || evt.isCtrlDown())) {
      this.acceptChanges();
      evt.stop();
      return;
    }
    return $super(evt);
  },

  changed: function($super) {
    if (this.isInWritableMode) {
      if (this.getText() == this.getSavedText()) {
        this.setBorderWidth(this.normalBorderWidth || 0);
      } else {
        this.setBorderColor(Color.red);
        this.setBorderWidth(this.borderWidthWhenModified || 2);
      }
    } else {
      this.setBorderWidth(this.normalBorderWidth || 0);
    }
    $super();
  },

  acceptChanges: function() {
    this.setSavedText(this.getText());
    this.beUnwritable();
  },

  cancelChanges: function() {
    this.setText(this.getSavedText());
    this.beUnwritable();
  },

  beWritableAndSelectAll: function(evt) {
    this.beWritable();
    this.requestKeyboardFocus(evt ? evt.hand : WorldMorph.current().firstHand());
    this.doSelectAll();
  },

  handlesMouseDown: function(evt) { return true; },

  onMouseDown: function($super, evt) {
    this.hideHelp();
    if (this.isInWritableMode) {
      return $super(evt);
    } else {
      return this.checkForDoubleClick(evt);
    }
  },

  canBecomeWritable: function() { return ! this.isReadOnly; },

  returnKeyShouldAccept: function() { return true; },

  onDoubleClick: function(evt) {
    if (this.canBecomeWritable()) {
      this.beWritable();
      this.onMouseDown(evt);
    }
  },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    this.addEditingMenuItemsTo(menu, evt);
    this.addOtherMenuItemsTo(menu, evt);
    return menu.items.size() > 0 ? menu : null;
  },

  addEditingMenuItemsTo: function(menu, evt) {
    if (this.isInWritableMode) {
      menu.addSection([["accept    [alt+enter]", this.acceptChanges.bind(this)],
                       ["cancel    [escape]"   , this.cancelChanges.bind(this)]]);
    } else if (this.canBecomeWritable()) {
      menu.addSection([[this.nameOfEditCommand || "edit", function() {this.beWritableAndSelectAll(evt);}.bind(this)]]);
    }
  },

  addOtherMenuItemsTo: function(menu, evt) {
    // override in children
  },
});

TwoModeTextMorph.subclass("LinkingTextMorph", {
  initialize: function($super, rect, textString, linker) {
    $super(rect, textString);
    this.linker = linker;
    this.colorForHighlightedLinkText = Color.red;
    this.colorForUnhighlightedLinkText = Color.blue;
    this.colorForEditableText = Color.black;
    this.beUnhighlighted();
    return this;
  },

  onMouseDown: function($super, evt) {
    this.hideHelp();
    if ((! this.isInWritableMode) && evt.isLeftMouseButtonDown()) {
      this.followLink();
      return true;
    } else {
      return $super(evt);
    }
  },

  onMouseOver: function($super, evt) { if (! this.isInWritableMode) {this.beHighlighted();}   },
  onMouseOut:  function($super, evt) { if (! this.isInWritableMode) {this.beUnhighlighted();} },

  beHighlighted: function() {
    this.setTextColor(this.colorForHighlightedLinkText);
    this.layoutChanged();
  },

  beUnhighlighted: function() {
    this.setTextColor(this.isInWritableMode ? this.colorForEditableText : this.colorForUnhighlightedLinkText);
    this.layoutChanged();
  },

  beUnwritable: function($super) {
    $super();
    this.beUnhighlighted();
  },

  beWritable: function($super) {
    $super();
    this.beUnhighlighted();
  },

  inspect: function() { return "a link"; },

  followLink: function() {return this.linker.followLink(this);},

  addOtherMenuItemsTo: function(menu, evt) {
    menu.addSection([["open link", this.followLink.bind(this)]]);
  },

  returnKeyShouldAccept: function() { return true; },
});


TextMorph.addMethods({
  // For compatibility with TwoModeTextMorphs.
  getSavedText: function()  {return this.getText( );},
  setSavedText: function(t) {return this.setText(t);}
});
