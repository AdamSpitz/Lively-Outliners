lobby.transporter.module.create('lk_ext/poses', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(poses, function(add) {

  add.creator('abstract', {});
  add.creator('tree', Object.create(poses.abstract));
  add.creator('list', Object.create(poses.abstract));
  add.creator('snapshot', Object.create(poses.abstract));

  add.method('addMenuItemsTo', function(menu) {
    menu.addLine();
    
    menu.addItem(["clean up", function(evt) {
      evt.hand.world().cleanUp(evt);
    }]);

    menu.addItem(["remember this pose", function(evt) {
      var world = evt.hand.world();
      world.rememberThisPose();
    }]);

    // aaa - need a way to get the right world

    if (WorldMorph.current().explicitlyRememberedPoses().length > 0) {
      menu.addItem(["assume a pose...", function(evt) {
        var world = evt.hand.world();
        var rememberedPosesMenu = new MenuMorph([], world);
        world.explicitlyRememberedPoses().each(function(pose) {
          rememberedPosesMenu.addItem([pose.name(), function(evt) { world.assumePose(pose); }]);
        });
        rememberedPosesMenu.openIn(world, evt.point());
      }]);
    }

    if (WorldMorph.current().canGoBackToPreviousPose()) {
      menu.addItem(["back to previous pose", function(evt) {
        var world = evt.hand.world();
        world.goBackToPreviousPose();
      }]);
    }

    if (WorldMorph.current().canGoForwardToNextPose()) {
      menu.addItem(["forward to next pose", function(evt) {
        var world = evt.hand.world();
        world.goForwardToNextPose();
      }]);
    }
  }, {category: ['menu']});

});

thisModule.addSlots(poses.abstract, function(add) {

  add.method('initialize', function(name) {
    this._name = name;
  });

  add.method('name', function() {
    return this._name;
  });

  add.method('toString', function() {
    return this.name();
  });

  add.method('recreateInWorld', function(w) {
    this.eachElement(function(e) {
      e.morph.isPartOfCurrentPose = true;
      if (e.uiState) {
        e.morph.assumeUIState(e.uiState);
      } else {
        if (typeof(e.morph.collapse) === 'function') { e.morph.collapse(); }
      }
      e.morph.ensureIsInWorld(w, e.position, true, true, true);
    });
    
    $A(w.submorphs).each(function(m) {
      if (m.isPartOfCurrentPose) {
        delete m.isPartOfCurrentPose;
      } else if (! m.shouldIgnorePoses()) {
        // I am undecided on whether this is a good idea or not. It's annoying if
        // stuff I want zooms away, but it's also annoying if stuff zooms onto
        // other stuff and the screen gets all cluttered.
        m.startZoomingOuttaHere();
      }
    });
  });
});

thisModule.addSlots(poses.tree, function(add) {

  add.method('initialize', function($super, name, focus, parentFunction, childrenFunction) {
    $super(name);
    this._focus = focus;
    this.parentOf = parentFunction;
    this.childrenOf = childrenFunction;
  });

  add.data('indentation', 20);
  add.data('padding', 5);

  add.method('ancestors', function() { 
    var ancestors = [];
    var ancestor = this._focus;
    do {
      ancestors.push(ancestor);
      ancestor = this.parentOf(ancestor);
    } while (ancestor);
    ancestors.reverse();
    return ancestors;
  });

  add.method('eachElement', function(f) {
    var pos = pt(20,20);
    this.ancestors().each(function(m) {
      f({morph: m, position: pos});
      pos = pos.addXY(this.indentation, m.getExtent().y + this.padding);
    }.bind(this));
    
    this.eachChildElement(this._focus, pos, f);
  });

  add.method('eachChildElement', function(m, pos, f) {
    this.childrenOf(m).each(function(child) {
      f({morph: child, position: pos});
      var newY = this.eachChildElement(child, pos.addXY(this.indentation, m.getExtent().y + this.padding), f);
      pos = pos.withY(newY);
    }.bind(this));
    return pos.y;
  });

});

thisModule.addSlots(poses.list, function(add) {

  add.method('initialize', function($super, name, world, morphs) {
    $super(name);
    this._world = world;
    this._morphs = morphs;
  });

  add.method('eachElement', function (f) {
    var sortedMorphsToMove = this._morphs.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var pos = pt(20,20);
    var widest = 0;
    for (var i = 0; i < sortedMorphsToMove.length; ++i) {
      var morph = sortedMorphsToMove[i];
      f({morph: morph, position: pos});
      var extent = morph.getExtent();
      pos = pos.withY(pos.y + extent.y);
      widest = Math.max(widest, extent.x);
      if (pos.y >= this._world.getExtent().y - 30) { pos = pt(pos.x + widest + 20, 20); }
    }
  }, {category: ['poses', 'cleaning up']});

});

thisModule.addSlots(poses.snapshot, function(add) {

  add.method('initialize', function($super, name, morphs) {
    $super(name);
    this._elements = [];
    morphs.each(function(m) {
      if (! m.shouldIgnorePoses()) {
        this._elements.push({morph: m, position: m.getPosition(), uiState: m.constructUIStateMemento()});
      }
    }.bind(this));
  });

  add.method('eachElement', function(f) {
    this._elements.each(f);
  });
});


thisModule.addSlots(Morph.prototype, function(add) {

  add.method('shouldIgnorePoses', function(uiState) {
    return false;
  }, {category: ['poses']});

  add.method('constructUIStateMemento', function() {
    // override this and assumeUIState in children if you want them to be recalled in a particular state
    return null;
  }, {category: ['poses']});

  add.method('assumeUIState', function(uiState) {
    // override this and constructUIStateMemento in children if you want them to be recalled in a particular state
  }, {category: ['poses']});

  add.method('transferUIStateTo', function (otherMorph, evt) {
    otherMorph.assumeUIState(this.constructUIStateMemento());
  }, {category: ['poses']});

});

thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('nextPoseID', function() {
    this._nextPoseID = (this._nextPoseID || 0) + 1;
    return this._nextPoseID;
  }, {category: ['poses', 'taking snapshots']});

  add.method('explicitlyRememberedPoses', function() {
    return this._rememberedPoses || (this._rememberedPoses = []);
  }, {category: ['poses', 'explicitly remembering']});

  add.method('undoPoseStack', function() {
    return this._undoPoseStack || (this._undoPoseStack = []);
  }, {category: ['poses', 'undo']});

  add.method('undoPoseStackIndex', function() {
    if (this._undoPoseStackIndex === undefined) { this._undoPoseStackIndex = this.undoPoseStack().size(); }
    return this._undoPoseStackIndex;
  }, {category: ['poses', 'undo']});

  add.method('addToUndoPoseStack', function(pose) {
    var i = this.undoPoseStackIndex();
    var stack = this.undoPoseStack();
    stack.splice(i, stack.size() - i, pose);
    this._undoPoseStackIndex += 1;
  }, {category: ['poses', 'undo']});

  add.method('canGoBackToPreviousPose', function() {
    return this.undoPoseStackIndex() > 0;
  });

  add.method('canGoForwardToNextPose', function() {
    return this.undoPoseStackIndex() < this.undoPoseStack().size() - 1;
  });

  add.method('goBackToPreviousPose', function() {
    if (! this.canGoBackToPreviousPose()) { throw "there is nothing to go back to"; }

    if (this.undoPoseStackIndex() === this.undoPoseStack().size()) {
      this.addToUndoPoseStack(this.createSnapshotOfCurrentPose()); // so that we can go forward to it
      this._undoPoseStackIndex -= 1; // reset the index
    }

    var pose = this.undoPoseStack()[this._undoPoseStackIndex -= 1];
    pose.recreateInWorld(this);
  });

  add.method('goForwardToNextPose', function() {
    if (! this.canGoForwardToNextPose()) { throw "there is nothing to go forward to"; }
    var pose = this.undoPoseStack()[this._undoPoseStackIndex += 1];
    pose.recreateInWorld(this);
  });

  add.method('assumePose', function(pose) {
    this.addToUndoPoseStack(this.createSnapshotOfCurrentPose());
    pose.recreateInWorld(this);
  }, {category: ['poses']});

  add.method('createSnapshotOfCurrentPose', function() {
    return Object.newChildOf(poses.snapshot, "pose " + this.nextPoseID(), this.submorphs);
  }, {category: ['poses', 'taking snapshots']});

  add.method('rememberThisPose', function() {
    var pose = this.createSnapshotOfCurrentPose();
    this.explicitlyRememberedPoses().push(pose);
    return pose;
  }, {category: ['poses', 'taking snapshots']});

  add.method('cleanUp', function (evt) {
    var morphsToMove = this.submorphs.reject(function(m) { return m.shouldIgnorePoses(); });
    this.assumePose(Object.newChildOf(poses.list, "clean up", this, morphsToMove));
  }, {category: ['poses', 'cleaning up']});

  add.method('listPoseOfMorphsFor', function (objects, name) {
    var morphsToMove = objects.map(function(m) { return this.morphFor(m); }.bind(this));
    return Object.newChildOf(poses.list, name, this, morphsToMove);
  }, {category: ['poses', 'cleaning up']});

});


thisModule.addSlots(MenuMorph.prototype, function(add) {

  add.method('shouldIgnorePoses', function(uiState) {
    return ! this.stayUp;
  }, {category: ['poses']});

});


});
