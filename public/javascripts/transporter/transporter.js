var Transporter = {
  eachModule: function(f) {
    new Mirror(lobby.modules).eachNonParentSlot(function(s) { f(s.contents().reflectee()); });
  },

  moduleCache: new BloodyHashTable(),
  
  objectsThatMightContainSlotsInModule: function(m) {
    return this.moduleCache.getOrIfAbsentPut(m.name(), function() {return [];});
  },
};
