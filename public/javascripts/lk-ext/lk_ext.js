lobby.transporter.module.create('lk_ext', function(requires) {

requires('lk-ext', 'math');
requires('lk-ext', 'fixes');
requires('lk-ext', 'changes');
requires('lk-ext', 'commands');
requires('lk-ext', 'menus');
requires('lk-ext', 'applications');
requires('lk-ext', 'grabbing');
requires('lk-ext', 'refreshing_content');
requires('lk-ext', 'one_morph_per_object');
requires('lk-ext', 'text_morph_variations');
requires('lk-ext', 'shortcuts');
requires('lk-ext', 'check_box');
requires('lk-ext', 'toggler');
requires('lk-ext', 'layout');
requires('lk-ext', 'rows_and_columns');
requires('lk-ext', 'animation');
requires('lk-ext', 'zooming_around_and_scaling');
requires('lk-ext', 'quickhull');
requires('lk-ext', 'expander');
requires('lk-ext', 'message_notifier');
requires('lk-ext', 'arrows');
requires('lk-ext', 'poses');
requires('lk-ext', 'sound');

}, function(thisModule) {


thisModule.addSlots(modules.lk_ext, function(add) {
    
    add.data('_directory', 'lk-ext');

});


});
