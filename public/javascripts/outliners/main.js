var debugMode = true;

Morph.suppressAllHandlesForever();
startUpdatingAllArrows();
CreatorSlotMarker.annotateExternalObjects();
reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow
