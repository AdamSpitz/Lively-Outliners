lobby.transporter.module.create('self_like_environment', function(requires) {

requires('outliners', 'categories');
requires('outliners', 'slot_morph');
requires('outliners', 'evaluator');
requires('outliners', 'slice');
requires('outliners', 'outliners');
requires('outliners', 'test_case_morph');

}, function(thisModule) {

thisModule.addSlots(modules.self_like_environment, function(add) {
    
    add.data('_directory', 'outliners');

});


});
