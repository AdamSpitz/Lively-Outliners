transporter.module.require('lk-ext', 'lk_ext');
transporter.module.require('outliners', 'self_like_environment');

var debugMode = true;
Morph.suppressAllHandlesForever(); // those things are annoying
CreatorSlotMarker.annotateExternalObjects();
reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow

(function() {
  var world = WorldMorph.current();
  world._application = livelyOutliners;
}).delay(Config.mainDelay * 3);
