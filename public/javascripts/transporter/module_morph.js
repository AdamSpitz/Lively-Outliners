lobby.transporter.module.create('module_morph', function(requires) {

requires('lk_ext', 'rows_and_columns');

}, function(thisModule) {



thisModule.addSlots(modules.module_morph, function(add) {
    
    add.data('_directory', 'transporter');

});


thisModule.addSlots(transporter.module, function(add) {

  add.method('newMorph', function() {
    return new this.Morph(this);
  }, {category: ['user interface']});

  add.method('Morph', function Morph() { Class.initializer.apply(this, arguments); }, {category: ['user interface']});

});


thisModule.addSlots(transporter.module.Morph, function(add) {

  add.data('superclass', RowMorph);

  add.creator('prototype', Object.create(RowMorph.prototype));

  add.data('type', 'transporter.module.Morph');

});


thisModule.addSlots(transporter.module.Morph.prototype, function(add) {

  add.data('constructor', transporter.module.Morph);

  add.method('initialize', function ($super, module) {
    $super();
    this._module = module;

    this.setPadding({top: 2, bottom: 2, left: 4, right: 4, between: 3});
    this.setFill(defaultFillWithColor(Color.red.lighter()));
    this.shape.roundEdgesBy(10);

    this._nameLabel = createLabel(function() { return module.name(); });
    this._fileOutButton = createButton('File out', this.fileOut.bind(this), 2);

    this._changeIndicator = createLabel(function() { return this._module.hasChangedSinceLastFileOut() ? ' has changed ' : ''; }.bind(this));
    this._changeIndicator.setTextColor(Color.green.darker());

    this.setColumns([this._nameLabel, this._changeIndicator, this._fileOutButton, this.createDismissButton()]);

    this.startPeriodicallyUpdating();
  }, {category: ['creating']});

  add.method('inspect', function () { return this._module.name(); }, {category: ['printing']});

  add.method('fileOut', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() { this._module.fileOut(); }.bind(this), evt);
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['commands']});

  add.method('fileOutWithoutAnnotations', function (evt) {
    MessageNotifierMorph.showIfErrorDuring(function() { this._module.fileOutWithoutAnnotations(); }.bind(this), evt);
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['commands']});

  add.method('forgetIWasChanged', function (evt) {
    this._module.markAsUnchanged();
    this.refreshContentOfMeAndSubmorphs();
  }, {category: ['commands']});

  add.method('getModuleObject', function (evt) {
    evt.hand.world().morphFor(reflect(this._module)).grabMe(evt);
  }, {category: ['commands']});

  add.method('getAllObjects', function (evt) {
    var w = evt.hand.world();
    w.assumePose(w.listPoseOfMorphsFor(this._module.objectsThatMightContainSlotsInMe().map(function(o) { return reflect(o); }), "objects in module " + this._module.name()));
  }, {category: ['commands']});

  add.method('addCommandsTo', function (cmdList) {
    cmdList.addItem({label: 'file out', pluralLabel: 'file out modules', go: this.fileOut.bind(this)});

    cmdList.addItem({label: 'forget I was changed', go: this.forgetIWasChanged.bind(this)});

    cmdList.addLine();

    cmdList.addItem({label: 'get module object', go: this.getModuleObject.bind(this)});

    cmdList.addLine();

    cmdList.addItem({label: 'all objects', go: this.getAllObjects.bind(this)});
  }, {category: ['menu']});

});


thisModule.addSlots(transporter, function(add) {

  add.method('addMenuItemsTo', function(menu, evt) {
    menu.addLine();

    var snapshottingWorks = false; // aaa - turn this on once it works.
    if (snapshottingWorks) {
    menu.addItem(["save snapshot", function(evt) {
      var snapshotter = new Snapshotter();
      snapshotter.walk(lobby);
      var snapshot = snapshotter.completeSnapshotText();

      var baseDirURL = URL.source.getDirectory().withRelativePath("javascripts/snapshots/");
      var fileName = "snapshot_" + snapshotter._number + ".js";
      var url = baseDirURL.withFilename(fileName);
      var status = new Resource(Record.newPlainInstance({URL: url})).store(snapshot, true).getStatus();
      if (! status.isSuccess()) {
        throw "failed to write " + fileName + ", status is " + status.code();
      }
    }]);
    }

    menu.addItem(["all modules", function(evt) {
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(Object.newChildOf(enumerator, transporter.module, 'eachModule'), "all modules"));
    }]);

    menu.addItem(["changed modules", function(evt) {
      var world = evt.hand.world();
      world.assumePose(world.listPoseOfMorphsFor(transporter.module.changedOnes(), "all modules"));
    }]);

    // aaa - hack because I haven't managed to get WebDAV working on adamspitz.com yet
    if (! URL.source.hostname.include("adamspitz.com")) {

      menu.addItem(["file in...", function(evt) {
        var world = evt.hand.world();
        var baseDir = new FileDirectory(lobby.transporter.module.urlForCoreModulesDirectory());
        var modulesMenu = new MenuMorph(this.moduleMenuItemsForDir(baseDir, ""), world);
        modulesMenu.openIn(world, evt.point());
      }.bind(this)]);

    }

  }, {category: ['menu']});

  add.method('moduleMenuItemsForDir', function(dir, pathFromModuleSystemRootDir) {
    var menuItems = [];

    var subdirURLs = dir.subdirectories();
    subdirURLs.each(function(subdirURL) {
      var subdir = new FileDirectory(subdirURL);
      var subdirName = subdirURL.filename();
      menuItems.push([subdirName, this.moduleMenuItemsForDir(subdir, pathFromModuleSystemRootDir + "/" + subdirName)]);
    }.bind(this));
        
    var jsFileNames = dir.filenames().select(function(n) {return n.endsWith(".js");});
    jsFileNames.each(function(n) {
      menuItems.push([n, function(evt) {
        var moduleName = n.substring(0, n.length - 3);
        MessageNotifierMorph.showIfErrorDuring(function() {
          lobby.transporter.module.fileIn(pathFromModuleSystemRootDir, moduleName);
        }, evt);
      }]);
    });

    return menuItems;
  }, {category: ['menu']});

});



});
