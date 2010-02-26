WorldMorph.addMethods({
  morphMenu: function(evt) {
    var menu = new MenuMorph([], this);
    menu.addItem(["create new object", function(evt) {
      this.outlinerFor(new Mirror({})).grabMe(evt);
    }]);

    menu.addLine();

    menu.addItem(["file in module...", function(evt) {
      this.prompt("Module name?", function(name) {
        if (name) {
          MessageNotifierMorph.showIfErrorDuring(function() { Module.fileIn(name); }, evt);
        }
      }.bind(this));
    }.bind(this)]);

    menu.addItem(["file out module...", function(evt) {
      var modulesMenu = new MenuMorph([], this);
      Transporter.eachModule(function(m) {
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
          this.outlinerFor(new Mirror(o)).grabMe(evt);
        }],

        ["get the lobby", function(evt) {
          this.outlinerFor(new Mirror(lobby)).grabMe(evt);
        }],

        ["write a test file", function(evt) {
          // var url = URL.source.withFilename("uploads/testFile.js");
          var url = new URL("http://localhost/~adam/uploads/testFile.js");
          var doc = "Here is the document.";

          var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();

          if (status.isSuccess()) {
            new MessageNotifierMorph("success publishing world at " + url + ", status " + status.code(), Color.green).grabMe(evt);
          } else {
            new MessageNotifierMorph("failure publishing world at " + url + ", status " + status.code(), Color.red  ).grabMe(evt);
          }
        }],

        ["aaaaa", function(evt) {
            alert(eval("({})"));
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
