transporter.module.fileIn("transporter", "object_graph_walker", function() {
  CreatorSlotMarker.annotateExternalObjects(true, transporter.module.named('init'));

  transporter.module.fileIn("", "everything", function() {
    CreatorSlotMarker.annotateExternalObjects(true);
    Morph.suppressAllHandlesForever(); // those things are annoying
    reflect(window).categorizeUncategorizedSlotsAlphabetically(); // make the lobby outliner less unwieldy

    transporter.module.fileIn("lk", "Main", function() {
      window.onload();
    });
  });
});
