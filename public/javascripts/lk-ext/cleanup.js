WorldMorph.addMethods({

  cleanUp: function (evt) {
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
  }

});
