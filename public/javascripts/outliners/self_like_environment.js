lobby.transporter.module.create('self_like_environment', function(thisModule) {

thisModule.requires('outliners', 'categories');
thisModule.requires('outliners', 'slot_morph');
thisModule.requires('outliners', 'evaluator');
thisModule.requires('outliners', 'slice');
thisModule.requires('outliners', 'outliners');
thisModule.requires('outliners', 'test_case_morph');
thisModule.requires('transporter', 'module_morph'); // aaa - doesn't really belong here


thisModule.addSlots(modules.self_like_environment, function(add) {
    
    add.data('_directory', 'outliners');

});


});
