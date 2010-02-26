// Bootstrap the module system.

function annotationOf(o) {
  var a = o.__annotation__;
  if (a) { return a; }
  return o.__annotation__ = {slotAnnotations: {}};
}

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

lobby.transporter.module.create = function(n, block) {
  if (lobby.modules[n]) { throw 'The ' + n + ' module is already loaded.'; }
  block(this.named(n));
};

lobby.transporter.module.addSlots = function(holder, block) {
  var thisModule = this;
  lobby.transporter.module.cache[this._name].push(holder);

  block(function(name, contents, annotation, isCreatorSlot) {
    if (! annotation) { annotation = {}; }
    holder[name] = contents;
    annotation.module = thisModule;
    annotationOf(holder).slotAnnotations[name] = annotation;
    if (isCreatorSlot) {
      var a = annotationOf(contents);
      a.creatorSlotName   = name;
      a.creatorSlotHolder = holder;
    }
  });
};
