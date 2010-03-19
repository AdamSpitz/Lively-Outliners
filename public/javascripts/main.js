transporter.module.fileIn('transporter', 'transporter');
transporter.module.fileIn('transporter', 'object_graph_walker'); // aaa - where does this belong?
transporter.module.fileIn('core', 'core');
transporter.module.fileIn('mirrors', 'mirrors');
transporter.module.fileIn('lk-ext', 'lk_ext');
transporter.module.fileIn('outliners', 'self_like_environment');
transporter.module.fileIn('transporter', 'module_morph'); // aaa - where does this belong?

var debugMode = true;
Morph.suppressAllHandlesForever(); // those things are annoying
CreatorSlotMarker.annotateExternalObjects();
reflect(window).categorizeUncategorizedSlotsAlphabetically(); // it's annoying that the lobby outliner is so slow

(function() {
  var world = WorldMorph.current();
  world._application = livelyOutliners;
}).delay(Config.mainDelay * 3);
