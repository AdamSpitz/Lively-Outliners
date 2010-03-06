WorldMorph.addMethods({

  inspect: function() { return "Lively"; },

  morphMenu: function(evt) {
    // I don't really know what the proper way is to provide my own world menu.
    // So for now I just overwrite the old one. -- Adam
    return this.livelyOutlinersWorldMenu(evt);
  },

});
