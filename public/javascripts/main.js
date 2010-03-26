transporter.module.fileIn("transporter", "object_graph_walker", function() {
  CreatorSlotMarker.annotateExternalObjects(transporter.module.named('init'));

  transporter.module.fileIn("", "everything", function() {
    CreatorSlotMarker.annotateExternalObjects();
    //Morph.suppressAllHandlesForever(); // those things are annoying
    reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow
  
    (function() {
      var world = WorldMorph.current();
      world._application = livelyOutliners;
    }).delay(Config.mainDelay * 3);
  });
});
