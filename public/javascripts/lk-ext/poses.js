lobby.transporter.module.create('poses', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('poses', {}, {category: ['ui', 'poses']});

});


thisModule.addSlots(poses, function(add) {

  add.creator('abstract', {});
  add.creator('tree', Object.create(poses.abstract));

});

thisModule.addSlots(poses.abstract, function(add) {

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
      } else if (! m.shouldIgnorePoses) {
        m.startZoomingOuttaHere();
      }
    });
  });
});

thisModule.addSlots(poses.tree, function(add) {

  add.method('initialize', function(focus, parentFunction, childrenFunction) {
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
      ancestors.unshift(ancestor);
      ancestor = this.parentOf(ancestor);
    } while (ancestor);
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


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('assumePose', function(pose) {
    pose.recreateInWorld(this);
  });

});


});
