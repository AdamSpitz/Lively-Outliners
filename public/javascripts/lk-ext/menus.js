Morph.addMethods({
  showContextMenu: function(evt) {
    if (! this.contextMenu) { return; }
    var menu = this.contextMenu(evt);
    if (!menu) { return; }
    var baseColor = Color.black; // should be a clear difference between a morph menu and a context menu
    menu.listStyle = Object.create(menu.listStyle);
    menu.textStyle = Object.create(menu.textStyle);
    menu.listStyle.borderColor = baseColor;
    menu.listStyle.fill        = baseColor.lighter(5);
    menu.textStyle.textColor   = baseColor;
    menu.openIn(this.world(), evt.point(), false, Object.inspect(this).truncate());
  },
});

Event.addMethods({
  isForContextMenu:    function() { return this.isCtrlDown()   || this.isRightMouseButtonDown();  },
  isForMorphMenu:      function() { return this.isCommandKey() || this.isMiddleMouseButtonDown(); },
});

MenuMorph.addMethods({
  addSection: function(newItems) {
    if (newItems.size() > 0) {
      if (this.items.size() > 0) {this.addLine();}
      newItems.each(function(item) {this.addItem(item);}.bind(this));
    }
  },
});
