module('lively.Tests.PresentationTests').requires('lively.TestFramework', 'lively.Presentation').toRun(function(ownModule) {

TestCase.subclass('APresentationTest', {
    
	setUp: function() {
		this.page = new lively.Presentation.PageMorph(new Rectangle(0,0,800,600));
		WorldMorph.current().addMorph(this.page);
	},

	testToggleFullScreen: function() {
		this.page.toggleFullScreen();
		this.assert(this.page.getScale() > 1, "page did not get scaled");
		this.page.toggleFullScreen();
		this.assert(this.page.getScale() == 1, "page did not get scaled back");		
	}, 
	
	tearDown: function() {
		this.page.remove();
		delete this.page
	}
});


});
