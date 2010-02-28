WorldMorph.addMethods({
  inspect: function() { return "Lively"; },

  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addItem(["create new object", function(evt) {
      this.outlinerFor(reflect({})).grabMe(evt);
    }]);

    menu.addLine();

    menu.addItem(["file in module...", function(evt) {
      var filenames = new FileDirectory(lobby.transporter.module.urlForModuleDirectory()).filenames().select(function(n) {return n.endsWith(".js");});
      
      var modulesMenu = new MenuMorph(filenames.map(function(n) {return [n, function(evt) {
        var moduleName = n.substring(0, n.length - 3);
        MessageNotifierMorph.showIfErrorDuring(function() { lobby.transporter.module.fileIn(moduleName); }, evt);
      }];}), this);
      
      modulesMenu.openIn(this, evt.point());
    }.bind(this)]);

    menu.addItem(["file out module...", function(evt) {
      var modulesMenu = new MenuMorph([], this);
      lobby.transporter.module.eachModule(function(m) {
        modulesMenu.addItem([m.name(), function(evt) {
          MessageNotifierMorph.showIfErrorDuring(function() { m.fileOut(); }, evt);
        }.bind(this)]);
      }.bind(this));
      modulesMenu.openIn(this, evt.point());
    }.bind(this)]);

    if (debugMode) {
      menu.addSection([
        periodicArrowUpdatingProcess.isRunning() ? [ "stop updating arrows", function() {periodicArrowUpdatingProcess.stop();}]
                                                 : ["start updating arrows", function() {periodicArrowUpdatingProcess.ensureRunning();}],

        ["create new weirdo test object", function(evt) {
          var o = {anObject: {}, anArray: ['zero', 1, 'two'], aNull: null, fortyTwo: 42, aString: 'here is a string', aBoolean: true, aFunction: function(a, b) {argleBargle();}};
          this.outlinerFor(reflect(o)).grabMe(evt);
        }],

        ["get the lobby", function(evt) {
          this.outlinerFor(reflect(lobby)).grabMe(evt);
        }],

        ["annotate external objects", function(evt) {
            var marker = new CreatorSlotMarker();
            var objectCount = marker.walk(lobby);
            console.log("Whoa, done annotating external stuff! It took " + (new Date().getTime() - marker._startTime) + " ms to annotate " + objectCount + " objects.");
        }],

        ["aaaaa", function(evt) {
        }],
      ]);
    }

    return menu;
  },

  outliners: function() {
    if (! this._outliners) {
      this._outliners = new BloodyHashTable();
    }
    return this._outliners;
  },

  existingOutlinerFor: function(mir) {
    return this.outliners().get(mir);
  },

  outlinerFor: function(mir) {
    return this.outliners().getOrIfAbsentPut(mir, function() {return new OutlinerMorph(mir);});
  },


  // dropping stuff

  acceptsDropping: function(m) {
    return typeof m.wasJustDroppedOnWorld === 'function';
  },

  justReceivedDrop: function(m) {
    if (this.acceptsDropping(m)) { 
      m.wasJustDroppedOnWorld(this);
    }
  },
});
