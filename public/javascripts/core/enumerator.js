lobby.transporter.module.create('enumerator', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('enumerator', {}, {category: ['collections']}, {comment: 'An Enumerable whose contents are whatever is yielded by calling the specified method.', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(lobby.enumerator, function(add) {

  add.method('initialize', function (obj, methodName) {
    this._object = obj;
    this._methodName = methodName;
  }, {}, {});

  add.method('_each', function (f) {
    return this._object[this._methodName].call(this._object, f);
  }, {}, {});

});


});
