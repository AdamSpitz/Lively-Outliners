transporter.module.fileIn("transporter", "object_graph_walker", function() {
  CreatorSlotMarker.annotateExternalObjects(transporter.module.named('init'));

  transporter.module.fileIn("", "everything", function() {
    CreatorSlotMarker.annotateExternalObjects();
    Morph.suppressAllHandlesForever(); // those things are annoying
    reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow
  
    (function() {
      var world = WorldMorph.current();

      world._application = livelyOutliners;

      var instructionsMorph = new MessageNotifierMorph("Right-click the background to start", Color.green);
      instructionsMorph.ignoreEvents();
      instructionsMorph.ensureIsInWorld(world, world.getExtent().scaleBy(0.5).subPt(instructionsMorph.getExtent().scaleBy(0.5)), true, false, true, function() {instructionsMorph.zoomAwayAfter(5000);});
    }).delay(Config.mainDelay * 3);
  });
});
