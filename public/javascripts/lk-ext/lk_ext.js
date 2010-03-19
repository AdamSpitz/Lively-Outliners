lobby.transporter.module.create('lk_ext', function(thisModule) {

thisModule.requires('lk-ext', 'math');
thisModule.requires('lk-ext', 'fixes');
thisModule.requires('lk-ext', 'changes');
thisModule.requires('lk-ext', 'commands');
thisModule.requires('lk-ext', 'menus');
thisModule.requires('lk-ext', 'applications');
thisModule.requires('lk-ext', 'grabbing');
thisModule.requires('lk-ext', 'refreshing_content');
thisModule.requires('lk-ext', 'one_morph_per_object');
thisModule.requires('lk-ext', 'text_morph_variations');
thisModule.requires('lk-ext', 'shortcuts');
thisModule.requires('lk-ext', 'check_box');
thisModule.requires('lk-ext', 'toggler');
thisModule.requires('lk-ext', 'layout');
thisModule.requires('lk-ext', 'rows_and_columns');
thisModule.requires('lk-ext', 'animation');
thisModule.requires('lk-ext', 'zooming_around_and_scaling');
thisModule.requires('lk-ext', 'quickhull');
thisModule.requires('lk-ext', 'expander');
thisModule.requires('lk-ext', 'message_notifier');
thisModule.requires('lk-ext', 'arrows');
thisModule.requires('lk-ext', 'poses');
thisModule.requires('lk-ext', 'sound');


thisModule.addSlots(modules.lk_ext, function(add) {
    
    add.data('_directory', 'lk-ext');

});


});
