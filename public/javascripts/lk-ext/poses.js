lobby.transporter.module.create('poses', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(poses, function(add) {

  add.creator('abstract', {});
  add.creator('tree', Object.create(poses.abstract));
  add.creator('snapshot', Object.create(poses.abstract));

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


thisModule.addSlots(poses.snapshot, function(add) {

  add.method('initialize', function($super, name, morphs) {
    $super(name);
    this._elements = [];
    morphs.each(function(m) {
      if (! m.shouldIgnorePoses()) {
        this._elements.push({morph: m, position: m.getPosition(), uiState: m.constructUIStateMemento && m.constructUIStateMemento()});
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

});

thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('nextPoseID', function() {
    this._nextPoseID = (this._nextPoseID || 0) + 1;
    return this._nextPoseID;
  });

  add.method('rememberedPoses', function() {
    return this._rememberedPoses || (this._rememberedPoses = []);
  }, {category: ['poses']});

  add.method('assumePose', function(pose) {
    pose.recreateInWorld(this);
  }, {category: ['poses']});

  add.method('rememberThisPose', function(evt) {
    var pose = Object.newChildOf(poses.snapshot, "pose " + this.nextPoseID(), this.submorphs);
    this.rememberedPoses().push(pose);
    return pose;
  }, {category: ['poses']});

  add.method('addPoseMenuItemsTo', function(menu, evt) {

    menu.addSection([
      ["clean up", function(evt) {
        this.cleanUp(evt);
      }.bind(this)],

      ["remember this pose", function(evt) {
        this.rememberThisPose(evt);
      }.bind(this)],

      ["assume a pose...", function(evt) {
        var rememberedPosesMenu = new MenuMorph([], this);
        this.rememberedPoses().each(function(pose) {
          rememberedPosesMenu.addItem([pose.name(), function(evt) { this.assumePose(pose); }]);
        }.bind(this));
        rememberedPosesMenu.openIn(this, evt.point());
      }.bind(this)],
    ]);
  }, {category: ['poses']});

  add.method('cleanUp', function (evt) {
    var morphsToMove = this.submorphs.reject(function(m) { return m.shouldNotBeCleanedUp; });

    var sortedMorphsToMove = morphsToMove.sort(function(m1, m2) {
      var n1 = m1.inspect();
      var n2 = m2.inspect();
      return n1 < n2 ? -1 : n1 === n2 ? 0 : 1;
    });

    var pos = pt(20,20);
    var widest = 0;
    for (var i = 0; i < sortedMorphsToMove.length; ++i) {
      var morph = sortedMorphsToMove[i];
      if (typeof(morph.collapse) === 'function') { morph.collapse(); }
      morph.startZoomingTo(pos, true, true);
      var extent = morph.getExtent();
      pos = pos.withY(pos.y + extent.y);
      widest = Math.max(widest, extent.x);
      if (pos.y >= this.getExtent().y - 30) { pos = pt(pos.x + widest + 20, 20); }
    }
  }, {category: ['poses']});

});


thisModule.addSlots(MenuMorph.prototype, function(add) {

  add.method('shouldIgnorePoses', function(uiState) {
    return ! this.stayUp;
  }, {category: ['poses']});

});


});
