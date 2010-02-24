module('lively.Tests.SerializationTests').requires('lively.TestFramework').toRun(function(thisModule) {

/* Helper Classes */

Morph.subclass('DummyMorph', {

    initialize: function($super) { 
        $super(rect(pt(0,0), pt(100,050)), "rect");
        this.formalModel = Record.newInstance({MyValue: {}},{});
    },
    
    onDeserialize: function() {
        this.onDesieralizeWasRun = true
    }

});

Widget.subclass('DummyWidget', {

    description: "Dummy Widget for serialization",
    viewTitle: "Dummy Widget",
    initialViewExtent: pt(250, 260),

    initialize: function($super) { 
        $super();
        this.model = Record.newNodeInstance({MyText: "tada"});
        this.relayToModel(this.model, {MyText: "+MyText"});
        this.ownModel(this.model);
    },
    
    sayHello: function() {
        this.model.setMyText("Hello World");
    },
    
    buildView: function(extent) {
        this.panel = new Morph(new lively.scene.Rectangle(rect(pt(20,20), pt(150,150))));
        this.panel.setFill(Color.green);
        this.panel.widget = this; // backreference
        this.myMorph1 = new TextMorph(rect(pt(10,10), pt(100,30)), "text one", true);
        this.myMorph2 = new TextMorph(rect(pt(10,40), pt(100,60)), "text two", false);
        this.myMorph1.connectModel(this.model.newRelay({Text: "MyText"}));
        this.myMorph2.connectModel(this.model.newRelay({Text: "MyText"}));
        this.panel.addMorph(this.myMorph1);
        this.panel.addMorph(this.myMorph2);
        
        // this.panel.rawNode.appendChild(this.rawNode); // should we do this manually?
        this.panel.ownerWidget = this;
        return  this.panel;
    },

    onDeserialize: function() {
        this.onDesieralizeWasRun = true
    },
    
    open: function(){
        this.buildView();
        WorldMorph.current().addMorph(this.panel);
    }
});




TestCase.subclass('lively.Tests.SerializationTests.SerializationBaseTestCase', {

    /* For Serialization tests we need a own WorldMorph and thus a own SVG canvas */
    setUp: function($super) {
		$super();
        this.realWorld = WorldMorph.current();
        this.dom = stringToXML(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:lively="http://www.experimentalstuff.com/Lively" '+
                'xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xhtml="http://www.w3.org/1999/xhtml" '+
                'id="canvas" width="100%" height="100%" xml:space="preserve" '+
                'xmlns:xml="http://www.w3.org/XML/1998/namespace" zoomAndPan="disable">' +
                '<title>Lively Kernel canvas</title>' + 
            '</svg>').parentNode;
        this.oldGlobalDocument = Global.document; // importFromNodeList uses Global.document, so we fake it
        Global.document = this.dom;
        this.canvas = this.dom.documentElement;
        this.worldMorph = new WorldMorph(this.canvas);
        this.canvas.appendChild(this.worldMorph.rawNode);
        this.morphs = [];
        
        this.bounds = rect(pt(10,10), pt(100,100));
	    this.parentMorph =  Morph.makeRectangle(0,0, 300, 300);
    },
    
    tearDown: function() {
        WorldMorph.currentWorld = this.realWorld;
        this.morphs.each(function(each){ each.remove()})
        Global.document = this.oldGlobalDocument 
    },

    showMyWorld: function(optWorld) {
        if (optWorld) {
            this.worldMorph = optWorld
        };
        // for debugging
        var oldCanvas = document.getElementById('canvas');
        var owner = oldCanvas.parentElement;
        // hack, so that we do not run into a conflict: when calling importNode the canvas changes
        if (this.worldMorph.rawNode.parentNode) {
            this.worldMorph.rawNode.parentNode.removeChild(this.worldMorph.rawNode);
        };
        var newCanvas = document.importNode(this.canvas, true);

        var oldWorld = this.realWorld;
        oldWorld.onExit();    
        oldWorld.hands.clone().forEach(function(hand) {oldWorld.removeHand(hand)});
        oldWorld.suspendAllActiveScripts(); // ???
        oldWorld.remove();

        var newWorld = this.worldMorph;
        newWorld.displayOnCanvas(newCanvas); 
        newWorld.resumeAllSuspendedScripts();  

        owner.replaceChild(newCanvas, oldCanvas);     
    },

	fileContent: function(fileName) {
		var dir = new FileDirectory(URL.source);
		return dir.fileContent(fileName);
	},
	
	loadWorldFromFile: function(fileName) {
		return this.loadWorldFromSource(this.fileContent(fileName));
	},
	
    loadWorldFromSource: function(xmlString) {
        var xml = new DOMParser().parseFromString('<?xml version="1.0" standalone="no"?> ' + xmlString, "text/xml");
        this.doc = xml;   
        return new Importer().loadWorldContents(xml);
    },

    exportMorph: function(morph) {
        var exporter = new Exporter(morph);
        exporter.extendForSerialization();
        return exporter.rootMorph.rawNode
    },

    getFieldNamed: function(node, fieldName) {
        var result = $A(node.getElementsByTagName("field")).detect(function(ea) {
            return ea.getAttribute("name") == fieldName});
        this.assert(result, "" + node + " (id: " + node.id + ") no field named: " + fieldName);
        return result
    },

    getArrayNamed: function(node, fieldName) {
        var result = $A(node.getElementsByTagName("array")).detect(function(ea) {
            return ea.getAttribute("name") == fieldName});
        this.assert(result, "" + node + " (id: " + node.id + ") no array named: " + fieldName);
        return result
    }

});

thisModule.SerializationBaseTestCase.subclass('ASerializationTest', {
   
    testWorldMorphOnCanvas: function() {
        this.assert(this.worldMorph, 'No WorldMorph');
        this.assert(this.worldMorph.rawNode, 'RawNode');
        this.assertIdentity(this.worldMorph.rawNode.ownerDocument, this.dom, 'wrong owner');
        this.assert(this.dom.getElementById(this.worldMorph.rawNode.id), 'WorldMorph not on canvas');
    },

    testAddMorphAppendsRawNode: function() {
        var morph = Morph.makeRectangle(pt(100,200).extentAsRectangle());
        this.worldMorph.addMorph(morph);
        this.assert(this.dom.getElementById(morph.rawNode.id), 'rawNode not in DOM!');
        this.assert(this.worldMorph.submorphs.include(morph), 'rawNode not in DOM!');
        // this.showMyWorld();
    },
    
    testImportNode: function() {
        var string = 
            '<svg xmlns="http://www.w3.org/2000/svg" id="canvas">'+
                '<g type="Morph" id="101:Morph" transform="matrix(1 0 0 1 11 11)">'+
                    '<rect x="0" y="0" width="130" height="130" fill="rgb(250,250,250)"/>'+
                '</g>'+
            '</svg>';
        var xml = new DOMParser().parseFromString('<?xml version="1.0" standalone="no"?> ' + string, "text/xml");   
        this.assertEqual(xml.childNodes[0].childNodes[0].getAttribute("id"), "101:Morph");
        this.assert(xml.childNodes[0].childNodes[0].getAttribute("transform"), "has no transform");

        var node = Global.document.importNode(xml.childNodes[0].childNodes[0], true);
        this.assertEqual(node.id, "101:Morph", "imported node has no id");
        this.assert(node.transform, "imported nod has no transform");

        var morph = (new Importer()).importWrapperFromNode(node);
        this.assert(morph instanceof Morph, "result element is no morph")
        this.assert(morph.shape, "morph has  no shape")    
    },
    
    /* things learned:
     * the svg element is the canvas and is needed for deserialization
     */
    testLoadTwoMorphsWithoutWorld: function() {
        var world = this.loadWorldFromSource( 
            '<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
                '<g type="Morph" id="102:Morph" transform="matrix(1 0 0 1 11 11)">'+
                    '<rect x="0" y="0" width="100" height="100" fill="rgb(250,0,0)"/>'+
                '</g>'+
                '<g type="Morph" id="103:Morph" transform="matrix(1 0 0 1 50 50)">'+
                    '<rect x="0" y="0" width="100" height="100" fill="rgb(0,0,250)"/>'+
                '</g>'+
            '</svg>');
        this.assert(world instanceof WorldMorph, "world is no WorldMorph");
        this.assertEqual(world.submorphs.length, 2, "world hasn't two submorphs");
         
        //this.showMyWorld(world)
    },
    
    
    testRunOnDeserializeMorph: function() {
         var world = this.loadWorldFromSource( 
                '<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
                    '<g type="WorldMorph" id="1:WorldMorph" transform="matrix(1 0 0 1 0 0)" fill="rgb(255,255,255)">'+
                        '<rect x="0" y="0" width="800" height="600"/>' +
                        '<g type="DummyMorph" id="102:DummyMorph" transform="matrix(1 0 0 1 11 11)">'+
                            '<rect x="0" y="0" width="100" height="100" fill="rgb(250,0,0)"/>'+
                            '<field name="myWidget" ref="104:DummyWidget"></field>' +
                            '<widget id="104:DummyWidget">'   +                    
                            '</widget>' +  
                        '</g>'+
                    '</g>'+
                '</svg>');
        var morph1 = world.submorphs[0];
        var widget = morph1.myWidget;
        this.assertEqual(world.submorphs.length, 1, "world submorphs are wrong");
        this.assert(morph1 instanceof DummyMorph, " morph1 is no DummyMorph");
        this.assert(morph1.onDesieralizeWasRun, "onDesieralize was not run");

        this.assert(widget instanceof DummyWidget, " widget is no DummyWidget");
        this.assert(widget.onDesieralizeWasRun, "onDesieralize was not run in widget");

    },
    
    testLoadWorldWithTwoMorphs: function() {
        var world = this.loadWorldFromSource( 
            '<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
                '<g type="WorldMorph" id="1:WorldMorph" transform="matrix(1 0 0 1 0 0)" fill="rgb(255,255,255)">'+
                    '<rect x="0" y="0" width="800" height="600"/>' +
                    '<g type="Morph" id="102:Morph" transform="matrix(1 0 0 1 11 11)">'+
                        '<rect x="0" y="0" width="100" height="100" fill="rgb(250,0,0)"/>'+
                        '<field name="exampleAttributePointAsValue" family="Point"><![CDATA[{"x":12,"y":34}]]></field>' +
                        '<field name="exampleReference" ref="103:Morph"></field>' +
						'<array name="exampleArray">' +
							'<item><![CDATA["Hallo"]]></item>' +
							'<item ref="103:Morph"></item>' +
						'</array>' +
                    '</g>'+
                    '<g type="Morph" id="103:Morph" transform="matrix(1 0 0 1 50 50)">'+
                        '<rect x="0" y="0" width="100" height="100" fill="rgb(0,0,250)"/>'+
                        '<field name="exampleReference" ref="102:Morph"></field>' +
                    '</g>'+
                '</g>'+
            '</svg>');
        this.assert(world instanceof WorldMorph, "world is no WorldMorph");
        var morph1 = world.submorphs[0];
        var morph2 = world.submorphs[1];

        this.assertEqual(morph1.exampleAttributePointAsValue, pt(12,34),"exampleAttributePointAsValue failed");
        this.assertEqual(morph1.id(), "102:Morph", "wrong id");
        this.assertIdentity(morph1.exampleReference, morph2, "morph1 failed to reference morph2");
        this.assertIdentity(morph2.exampleReference, morph1, "morph2 failed to reference morph1");
		
		this.assertIdentity(morph1.owner, world, "morph1 owner is not the world");
        
		this.assert(morph1.exampleArray, "exampleArray is mising");
        this.assertEqual(morph1.exampleArray[0], "Hallo", "String in array failed");
        this.assertIdentity(morph1.exampleArray[1], morph2, "Referebce in array failed");
		
        //this.showMyWorld(show)
    },
    



    /*
     * - test an widget embedded into a morph and referenced from a different morph
     */
    testLoadWorldWithTwoMorphsAndWidget: function() {
        var world = this.loadWorldFromSource(
            '<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
                '<g type="WorldMorph" id="1:WorldMorph" transform="matrix(1 0 0 1 0 0)" fill="rgb(255,255,255)">'+
                    '<rect x="0" y="0" width="800" height="600"/>' +
                    '<g type="Morph" id="102:Morph" transform="matrix(1 0 0 1 11 11)">'+
                        '<rect x="0" y="0" width="100" height="100" fill="rgb(250,0,0)"/>'+
                        '<field name="exampleAttributePointAsValue" family="Point"><![CDATA[{"x":12,"y":34}]]></field>' +
                        '<field name="exampleReference" ref="103:Morph"></field>' +
                        '<field name="myWidget" ref="104:DummyWidget"></field>' +
                        '<widget id="104:DummyWidget">'   +
                            '<field name="myMorph1" ref="102:Morph"></field>' +
                            '<field name="myMorph2" ref="103:Morph"></field>' +
                            '<field name="myPointValue" family="Point"><![CDATA[{"x":3,"y":4}]]></field>' +
                            '<field name="formalModel" ref="105:anonymous_106"/>' +
                            '<field name="otherWidget" ref="106:DummyWidget"></field>' +
                            '<array name="myArray">' +
                                '<item ref="102:Morph"/>' +
                                '<item ref="103:Morph"/>' +
                            '</array>' +
                            '<record id="105:anonymous_106">' +
                                '<definition><![CDATA[{"Name":{},"Text":{"to":null}}]]></definition>' +
                                '<field name="Name"><![CDATA["EinName"]]></field>' +
                                '<field name="Text"><![CDATA["DiesIstKeinText"]]></field>' +
                            '</record>' +
                        '</widget>' +
                    '</g>'+
                    '<g type="Morph" id="103:Morph" transform="matrix(1 0 0 1 50 50)">'+
                        '<rect x="0" y="0" width="100" height="100" fill="rgb(0,0,250)"/>'+
                        '<field name="exampleReference" ref="102:Morph"></field>' +
                        '<field name="myWidget" ref="104:DummyWidget"></field>' +
                    '</g>'+
                    '<g type="Morph" id="107:Morph" transform="matrix(1 0 0 1 100 100)">'+
                        '<rect x="0" y="0" width="100" height="100" fill="rgb(0,250,250)"/>'+
                        '<field name="exampleReference" ref="102:Morph"></field>' +
                        '<field name="myWidget" ref="106:DummyWidget"></field>' +
                        '<widget id="106:DummyWidget">'   +
                            '<field name="otherWidget" ref="104:DummyWidget"></field>' +                
                        '</widget>' +        
                    '</g>'+
                '</g>'+
            '</svg>'); 
        var morph1 = world.submorphs[0];
        var morph2 = world.submorphs[1];
        var morph3 = world.submorphs[2];
                
        var widget = morph1.myWidget;
        var widget2 = morph3.myWidget;
        this.assert(widget instanceof DummyWidget, "morph1.myWidget is not DummyWidget");
        
        this.assertIdentity(morph1.myWidget, morph2.myWidget, "morph1.myWidget is not identical to morph2.myWidget");
        
        this.assert(widget.myMorph1, "widget.myMorph1 not set");
        this.assertIdentity(morph1, widget.myMorph1, "widget.morph1 is not identical to morph1");

        this.assert(widget.myPointValue, "widget.myPointValue not set");
        this.assert(widget.myArray, "widget.myArray not set"); 
 
        this.assert(widget.formalModel, "widget.formalModel not set"); 
      
        this.assertEqual(widget.formalModel.getName(), "EinName",  "widget.formalModel not set");
      
        this.assertIdentity(widget2.otherWidget, widget,  "backreference: widget2.otherWidget is not widget");
        this.assertIdentity(widget.otherWidget, widget2,  "forwardreference: widget.otherWidget is not widget2");
        
        //this.showMyWorld(world)
    },

	testLoadWidgetWithObservingMorph: function() {
        // generate with textmate replace: "(<.*>$)" with: "'$1' +"
        var world = this.loadWorldFromSource(
			'<svg xmlns="http://www.w3.org/2000/svg" id="canvas">' +
				'<g type="WorldMorph" id="529:WorldMorph">' +
					'<rect x="0" y="0" width="1280" height="1024" fill="url(#530:lively.paint.LinearGradient)"/>' +
					'<g type="Morph" id="536:Morph" transform="translate(20,20)">' +
						'<rect x="0" y="0" width="130" height="130" fill="rgb(0,204,0)"/>' +
						'<g type="TextMorph" id="537:TextMorph" transform="translate(10,10)">' +
							'<rect x="0" y="0" width="90" height="20" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(243,243,243)"/>' +
							'<g type="TextSelectionMorph" id="538:TextSelectionMorph" pointer-events="none" transform="translate(0,0)">' +
								'<g transform="matrix(1.000000 0.000000 0.000000 1.000000 0.000000 0.000000)" stroke-width="0" fill="none"/>' +
								'<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>' +
								'<field name="fullBounds" family="Rectangle"><![CDATA[{"x":-3,"y":-3,"width":6,"height":6}]]></field>' +
								'<field name="mouseHandler">null</field>' +
							'</g>' +
							'<text kerning="0" fill="rgb(0,0,0)" font-size="12" font-family="Helvetica"/>' +
							'<field name="textString"><![CDATA[""]]></field>' +
							'<field name="origin" family="Point"><![CDATA[{"x":10,"y":10}]]></field>' +
							'<field name="lines">null</field>' +
							'<field name="fullBounds">null</field>' +
							'<field name="textSelection" ref="538:TextSelectionMorph"/>' +
							'<relay name="formalModel" ref="533:anonymous_123">' +
								'<binding formal="Text" actual="MyText"/>' +
							'</relay>' +
						'</g>' +
						'<g type="TextMorph" id="539:TextMorph" transform="translate(10,40)">' +
							'<rect x="0" y="0" width="90" height="20" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(243,243,243)"/>' +
							'<g type="TextSelectionMorph" id="540:TextSelectionMorph" pointer-events="none" transform="translate(0,0)">' +
								'<g transform="matrix(1.000000 0.000000 0.000000 1.000000 0.000000 0.000000)" stroke-width="0" fill="none"/>' +
								'<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>' +
								'<field name="fullBounds" family="Rectangle"><![CDATA[{"x":-3,"y":-3,"width":6,"height":6}]]></field>' +
								'<field name="mouseHandler">null</field>' +
							'</g>' +
							'<text kerning="0" fill="rgb(0,0,0)" font-size="12" font-family="Helvetica"/>' +
							'<field name="textString"><![CDATA[""]]></field>' +
							'<field name="origin" family="Point"><![CDATA[{"x":10,"y":40}]]></field>' +
							'<field name="lines">null</field>' +
							'<field name="fullBounds">null</field>' +
							'<field name="textSelection" ref="540:TextSelectionMorph"/>' +
							'<relay name="formalModel" ref="533:anonymous_123">' +
								'<binding formal="Text" actual="MyText"/>' +
							'</relay>' +
						'</g>' +
						'<field name="origin" family="Point"><![CDATA[{"x":20,"y":20}]]></field>' +
						'<field name="fullBounds">null</field>' +
						'<field name="widget" ref="532:DummyWidget"/>' +
						'<field name="ownerWidget" ref="532:DummyWidget"/>' +
						'<widget id="532:DummyWidget">' +
							'<record id="533:anonymous_123">' +
								'<field name="MyText"><![CDATA["tada"]]></field>' +
								'<definition><![CDATA[{"MyText":{},"MyDynamicField":{}}]]></definition>' +
								'<field name="MyDynamicField"><![CDATA["Hip Hip Hurra!"]]></field>' +
							'</record>' +
							'<field name="model" ref="533:anonymous_123"/>' +
							'<relay name="formalModel" ref="533:anonymous_123">' +
								'<binding formal="MyText" actual="+MyText"/>' +
							'</relay>' +
							'<field name="actualModel" ref="533:anonymous_123"/>' +
							'<field name="panel" ref="536:Morph"/>' +
							'<field name="myMorph1" ref="537:TextMorph"/>' +
							'<field name="myMorph2" ref="539:TextMorph"/>' +
						'</widget>' +
					'</g>' +
					'<g type="TextMorph" id="534:TextMorph" transform="translate(0,0)">' +
						'<rect x="0" y="0" width="0" height="208.4" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(243,243,243)"/>' +
						'<g type="TextSelectionMorph" id="535:TextSelectionMorph" pointer-events="none" transform="translate(0,0)">' +
							'<g transform="matrix(1.000000 0.000000 0.000000 1.000000 0.000000 0.000000)" stroke-width="0" fill="none"/>' +
							'<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>' +
							'<field name="fullBounds" family="Rectangle"><![CDATA[{"x":-3,"y":-3,"width":6,"height":6}]]></field>' +
							'<field name="mouseHandler">null</field>' +
						'</g>' +
						'<text kerning="0" fill="rgb(0,0,0)" font-size="12" font-family="Helvetica">' +
							'<tspan x="6" y="14.8">H</tspan>' +
							'<tspan x="6" y="29.2">i</tspan>' +
							'<tspan x="6" y="43.6">p</tspan>' +
							'<tspan x="6" y="72.4">H</tspan>' +
							'<tspan x="6" y="86.79999999999998">i</tspan>' +
							'<tspan x="6" y="101.19999999999999">p</tspan>' +
							'<tspan x="6" y="130">H</tspan>' +
							'<tspan x="6" y="144.4">u</tspan>' +
							'<tspan x="6" y="158.8">r</tspan>' +
							'<tspan x="6" y="173.20000000000002">r</tspan>' +
							'<tspan x="6" y="187.60000000000002">a</tspan>' +
							'<tspan x="6" y="202.00000000000003">!</tspan>' +
						'</text>' +
						'<field name="textString"><![CDATA["Hip Hip Hurra!"]]></field>' +
						'<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>' +
						'<field name="lineNumberHint">13</field>' +
						'<field name="fullBounds">null</field>' +
						'<field name="textSelection" ref="535:TextSelectionMorph"/>' +
						'<relay name="formalModel" ref="533:anonymous_123">' +
							'<binding formal="Text" actual="MyDynamicField"/>' +
						'</relay>' +
						'<field name="undoTextString"><![CDATA[""]]></field>' +
						'<field name="delayedComposition">null</field>' +
						'<field name="textBeforeChanges"><![CDATA["Hip Hip Hurra!"]]></field>' +
					'</g>' +
					'<field name="owner">null</field>' +
					'<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>' +
					'<field name="fullBounds">null</field>' +
					'<array name="hands"/>' +
					'<array name="scheduledActions"/>' +
					'<field name="lastStepTime">1231605195931</field>' +
					'<field name="mainLoop">4856</field>' +
					'<field name="worldId">16</field>' +
					'<field name="enterCount">0</field>' +
				'</g>' +
			'</svg>');
			
			var widgetMorph = world.submorphs[0];
			var widget = widgetMorph.widget;
			var observerMorph = world.submorphs[1];
			
			
			var value = "Yeah!";
			widget.model.setMyDynamicField(value);
			this.assertEqual(observerMorph.getText(), value, "text did not observe my field even without serialization");
	
	
	},

    /* Serialize Tests */

    testSerializeMorph: function() {
            var morph = new Morph(new lively.scene.Rectangle(this.bounds));
        morph.simpleNumber = 12345;
        morph.simpleString = "eineZeichenkette";
		morph.arrayOfStrings = ["Hallo", "Welt"]
        this.worldMorph.addMorph(morph);
        var doc = Exporter.shrinkWrapMorph(this.worldMorph);
        
        this.assert(doc, "shrinkWrapMorph failed");
        var worldNode = doc.getElementById(this.worldMorph.id());
        this.assert(worldNode, "no world node by id found (" + this.worldMorph.id() + ")");
        var morphNode = doc.getElementById(morph.id());
        this.assert(morphNode, "no morph node by id found (" + morph.id() + ")"); 

        // console.log(Exporter.stringify(morphNode));
        /*
        <g xmlns="http://www.w3.org/2000/svg" type="Morph" id="171:Morph" transform="translate(10,10)">
           <rect x="0" y="0" width="90" height="90"/><field name="origin" family="Point"><![CDATA[{"x":10,"y":10}]]></field>
           <field name="fullBounds">null</field>
           <field name="simpleNumber">12345</field>
           <field name="simpleString"><![CDATA["eineZeichenkette"]]></field>
		   <array name="arrayOfStrings">
		      <item><![CDATA["Hallo"]]></item>
		      <item><![CDATA["Welt"]]></item>
		   </array>
        </g>
        */
        var numberNode = this.getFieldNamed(morphNode, "simpleNumber");
        this.assertEqual(numberNode.textContent, "12345", "simpleNumber failed");
        
        var stringNode = this.getFieldNamed(morphNode, "simpleString");    
        this.assertEqual(stringNode.textContent, '"eineZeichenkette"', "simpleString failed");

		var arrayNode = this.getArrayNamed(morphNode, "arrayOfStrings");
		 
    },

    testSerializeDummyWidget: function() {
		var widget = new DummyWidget();
		widget.sayHello(); 
		var view = widget.buildView();
		this.worldMorph.addMorph(view);

		var doc = Exporter.shrinkWrapMorph(this.worldMorph);
		var worldNode = doc.getElementById(this.worldMorph.id());
		this.assert(worldNode, "no world node by id found (" + this.worldMorph.id() + ")");

		var viewNode = doc.getElementById(view.id());
		this.assert(view, "no view node by id found (" + view.id() + ")");

		var widgetNode = doc.getElementById(widget.id());
		this.assert(widgetNode, "no widget node by id found (" + widget.id() + ")");

		var widgetNodeMyMorph1Field = this.getFieldNamed(widgetNode, "myMorph1");    
		this.assertEqual(widgetNodeMyMorph1Field.getAttribute("ref"), widget.myMorph1.id() ,"wrong ref to myMorph1");

		var widgetNodeMyMorph2Field = this.getFieldNamed(widgetNode, "myMorph2");
		this.assertEqual(widgetNodeMyMorph2Field.getAttribute("ref"), widget.myMorph2.id() ,"wrong ref to myMorph2");

		// console.log(Exporter.stringify(worldNode));
    },
    
    testSerializeDummyWidgetAddField: function() {
		var widget = new DummyWidget();
		widget.sayHello();
		widget.model.addField("MyDynamicField");
		this.assertEqualState(widget.model.definition, {MyText: {}, MyDynamicField: {}}, "dynamic definition missing");

		var view = widget.buildView();
		this.worldMorph.addMorph(view);
		var doc = Exporter.shrinkWrapMorph(this.worldMorph);
		var widgetNode = doc.getElementById(widget.id());
		var recordNode = widgetNode.firstChild;
		var definition = recordNode.firstChild;

		this.assertEqual(definition.textContent, '{"MyText":{},"MyDynamicField":{}}', "dynamic definition missing in serialization")
		//console.log(Exporter.stringify(widgetNode));
    },

	testSerializeFieldWithCoercion: function() {
		var widget = new DummyWidget();
		widget.sayHello();
		widget.model.addField("MyDynamicField", {to: String});
		this.assertEqualState(widget.model.definition, {MyText: {}, MyDynamicField: {}}, "dynamic definition missing");

		var view = widget.buildView();
		this.worldMorph.addMorph(view);
		var doc = Exporter.shrinkWrapMorph(this.worldMorph);
		var widgetNode = doc.getElementById(widget.id());
		var recordNode = widgetNode.firstChild;
		var definition = recordNode.firstChild;

		// This fails because, it is a functions can't be serialized in that way
		// we need something more declarative
		// this.assertEqual(definition.textContent, '{"MyText":{},"MyDynamicField":{to: String}}', 
		//    "dynamic definition with coercion specmissing in serialization")
		//console.log(Exporter.stringify(widgetNode));
    },
    
	testSerializeDynamicFieldObserver: function() {
		var widget = new DummyWidget();
		var observerMorph = new TextMorph();
		widget.model.addField("MyDynamicField");
 

		// offical way:
		observerMorph.connectModel(widget.model.newRelay({Text: "MyDynamicField"}));

		// manual way:
		//observerMorph.formalModel = widget.model.newRelay({Text: "MyDynamicField"});
		//widget.model.addObserver(observerMorph, {MyDynamicField: "!Text"});
		// FIXME we test the manual way beacaus Fabrik has problems with connectModel

		var value = "Hip Hip Hurra!";
		widget.model.setMyDynamicField(value);
		this.assertEqual(observerMorph.getText(), value, "text did not observe my field even without serialization");

		var view = widget.buildView();
		this.worldMorph.addMorph(view);
		this.worldMorph.addMorph(observerMorph);

		var doc = Exporter.shrinkWrapMorph(this.worldMorph);
		var widgetNode = doc.getElementById(widget.id());
		var recordNode = widgetNode.firstChild;
		var definition = recordNode.firstChild;

		// console.log(Exporter.stringify(doc));
		// console.log(Exporter.stringify(widgetNode));
	},
	
	

        
});
TestCase.subclass('ASelectionCopyAndPasteTest', {
	
	setUp: function() {
		this.selection = new SelectionMorph(new Rectangle(0,0,10,10));
		this.morph = new Morph.makeRectangle(new Rectangle(0,0,100,100));
		var morph = this.morph;
		this.selection.pasteDestinationMorph = function() {return morph};
	},
	
	tearDown: function() {
		delete this.selection;
		delete this.morph;
	},

	testPasteMorph: function() {
		var source = '\
			<g type="Morph" id="11746:Morph" transform="translate(920,104)">\
				<rect x="0" y="0" width="100" height="100" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(255,0,0)"/>\
				<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>\
				<field name="scalePoint" family="Point"><![CDATA[{"x":1,"y":1}]]></field>\
			</g>';
		var oldNum = this.morph.submorphs.length;
		this.selection.pasteFromSource(source);		
		this.assertEqual(oldNum + 1, this.morph.submorphs.length);	
	},
	
	testPasteSelection: function() {
		var source = '\
			<g xmlns="http://www.w3.org/2000/svg" type="Morph" id="889:Morph" transform="translate(0,0)">\
				<rect x="0" y="0" width="10" height="10" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(0,255,0)"/>\
				<g type="Morph" id="890:Morph" transform="translate(167,312)">\
					<rect x="0" y="0" width="100" height="100" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(255,0,255)"/>\
					<field name="origin" family="Point"><![CDATA[{"x":50,"y":50}]]></field>\
					<field name="scalePoint" family="Point"><![CDATA[{"x":1,"y":1}]]></field>\
				</g>\
				<g type="Morph" id="11746:Morph" transform="translate(920,104)">\
					<rect x="0" y="0" width="100" height="100" stroke-width="1" stroke="rgb(0,0,0)" fill="rgb(255,0,0)"/>\
					<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>\
					<field name="scalePoint" family="Point"><![CDATA[{"x":1,"y":1}]]></field>\
				</g>\
				<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>\
				<field name="isSelectionContainer">true</field>\
			</g>'
		var oldNum = this.morph.submorphs.length;
		this.selection.pasteFromSource(source);		
		this.assertEqual(this.morph.submorphs.length, oldNum + 2, "wrong number of morphs pasted");
	},
	
	testPasteMorphWithStyle: function() {
		var source = '\
			<defs id="SystemDictionary">\
				<linearGradient x1="0" y1="0" x2="0" y2="1" id="1394:lively.paint.LinearGradient">\
					<stop offset="0" stop-color="rgb(0,0,0)"/>\
					<stop offset="1" stop-color="rgb(255,255,255)"/>\
				</linearGradient>\
			</defs>\
			<g type="Morph" id="11746:Morph" transform="translate(10,10)">\
				<rect x="0" y="0" width="100" height="100" stroke-width="1" stroke="rgb(0,0,0)" fill="url(#1394:lively.paint.LinearGradient)"/>\
				<field name="origin" family="Point"><![CDATA[{"x":0,"y":0}]]></field>\
				<field name="scalePoint" family="Point"><![CDATA[{"x":1,"y":1}]]></field>\
			</g>';

		// delete this.selection.pasteDestinationMorph;		
		var oldMorphs = this.selection.pasteDestinationMorph().submorphs.clone();
		this.selection.pasteFromSource(source);
		var newMorphs = this.selection.pasteDestinationMorph().submorphs;
		var copy = newMorphs.detect(function(ea){return !oldMorphs.include(ea)});
		var fillUrl = copy.shape.rawNode.getAttribute('fill');
		var rawFill = lively.data.FragmentURI.getElement(fillUrl);
		this.assert(rawFill, "no rawFill found for " + fillUrl)
		var fillCopy =  copy.getFill();		
		this.assertEqual(fillCopy.constructor.name, "LinearGradient", "no fill in copy")
		this.assertEqual(oldMorphs.length + 1, newMorphs.length);	
	},
	
	testCalcTopLeftOfPoints: function() {
		this.assertEqualState(pt(6,5), this.selection.calcTopLeftOfPoints([pt(10,30), pt(20,5), pt(6,17)]))
	},

	stringToXml: function(xmlString) {
		return new DOMParser().parseFromString('<?xml version="1.0" standalone="no"?> ' + xmlString, "text/xml");
	},

	testCopySelection: function() {
		var m1 = Morph.makeRectangle(new Rectangle(10,10,20,20));
		var m2 = Morph.makeRectangle(new Rectangle(30,30,50,50));
		this.selection.selectedMorphs = [m1, m2];
		var string = this.selection.copyAsXMLString();	
		var xml = this.stringToXml(string);		
		var selectionNode = xml.childNodes[0];
	},

	testCopySelectionWithStyle: function() {
		var m1 = Morph.makeRectangle(new Rectangle(10,10,20,20));		
		m1.setFill(new lively.paint.LinearGradient([
			new lively.paint.Stop(0, Color.white), 
			new lively.paint.Stop(1, Color.red)],
			lively.paint.LinearGradient.NorthSouth));
		
		// WorldMorph.current().addMorph(m1);
	
		var fill = m1.getFill();	
		this.assert(m1.shape.rawNode.getAttribute("fill"), "shape has no fill url")
		this.assert(fill, "fill intialization failed")
		
		this.selection.selectedMorphs = [m1];
		
		var string = this.selection.copyAsXMLString();
		
		var xml = this.stringToXml(string);		
		var selectionNode = xml.childNodes[0];
		var systemDictionary = xml.getElementById("SystemDictionary");
		
		// console.log(string);
				
		this.assert(systemDictionary, "no system dictionary found");
		var rawFill = xml.getElementById(fill.id());
		this.assert(rawFill, "no raw fill found");
		
		// this.assert(false);
	},
	

});


TestCase.subclass('DomRecordTest', {

    testAddField: function() {
        this.model = Record.newNodeInstance({StaticField: null});
        this.assertEqualState(this.model.definition, {StaticField: {}});
        this.model.addField("DynamicField");
        this.assertEqualState(this.model.definition, {StaticField: {}, DynamicField: {}});
        this.assert(this.model.getDynamicField && this.model.setDynamicField);
    }
        
    
});

}) // end of module