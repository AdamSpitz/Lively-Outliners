lobby.transporter.module.create('snapshotter', function(requires) {

requires('transporter', 'object_graph_walker');

}, function(thisModule) {


thisModule.addSlots(modules.snapshotter, function(add) {

  add.data('_directory', 'transporter');

});


thisModule.addSlots(lobby, function(add) {

  add.method('Snapshotter', function Snapshotter() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

});


thisModule.addSlots(Snapshotter, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'Snapshotter');

  add.data('currentNumber', 0, {comment: 'Used to mark the objects as we snapshot them, so that we know we have already included them in this snapshot.'});

});


thisModule.addSlots(Snapshotter.prototype, function(add) {

  add.data('constructor', Snapshotter);

  add.data('_objectsByOID', []);

  add.method('initialize', function ($super) {
    $super();
    this._number = (++Snapshotter.currentNumber);
    this._objectsByOID = [];
    this._buffer = stringBuffer.create();
  });

  add.data('namesToIgnore', ["__snapshotNumberOfOID__", "__snapshotNumber__", "__oid__", "enabledPlugin"], {comment: 'Having enabledPlugin in here is just a hack for now - what\'s this clientInformation thing, and what are these arrays that aren\'t really arrays?', initializeTo: '["__annotation__", "enabledPlugin"]'});

  add.data('shouldWalkIndexables', true);

  add.method('oidForObject', function (o) {
    if (o.hasOwnProperty('__snapshotNumberOfOID__') && o.__snapshotNumberOfOID__ === this._number) { return o.__oid__; }
    var parent = o['__proto__'];
    if (parent) { this.oidForObject(parent); } // make sure the parent gets created before the child
    var oid = this._objectsByOID.length;
    o.__oid__ = oid;
    this._objectsByOID.push(o);
    o.__snapshotNumberOfOID__ = this._number;
    return oid;
  });

  add.method('markObject', function (o) {
    if (o.hasOwnProperty('__snapshotNumber__') && o.__snapshotNumber__ === this._number) { return false; }
    o.__snapshotNumber__ = this._number;
    return true;
  });

  add.method('markContents', function (holder, slotName, contents) {
    return this.markObject(contents);
  });

  add.method('referenceTo', function (o) {
    if (o ===      null) { return 'null';      }
    if (o === undefined) { return 'undefined'; }
    var t = typeof(o);
    if (t === 'number' || t === 'string' || t === 'boolean') { return Object.inspect(o); }
    var oid = this.oidForObject(o);
    return "(__objectsByOID__[" + oid + "])";
  });

  add.method('reachedObject', function (o) {
    // anything to do here?
  });

  add.method('isNativeFunction', function (o) {
    // Is there a better way to test for native functions?
    return typeof(o) === 'function' && o.toString().include('[native code]') && o !== this.isNativeFunction;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (this.isNativeFunction(contents)) { return; }
    this._buffer.append(this.referenceTo(holder)).append('[').append(slotName.inspect()).append('] = ').append(this.referenceTo(contents)).append(';\n');
  });

  add.method('creationStringFor', function (o) {
    if (o ===   Object.prototype) { return 'Object.prototype';   }
    if (o ===    Array.prototype) { return 'Array.prototype';    }
    if (o ===  Boolean.prototype) { return 'Boolean.prototype';  }
    if (o ===   String.prototype) { return 'String.prototype';   }
    if (o ===   Number.prototype) { return 'Number.prototype';   }
    if (o === Function.prototype) { return 'Function.prototype'; }
    // aaa - What other objects need to really be the real ones in the new image?

    var t = typeof(o);
    if (t === 'function') {
      if (this.isNativeFunction(o)) { return reflect(o).creatorSlotChainExpression(); }
      if (o instanceof RegExp) { return "new RegExp(" + RegExp.escape(o.source).inspect() + ")"; }
      return o.toString();
    }
    if (t === 'object' && o instanceof Array) { return '[]'; }

    var parent = o['__proto__'];
    if (parent === Object.prototype) { return '{}'; } // not really necessary, but looks nicer
    return 'createChildOf(' + this.referenceTo(parent) + ')';
  });

  add.method('completeSnapshotText', function () {
    var setupBuf = stringBuffer.create('(function() {\n');
    setupBuf.append("var createChildOf = function(parent) { function F() {}; F.prototype = parent; return new F(); };\n");
    setupBuf.append("var __objectsByOID__ = [];\n");
    for (var i = 0, n = this._objectsByOID.length; i < n; ++i) {
      var o = this._objectsByOID[i];
      setupBuf.append('__objectsByOID__[').append(i).append('] = ').append(this.creationStringFor(o)).append(';\n');
    }
    var tearDownBuf = stringBuffer.create('\n})();\n');
    return setupBuf.concat(this._buffer, tearDownBuf).toString();
  });

});


});
