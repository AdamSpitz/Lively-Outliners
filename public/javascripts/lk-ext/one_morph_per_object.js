lobby.transporter.module.create('one_morph_per_object', function(thisModule) {


thisModule.addSlots(modules.one_morph_per_object, function(add) {
    
  add.data('_directory', 'lk-ext');

});


thisModule.addSlots(WorldMorph.prototype, function(add) {
  
  add.creator('morphIdentityComparator', {}, {category: ['one morph per object']});

  add.method('morphsByObject', function () {
    return this._morphsByObject || (this._morphsByObject = hashMap.copyRemoveAll(this.morphIdentityComparator));
  }, {category: ['one morph per object']});

  add.method('existingMorphFor', function (obj) {
    return this.morphsByObject().get(obj);
  }, {category: ['one morph per object']});

  add.method('morphFor', function (obj) {
    return this.morphsByObject().getOrIfAbsentPut(obj, function() {return obj.newMorph();});
  });

});



thisModule.addSlots(WorldMorph.prototype.morphIdentityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    if (k1.isImmutableForMorphIdentity) { return hashMap.equalityComparator.keysAreEqual(k1, k2); }
    return k1 === k2;
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    if (k1.isImmutableForMorphIdentity) { return hashMap.equalityComparator.hashCodeForKey(k); }
    // aaa - Blecch, why does JS not support identity hashes?
    return 42;
  }, {category: ['hashing']});

});



});
