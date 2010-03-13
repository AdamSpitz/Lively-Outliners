Morph.addMethods({
  refreshContentOfMeAndSubmorphs: function() {
    this.refreshContent();
    this.submorphs.each(function(m) { m.refreshContentOfMeAndSubmorphs(); });
  },
  
  refreshContent: function() {
    // children can override
    if (this.updateFill) { this.updateFill(); }
  },
});

TextMorph.addMethods({
  refreshContent: function() {
    if (this.refreshText) { this.refreshText(); }
  },
});
