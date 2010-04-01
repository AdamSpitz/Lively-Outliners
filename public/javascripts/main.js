// Later on could do something nicer with dependencies and stuff. For now,
// let's just try dynamically loading the LK files in the same order we
// loaded them when we were doing it statically in the .xhtml file.

transporter.module.fileIn("prototype", "prototype", function() {
  transporter.module.fileIn("lk", "JSON", function() {
    transporter.module.fileIn("lk", "defaultconfig", function() {
      transporter.module.fileIn("", "local-LK-config", function() {
        transporter.module.fileIn("lk", "Base", function() {
          transporter.module.fileIn("lk", "scene", function() {
            transporter.module.fileIn("lk", "Core", function() {
              transporter.module.fileIn("lk", "Text", function() {
                transporter.module.fileIn("lk", "Widgets", function() {
                  transporter.module.fileIn("lk", "Network", function() {
                    transporter.module.fileIn("lk", "Data", function() {
                      transporter.module.fileIn("lk", "Storage", function() {
                        transporter.module.fileIn("lk", "Tools", function() {
                          transporter.module.fileIn("lk", "Examples", function() {
                            transporter.module.fileIn("lk", "TestFramework", function() {
                              transporter.module.fileIn("lk", "jslint", function() {
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
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
