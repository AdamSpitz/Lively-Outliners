transporter.module.fileIn('outliners', 'categories');
transporter.module.fileIn('outliners', 'slot_morph');
transporter.module.fileIn('outliners', 'evaluator');
transporter.module.fileIn('outliners', 'slice');
transporter.module.fileIn('outliners', 'outliners');
transporter.module.fileIn('outliners', 'test_case_morph');
transporter.module.fileIn('transporter', 'module_morph'); // aaa - doesn't really belong here


lobby.transporter.module.create('self_like_environment', function(thisModule) {


thisModule.addSlots(modules.self_like_environment, function(add) {
    
    add.data('_directory', 'outliners');

    add.data('_requirements', [['outliners', 'categories'], ['outliners', 'slot_morph'], ['outliners', 'evaluator'], ['outliners', 'slice'], ['outliners', 'outliners'], ['outliners', 'test_case_morph'], ['transporter', 'module_morph']]);

});


});
