lobby.transporter.module.create('core', function(thisModule) {

thisModule.requires('core', 'exit');
thisModule.requires('core', 'enumerator');
thisModule.requires('core', 'hash_table');
thisModule.requires('core', 'notifier');
thisModule.requires('core', 'string_buffer');
thisModule.requires('core', 'string_extensions');
thisModule.requires('core', 'value_holder');
thisModule.requires('core', 'dependencies');
thisModule.requires('core', 'little_profiler');


thisModule.addSlots(modules.core, function(add) {
    
    add.data('_directory', 'core');

});


});
