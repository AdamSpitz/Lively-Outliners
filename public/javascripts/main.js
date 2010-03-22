transporter.module.fileIn("", "everything", function() {
  Morph.suppressAllHandlesForever(); // those things are annoying
  CreatorSlotMarker.annotateExternalObjects();
  reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow
  
  (function() {
    var world = WorldMorph.current();
    world._application = livelyOutliners;
  }).delay(Config.mainDelay * 3);
});
