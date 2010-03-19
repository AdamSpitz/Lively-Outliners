transporter.module.fileIn('lk-ext', 'math');
transporter.module.fileIn('lk-ext', 'fixes');
transporter.module.fileIn('lk-ext', 'changes');
transporter.module.fileIn('lk-ext', 'commands');
transporter.module.fileIn('lk-ext', 'menus');
transporter.module.fileIn('lk-ext', 'applications');
transporter.module.fileIn('lk-ext', 'grabbing');
transporter.module.fileIn('lk-ext', 'refreshing_content');
transporter.module.fileIn('lk-ext', 'one_morph_per_object');
transporter.module.fileIn('lk-ext', 'text_morph_variations');
transporter.module.fileIn('lk-ext', 'shortcuts');
transporter.module.fileIn('lk-ext', 'check_box');
transporter.module.fileIn('lk-ext', 'toggler');
transporter.module.fileIn('lk-ext', 'layout');
transporter.module.fileIn('lk-ext', 'rows_and_columns');
transporter.module.fileIn('lk-ext', 'animation');
transporter.module.fileIn('lk-ext', 'zooming_around_and_scaling');
transporter.module.fileIn('lk-ext', 'quickhull');
transporter.module.fileIn('lk-ext', 'expander');
transporter.module.fileIn('lk-ext', 'message_notifier');
transporter.module.fileIn('lk-ext', 'arrows');
transporter.module.fileIn('lk-ext', 'poses');
transporter.module.fileIn('lk-ext', 'sound');


lobby.transporter.module.create('lk_ext', function(thisModule) {


thisModule.addSlots(modules.lk_ext, function(add) {
    
    add.data('_directory', 'lk-ext');

    add.data('_requirements', [
                               ['lk-ext', 'math'],
                               ['lk-ext', 'fixes'],
                               ['lk-ext', 'changes'],
                               ['lk-ext', 'commands'],
                               ['lk-ext', 'menus'],
                               ['lk-ext', 'applications'],
                               ['lk-ext', 'grabbing'],
                               ['lk-ext', 'refreshing_content'],
                               ['lk-ext', 'one_morph_per_object'],
                               ['lk-ext', 'text_morph_variations'],
                               ['lk-ext', 'shortcuts'],
                               ['lk-ext', 'check_box'],
                               ['lk-ext', 'toggler'],
                               ['lk-ext', 'layout'],
                               ['lk-ext', 'rows_and_columns'],
                               ['lk-ext', 'animation'],
                               ['lk-ext', 'zooming_around_and_scaling'],
                               ['lk-ext', 'quickhull'],
                               ['lk-ext', 'expander'],
                               ['lk-ext', 'message_notifier'],
                               ['lk-ext', 'arrows'],
                               ['lk-ext', 'poses'],
                               ['lk-ext', 'sound']
                              ]);

});


});
