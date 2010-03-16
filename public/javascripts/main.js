// I don't really know what the proper way is to provide my own world menu.
// So for now I just overwrite the old one. -- Adam
WorldMorph.addMethods({
  inspect: function() { return "Lively"; },
  contextMenu: function(evt) { return this.livelyOutlinersWorldMenu(evt); },
});

var debugMode = true;
Morph.suppressAllHandlesForever(); // those things are annoying
startUpdatingAllArrows();
CreatorSlotMarker.annotateExternalObjects();
reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow
