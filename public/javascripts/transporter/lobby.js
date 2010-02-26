// Bootstrap the module system.

function newObjectAnnotation() { return {slotAnnotations: {}}; }

var lobby = Object.create(window);

lobby.modules = {};

lobby.transporter = {};

lobby.transporter.module = {};

lobby.transporter.module.cache = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
  lobby.transporter.module.cache[n] = [];
  return m;
};

lobby.transporter.loadSlot = function(holder, name, contents, annotation, isCreatorSlot) {
  holder[name] = contents;
  if (! holder.__annotation__) { holder.__annotation__ = newObjectAnnotation(); }
  holder.__annotation__.slotAnnotations[name] = annotation;
  if (isCreatorSlot) {
    var a = contents.__annotation__ = newObjectAnnotation();
    a.creatorSlotName   = name;
    a.creatorSlotHolder = holder;
  }
  lobby.transporter.module.cache[annotation.module._name].push(holder);
};
