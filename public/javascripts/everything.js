lobby.transporter.module.create('everything', function(requires) {

requires('core/lk_TestFramework'); // aaa - hack - how should I deal with LK modules that don't actually load until you ask for them?
requires('transporter/transporter');
requires('core/core');
requires('mirrors/mirrors');
requires('lk_ext/lk_ext');
requires('outliners/self_like_environment');
requires('transporter/module_morph'); // aaa - where does this belong?
requires('transporter/snapshotter'); // aaa - where does this belong?

}, function(thisModule) {

});
