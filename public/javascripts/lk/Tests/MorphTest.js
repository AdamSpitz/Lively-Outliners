module('lively.Tests.MorphTest').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('MorphTest', {
	
	createTestMorph: function(owner){
	    var m =  Morph.makeRectangle( 0,  0, 10, 10);
	    if(owner)
	        owner.addMorph(m);
	    return m
	},
	
	setUp: function() {
	    this.m1 = this.createTestMorph();
	    this.m2 = this.createTestMorph(this.m1);
	    this.m3 = this.createTestMorph(this.m2);
	    this.m4 = this.createTestMorph();
	},
	
	testIsContainedIn: function() {
	    this.assert(this.m2.isContainedIn(this.m1));
	    this.assert(this.m3.isContainedIn(this.m1));
	    this.assert(!this.m2.isContainedIn(this.m3));
	    this.assert(!this.m4.isContainedIn(this.m1));
	},

	testOwnerWidget: function() {
		var w = new Widget();
		this.m1.ownerWidget = w;
		this.assertIdentity(this.m1.getOwnerWidget(), w, "m1")
		this.assertIdentity(this.m2.getOwnerWidget(), w, "m2")

	}
	
});

TestCase.subclass('ButtonMorphTest', {
	
	
	// testConnectButton: function() {
	// 	var b = new ButtonMorph(rect(10,10,20,20));
	// 	var counter = 0;
	// 	b.connectModel({onUpdateValue: function(value) {
	// 		counter += 1;
	// 	});
	// },
	
});


TestCase.subclass('TextListMorphTest', {

	setUp: function() {
		this.morph = new TextListMorph(new Rectangle(0,0,100,100),[]);
		this.model = Record.newNodeInstance({List: [], Selection: null, Capacity: 4, 
			ListDelta: [], DeletionConfirmation: null, DeletionRequest: null});
	    this.morph.relayToModel(this.model, {List: "List", Selection: "Selection", Capacity: "-Capacity", 
				      ListDelta: "-ListDelta", DeletionConfirmation: "-DeletionConfirmation", DeletionRequest: "+DeletionRequest"});
	},
	
	tearDown: function() {
		this.morph.remove();
	},
	
	openMorph: function() {
		WorldMorph.current().addMorph(this.morph);		
	},
	
    testUpdateList: function() {
		this.morph.updateList(["Hallo"]);
		this.assertEqual(this.morph.itemList.length, 1);
    },
	
	testAppendList: function() {
		this.morph.appendList(["Hallo"]);
		this.assertEqual(this.morph.itemList.length, 1);
	},
	
	testDefaultCapacity: function() {
		this.assertEqual(this.morph.getCapacity(), 4);
		
	},
	
	testAppendListOverCapaciy: function() {
		this.openMorph();
		this.morph.updateList(["1","2","3"]);
		var firstY = this.morph.submorphs[0].getPosition().y;
		this.morph.appendList(["4","5","6"]);
		this.assertEqual(this.morph.itemList.length, 4);
		this.assertEqual(this.morph.submorphs[0].getPosition().y, firstY, "the layout did not get updated");


	},


});

TestCase.subclass('ListMorphTest', {

    setUp: function() {
        this.model =  Record.newPlainInstance({MyList: [], MySelection: null});
        this.list  = new ListMorph(new Rectangle(80,80,50,20), ["----nope----"]);
        this.list.connectModel(this.model.newRelay({List: "MyList", Selection: "MySelection"}));
    },

    testStringList: function() {
        var myList = ["Hans", "Peter", "Maria"];
        this.model.setMyList(myList);
        this.assertEqual(this.list.itemList, myList);
        this.list.selectLineAt(1, true);
        this.assert(this.list.getSelection(), "list has no selection");
        this.assertEqual(this.list.submorphs.first().textString, "Hans", "wrong display of object");
        
    },

    testNumberList: function() {
        var myList = [1, 2, 3];
        this.model.setMyList(myList);
        this.assertEqual(this.list.itemList, myList);
        this.list.selectLineAt(1, true);
        this.assert(this.list.getSelection(), "list has no selection");
        this.assert(Object.isNumber(this.list.getSelection()), "selection is no number");
    },
    
    testObjectList: function() {
        var toStringFunc = function() {return this.msg}; 
        var myList = [{msg: "Hello"}, {msg: "World"}];
        myList[0].toString =  toStringFunc;
        this.model.setMyList(myList);
        this.assertEqual(this.list.itemList, myList);
        this.list.selectLineAt(1, true);
        // this.list.itemPrinter = function(item) {return item.msg};
        this.assert(this.list.getSelection().msg, "selection has no msg");
        this.assert(this.list.getSelection().msg, "Hello","wrong selection");
        this.assertEqual(this.list.submorphs.length, 2, "wrong number of submorphs");
        this.assertEqual(this.list.submorphs.first().textString, "Hello", "wrong display of object");
    },
    
    
    testItemPrinter: function() {
        this.list.itemPrinter = function(item) {return item.msg}; 
        var myList = [{msg: "Hello"}, {msg: "World"}];
        this.model.setMyList(myList);
        this.assertEqual(this.list.itemList, myList);

        this.list.selectLineAt(1, true);
        this.assert(this.list.getSelection().msg, "selection has no msg");
        this.assert(this.list.getSelection().msg, "Hello","wrong selection");
        this.assertEqual(this.list.submorphs.length, 2, "wrong number of submorphs");
        this.assertEqual(this.list.submorphs.first().textString, "Hello", "wrong display of object");
    },

});


TestCase.subclass('HandMorphTest', {
        
    testHandleMouseEvent: function() {
        var world = WorldMorph.current();
        var hand = world.hands.first();
        hand.mouseFocus = null;
        var morph = Morph.makeRectangle(100,100,200,200);
        this.morph = morph;
        morph.getHelpText  = function(){return "This is no help text!"};
        world.addMorph(morph);
        
        var evt = newFakeMouseEvent(pt(150,150));
        hand.reallyHandleMouseEvent(evt)
        this.assert(!hand.mouseFocus, "there is a focus where there should not be one");
        this.assert(hand.mouseOverMorph === morph, "morph is not mouseOverMorph");      
        
        var oldFocus = hand.mouseFocus;
        var m = Morph.makeRectangle(100,100,200,200);
        this.morph2 = m;
        WorldMorph.current().addMorph(m);
        m.setPosition(pt(400,400));
        this.assertIdentity(oldFocus, hand.mouseFocus);
        
        var evt = newFakeMouseEvent(pt(151,151));
        hand.reallyHandleMouseEvent(evt)
        this.assert(!hand.mouseFocus, "there is a focus where there should not be one");
        this.assert(hand.mouseOverMorph === morph, "morph is not mouseOverMorph");        
    },
    
    
    tearDown: function(){
        if(this.morph) this.morph.remove();
        if(this.morph2) this.morph2.remove();
    },
    
});

TestCase.subclass('TextMorphTest', {
    setUp: function() {
        this.m = new TextMorph(new Rectangle(0,0,100,100),"Hello World\n\n3+4\n123\t\tEnde");
        this.m.openInWorld();
		this.dontRemove = false;
    },
    
    testLineNumberForIndex: function() {
        this.assertEqual(this.m.lines.length, 4, "wrong line numbers");
        this.assertEqual(this.m.lineNumberForIndex(0), 0);
        this.assertEqual(this.m.lineNumberForIndex(7), 0);
        this.assertEqual(this.m.lineNumberForIndex(12), 1);
    },
    
    testSelectionRange: function() {
        this.m.setSelectionRange(0,5);
        this.assertEqual(this.m.getSelectionString(), "Hello");
        this.m.setSelectionRange(6,11);
        this.assertEqual(this.m.getSelectionString(), "World");
    },

	testExtendSelection: function() {
		var m = this.m;
		this.dontRemove = false;
		m.startSelection(5);
		this.assertEqual(m.getCursorPos(), 5);
		this.assertEqual(m.getSelectionString(), '');
		m.extendSelection(4);
		this.assertEqual(m.getCursorPos(), 4);
		this.assertEqual(m.getSelectionString(), 'o');
		m.extendSelection(11);
		this.assertEqual(m.getCursorPos(), 11);
		this.assertEqual(m.getSelectionString(), ' World');
	},

	testExtendSelection2: function() {
		var m = this.m;
		var pos = 'Hello World'.length;
		m.startSelection(pos);
		m.extendSelection(pos+3);
		/*this.assertEqual(m.getCursorPos(), 5);
		this.assertEqual(m.getSelectionString(), '');
		m.extendSelection(4);*/
	},
 
    tearDown: function() {
		if (this.dontRemove) {
			this.m.requestKeyboardFocus(WorldMorph.current().firstHand());
			return;
		}
        this.m.remove();
    },
    
});

TestCase.subclass('ImageMorphTest', {

	setUp: function() {
		this.m = new ImageMorph(rect(pt(0,0),pt(100,100)),"Resources/images/Halloween4.jpg");
        this.m.openInWorld();
		this.dontRemove = false;
	},

	testSetExtent: function() {
		
		this.assertEqual(this.m.image.getWidth(), 100, "initial extent is false");
		this.m.setExtent(pt(200,200));
		// should this work?
		// this.assertEqual(this.m.image.getWidth(), 200, "extent did not get updated false");
    },

	testSetImageWidth: function() {
		this.m.image.setWidth(200);
		this.assertEqual(this.m.image.getWidth(), 200);
    },

	testSetImageHeight: function() {
		this.m.image.setHeight(200);
		this.assertEqual(this.m.image.getHeight(), 200);
    },

    tearDown: function() {
		if (this.dontRemove) {
			this.m.requestKeyboardFocus(WorldMorph.current().firstHand());
			return;
		}
        this.m.remove();
    },
});

TestCase.subclass('ScrollPaneTest', {

	testDisableScrollBar: function() {
		var scrollPane = Global.newTextListPane(new Rectangle(0,0,100,100));
		var scrollBar = scrollPane.scrollBar;
		scrollPane.disableScrollBar();
		this.assert(!scrollBar.owner, "scrollBar is still open");
		this.assert(!scrollPane.scrollBar, "scrollBar is still referenced");
    },

	testEnableScrollBar: function() {
		var scrollPane = Global.newTextListPane(new Rectangle(0,0,100,100));
		scrollPane.disableScrollBar();
		scrollPane.enableScrollBar();
		this.assert(scrollPane.scrollBar, "scrollBar is not referenced");
		this.assert(scrollPane.scrollBar.owner, "scrollBar is not open");
    },

});




TestCase.subclass('PinMorphInteractionTest', {

    testHandleMouseEventPinMorph: function() {
        var world = WorldMorph.current();
        var hand = world.hands.first();
        hand.mouseFocus = null;

        var fabrik = new FabrikComponent();
        var component = Fabrik.addTextComponent(fabrik); 
        this.window = fabrik.openIn(world);
        this.window.setPosition(pt(100,100));
        component.panel.setPosition(pt(100,100));
        
        var pinMorph = component.getPinHandle("Text").morph;
        var pos = pinMorph.worldPoint(pt(5,5));
        var evt = newFakeMouseEvent(pos);
        hand.reallyHandleMouseEvent(evt)
        this.assert(!hand.mouseFocus, "there is a focus where there should not be one");
        this.assert(hand.mouseOverMorph === pinMorph, "morph is not mouseOverMorph");              
        
        //var m = new Morph();
        // BUG: opening a morph in the world make the next morph loopup fail
        //WorldMorph.current().addMorph(m);
        //this.window.addMorph(m)
        // m.setPosition(pt(400,400));

        var pos = pinMorph.worldPoint(pt(6,6));
        var evt = newFakeMouseEvent(pos);
        hand.reallyHandleMouseEvent(evt)
        this.assert(!hand.mouseFocus, "there is a focus where there should not be one");
        this.assert(hand.mouseOverMorph === pinMorph, "morph is not mouseOverMorph");              

    },

    tearDown: function(){
        if(this.window) this.window.remove();
    },


});

TestCase.subclass('VideoMorphTest', {

	sourceFromYoutube: function() {
		return '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/gGw09RZjQf8&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/gGw09RZjQf8&hl=en&fs=1" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>';
	},
sourceFromVimeo: function() {
		return '<object width="400" height="544"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=3038424&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;color=&amp;fullscreen=1" /><embed src="http://vimeo.com/moogaloop.swf?clip_id=3038424&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;color=&amp;fullscreen=1" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="400" height="544"></embed></object><br /><a href="http://vimeo.com/3038424">Sun Lively Kernel on iPhone (simulator)</a> from <a href="http://vimeo.com/user825365">Steve Lloyd</a> on <a href="http://vimeo.com">Vimeo</a>';
	},


	testExtractURLFromVideoEmbedCode: function() {
	var sut = new VideoMorph();
	var result = sut.extractURL(this.sourceFromYoutube());
	this.assertEqual(result, "http://www.youtube.com/v/gGw09RZjQf8&hl=en&fs=1");
},
testExtractURLFromVideoEmbedCode2: function() {
	var sut = new VideoMorph();
	var result = sut.extractURL(this.sourceFromVimeo());
	this.assertEqual(result, "http://vimeo.com/moogaloop.swf?clip_id=3038424&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;color=&amp;fullscreen=1");
},

testExtractExtent: function() {
	var sut = new VideoMorph();
	var result = sut.extractExtent(this.sourceFromYoutube());
	this.assertEqual(result.x, 425);
	this.assertEqual(result.y, 344);
},

});
TestCase.subclass('NodeMorphTest', {
	
	setUp: function() {
		this.spec = {maxDist: 100, minDist: 50, step: 20};
		var owner = Morph.makeRectangle(new Rectangle(0,0,10,10))
		owner.worldPoint = function(p) {return p};
		for (var i = 1; i <=3; i++) {
			var m = new NodeMorph(new Rectangle(0,0,20,20));
			m.configure(this.spec);
			m.setPosition(pt(0,0));
			owner.addMorph(m); // need owner for world position calculation...
			this['node' + i] = m; 
			
		}
	},

	assertEqualPt: function(p1, p2) { // sometimes the optimized functions are not 100% precise
		this.assert(Math.abs(p1.x-p2.x) < 0.01, 'point.x! ' + p1.x + ' vs. ' + p2.x);
		this.assert(Math.abs(p1.y-p2.y) < 0.01, 'point.y! '  + p1.y + ' vs. ' + p2.y);
	},

	testNodeConnectorForTwoNodeMorphs: function() {
		var connector = new ConnectorMorph(this.node1, this.node2);
		this.assertEqual(connector.getStartPos(), this.node1.getCenter());
		this.assertEqual(connector.getEndPos(), this.node2.getCenter());
	},

	testConnectorMovesWithMorphs: function() {
		var connector = new ConnectorMorph(this.node1, this.node2);
		this.node1.setPosition(pt(200,200));
		this.assertEqual(connector.getStartPos(), this.node1.getCenter());
		this.assertEqual(connector.getEndPos(), this.node2.getCenter());
	},

	testUnregisterNode: function() {
		var orig = this.node1.changed;
		var connector = new ConnectorMorph(this.node1, this.node2);
		this.assert(this.node1.changed != orig);
		connector.unregister('Start');
		this.assertEqual(orig, this.node1.changed);
		this.node1.setPosition(pt(99,99));
		this.assert(this.node1.getPosition() != connector.getStartPos());
	},

	testComputeRepulsionWithOneNode1: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(150,100));
		var result = this.node1.forceOfMorphs([this.node2]);
		this.assertEqualPt(result, pt(-20, 0));
	},

	testComputeRepulsionWithOneNode2: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(175,100));
		var result = this.node1.forceOfMorphs([this.node2]);
		this.assertEqualPt(result, pt(-20, 0));
	},

	testComputeRepulsionWithOneNode3: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(201,100));
		var result = this.node1.forceOfMorphs([this.node2]);
		this.assertEqualPt(result, pt(0, 0));
	},

	testComputeRepulsion1: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(60,100));
		this.node3.setPosition(pt(140,100));
		var result = this.node1.forceOfMorphs([this.node2, this.node3]);
		this.assertEqual(result, pt(0, 0)); // maxRepuslion = 20, minDist = 50, maxDist=100
	},

	testComputeRepulsion2: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(120,100));
		this.node3.setPosition(pt(100,80));
		var result = this.node1.forceOfMorphs([this.node2, this.node3]);
		this.assertEqualPt(result, Point.polar(20, pt(-1,1).theta())); // maxRepuslion = 20, minDist = 50, maxDist=100
	},

	testConnectNodes1: function() {
		this.node1.connectTo(this.node2);
		this.assert(this.node1.connectedNodes().include(this.node2), 'node1->node2');
		this.assert(!this.node2.connectedNodes().include(this.node1), 'node2 -> node1 1');
		this.assert(this.node1.isConnectedTo(this.node2), 'node1->node2 *2');
		this.assert(!this.node2.isConnectedTo(this.node1), 'node2->node1 2');
	},

	testConnectNodes2: function() {
		this.node1.connectTo(this.node2);
		this.node2.connectTo(this.node1);
		this.assert(this.node1.connectedNodes().include(this.node2), 'node1->node2');
		this.assert(this.node2.connectedNodes().include(this.node1), 'node2 -> node1 1');
		this.assert(this.node1.isConnectedTo(this.node2), 'node1->node2 *2');
		this.assert(this.node2.isConnectedTo(this.node1), 'node2->node1 2');
	},

	testConnectNodes3: function() {
		this.node1.connectTo(this.node2);
		this.node2.remove();
		this.assertEqual(this.node1.connectedNodes().length, 0);
	},


	testDisconnectNodes1: function() {
		var con = this.node1.connectTo(this.node2);
		this.assert(this.node1.isConnectedTo(this.node2), 'node1->node2');
		this.node1.disconnect(this.node2);
		this.assert(!this.node1.isConnectedTo(this.node2), 'node1, node2 still connected');
		this.assert(!this.node1.connections.include(con));
		this.assert(!this.node2.connections.include(con));
	},


	testComputeAttraction1: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(150,100)); // = minDist, no attraction
		this.node1.connectTo(this.node2);
dbgOn(true);
		var result = this.node1.forceOfMorphs([this.node2]);
		this.assertEqualPt(result, pt(0, 0));
	},

	testComputeAttraction2: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(175,100)); // = maxDist/2, half of max attraction
		this.node1.connectTo(this.node2);
		var result = this.node1.forceOfMorphs([this.node2]);
		this.assertEqualPt(result, pt(0, 0)); // maxRepuslion = 20, minDist = 50, maxDist=100
	},

	testComputeAttraction3: function() {
		this.node1.setPosition(pt(100,100));
		this.node2.setPosition(pt(60,100));
		this.node3.setPosition(pt(140,100)); // both nodes pull on node1
		this.node1.connectTo(this.node2);
		this.node1.connectTo(this.node3);
		var result = this.node1.forceOfMorphs([this.node2, this.node3]);
		this.assertEqual(result, pt(0, 0)); // maxRepuslion = 20, minDist = 50, maxDist=100
	},
});

// logMethod(Morph.prototype, "morphToGrabOrReceive");
// logMethod(Morph.prototype, "onMouseOut");
// logMethod(Morph.prototype, "onMouseOver");
// logMethod(HandMorph.prototype, "reallyHandleMouseEvent");


// 
// TestCase.subclass('ObjectExplorerTest', {
// 	
// 	testHelloWorld: function(){
// 		var items = [new SelectorFolder(this, "Hello World", [])]
// 		var model =  new SelectorFolder(this, "The Model", items);
// 		var view = new SelectorView(rect(pt(10,10), pt(100,100)));
// 		view.setModel(model);
// 		view.updateView();
// 		WorldMorph.current().addMorph(view);
// 		this.assertEqual(view.submorphs.length, 1);
// 	},
// 	
// });
// 



//logMethod(Morph.prototype, "morphToGrabOrReceive");
// logMethod(Morph.prototype, "onMouseDown");
//logMethod(HandMorph.prototype, "reallyHandleMouseEvent");

}) // end of module