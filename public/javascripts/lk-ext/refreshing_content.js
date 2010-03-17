Morph.addMethods({
  refreshContentOfMeAndSubmorphs: function() {
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentOfMeAndSubmorphs(); });
  },
  
  refreshContent: function() {
    // children can override
    this.updateFill();
  },

  updateFill: function() {
    // children can override
  }
});

TextMorph.addMethods({
  refreshContent: function() {
    if (this.refreshText) { this.refreshText(); }
  }
});
