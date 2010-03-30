transporter.module.fileIn("transporter", "object_graph_walker", function() {
  CreatorSlotMarker.annotateExternalObjects(transporter.module.named('init'));

  transporter.module.fileIn("", "everything", function() {
    CreatorSlotMarker.annotateExternalObjects();
    Morph.suppressAllHandlesForever(); // those things are annoying
    reflect(window).categorizeUncategorizedSlotsAlphabetically(); // make the lobby outliner less unwieldy

    transporter.module.fileIn("lk", "Main", function() {
      window.onload();
    });
  });
});
