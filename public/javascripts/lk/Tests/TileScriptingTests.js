module('lively.Tests.TileScriptingTests').requires('lively.TestFramework', 'lively.TileScripting').toRun(function(thisModule) {

TestCase.subclass('lively.Tests.TileScriptingTests.TileHolderTest', {
    
    testAddNewDropWhenExistingOneWasUsed: function() {
        var holder = new lively.TileScripting.TileHolder(pt(50,50).extentAsRectangle());
        var tile = new lively.TileScripting.Tile();
        
        this.assertEqual(holder.submorphs.length, 1, 'More or less than one submorph');
        this.assert(holder.submorphs[0].isDropArea, 'No DropArea');
        // debugger;
        holder.submorphs[0].addMorph(tile);
        this.assertEqual(holder.submorphs.length, 2, 'No new DropArea added');
        this.assert(holder.submorphs[1].isDropArea, 'No DropArea');
    },
    
    testTilesAsJs: function() {
        var holder = new lively.TileScripting.TileHolder(pt(50,50).extentAsRectangle());
        var tile1 = new lively.TileScripting.DebugTile(null, '123');
        var tile2 = new lively.TileScripting.DebugTile(null, 'console.log(\'hello world\')');
        var expected = '123;\nconsole.log(\'hello world\')';
        holder.submorphs.last().addMorph(tile1);
        holder.submorphs.last().addMorph(tile2);
        var result = holder.tilesAsJs();
        this.assertEqual(expected,result);
    },
    
    testRunScript: function() {
        var sut = new lively.TileScripting.TileHolder(pt(50,50).extentAsRectangle());
        var tile = new lively.TileScripting.DebugTile(null, '123;');
        sut.submorphs.last().addMorph(tile);
        var result = sut.runScript();
        this.assertIdentity(123, result);
    }
});

TestCase.subclass('lively.Tests.TileScriptingTests.DropAreaTest', {
    
    testDropAcceptsTile: function() {
        var drop = new lively.TileScripting.DropArea();
        var tile = new lively.TileScripting.Tile();
        
        drop.addMorph(tile);
        this.assertIdentity(tile.owner, drop);
        this.assert(drop.submorphs.include(tile));
    },
    
    testDropAcceptsOnlyOneTile: function() {
        var drop = new lively.TileScripting.DropArea();
        var tile1 = new lively.TileScripting.Tile();
        var tile2 = new lively.TileScripting.Tile();
        
        drop.addMorph(tile1);
        drop.addMorph(tile2);
        this.assertIdentity(tile1.owner, drop);
        this.assert(!tile2.owner, 'tile 2 has a owner...');
        this.assert(!drop.submorphs.include(tile2), 'tile 2 was added to dropArea');
    },
    
    testResizeWhenTileAdded: function() {
        var drop = new lively.TileScripting.DropArea(pt(20,20).extentAsRectangle());
        var tile = new lively.TileScripting.Tile(pt(50,50).extentAsRectangle());
        drop.addMorph(tile);
        this.assertEqual(drop.getExtent(), tile.getExtent(), 'no resizing...');
    },
    
    testCreateTileFromMorph: function() {
        var morph = Morph.makeRectangle(pt(20,20).extentAsRectangle());
        var result = morph.asTile();
        
        this.assertIdentity(morph, result.targetMorph);
        this.assertEqual(morph.id(), result.objectId());
    }
});

TestCase.subclass('lively.Tests.TileScriptingTests.ObjectTileTest', {
   
        // var morph = new Morph(new Rectangle(10,10,110,210));
        // morph.closeDnD();
        // morph.handlesMouseDown = Functions.True;
        // morph.onMouseDown = function() { console.log('clicked')};
        // morph.openInWorld();
         
    testAcceptsMorph: function() {
        var tile = new lively.TileScripting.ObjectTile();
        var morph = Morph.makeRectangle(pt(20,20).extentAsRectangle());
        tile.createAlias(morph);
        this.assertEqual(tile.objectId(), morph.id(), 'Morph id not added ti tile');
    },
    
    testTileMenuSpecCreation: function() {
        Object.subclass('Dummy', { a: function() {}, b: function() {}, c: 123});
        var obj = new Dummy();
        var sut = new lively.TileScripting.TileMenuCreator(obj);
        
        var classNames = sut.classNames();
        this.assertEqualState(classNames, ['Dummy']);
        
        var methodNames = sut.methodNamesFor('Dummy');
        this.assertEqualState(methodNames, ['a', 'b']);
    },
    
    testTileMenuCreation: function() {
        Object.subclass('Dummy', { a: function() {}, b: function() {}, c: 123});
        var obj = new Dummy();
        var sut = new lively.TileScripting.TileMenuCreator(obj);
        
        var menu = sut.createMenu();
        this.assertEqual(menu.items.length, 1, 'wrong number of menu items');
    },
    
    testAsJsEval: function() {
        var tile = new lively.TileScripting.ObjectTile();
        var morph = Morph.makeRectangle(pt(20,20).extentAsRectangle());
        
        tile.createAlias(morph);
        morph.openInWorld();
        try { var foundMorph = eval(tile.asJs()); }
        finally { morph.remove(); };
        this.assertIdentity(foundMorph, morph);
    },
    
    testAsJsWithFunction: function() {
        var tile = new lively.TileScripting.ObjectTile();
        var morph = Morph.makeRectangle(pt(20,20).extentAsRectangle());
        
        tile.createAlias(morph);
        tile.addFunctionTile('getPosition');
        
        morph.openInWorld();
        try { var js = tile.asJs(); }
        finally { morph.remove(); };
        this.assertEqual(js, 'lively.TileScripting.ObjectTile.findMorph(\'' + morph.id() + '\').getPosition()');
    }
});

TestCase.subclass('lively.Tests.TileScriptingTests.FunctionTileTest', {
    
    testHasTextAndDropZone: function() {
        var tile = new lively.TileScripting.FunctionTile(null, 'test');
        this.assertEqual(tile.submorphs.length, 3, 'text or dropzone are missing');
        this.assert(tile.submorphs[1].isDropArea, 'no droparea');
    },
    
    testAsJsWithParameters: function() {
        var tile = new lively.TileScripting.FunctionTile(null, 'test');
        var argTile1 = new lively.TileScripting.DebugTile(null, '123');
        var argTile2 = new lively.TileScripting.DebugTile(null, '456');
        tile.argumentDropAreas.last().addMorph(argTile1);
        tile.argumentDropAreas.last().addMorph(argTile2);
        var js = tile.asJs()
        var expected = '.test(123,456)';
        this.assertEqual(js, expected);
    }
});

TestCase.subclass('lively.Tests.TileScriptingTests.IfTileTest', {
    
    testCanAddExprAndTestExpression: function() {
        var tile = new lively.TileScripting.IfTile();
        var testTile = new lively.TileScripting.Tile();
        this.assert(tile.testExprDropArea instanceof Morph, 'No testExpression morph');
        tile.testExprDropArea.addMorph(testTile);        
        this.assertIdentity(testTile, tile.testExprDropArea.tile());
        
        this.assert(tile.exprDropArea instanceof Morph, 'No expr morph');
        var exprTile = new lively.TileScripting.Tile();
        tile.exprDropArea.addMorph(exprTile);
        this.assertIdentity(exprTile, tile.exprDropArea.tile());
    },
    
    testGetJs: function() {
        var tile = new lively.TileScripting.IfTile();
        var testTile = new lively.TileScripting.DebugTile(null,'test');
        var exprTile = new lively.TileScripting.DebugTile(null,'body');
        tile.testExprDropArea.addMorph(testTile);
        tile.exprDropArea.addMorph(exprTile);
        var expected = 'if (test) {body}';
        this.assertEqual(tile.asJs(), expected);
    }
});

TestCase.subclass('lively.Tests.TileScriptingTests.NumberTileTest', {
    
    testHasNumberTextAndTwoButtons: function() {
        var tile = new lively.TileScripting.NumberTile();
        this.assert(tile.numberText instanceof TextMorph, 'no numberText');
        this.assertEqual(tile.numberText.textString, '1');
        this.assert(tile.upButton instanceof ButtonMorph, 'no upBtn');
        this.assert(tile.downButton instanceof ButtonMorph, 'no upBtn');
    },
    
    testCountUp: function() {
        var tile = new lively.TileScripting.NumberTile();
        tile.numberText.setTextString('0.8');
        tile.countUp();
        this.assertEqual(tile.numberText.textString, '0.9');
        tile.countUp();
        this.assertEqual(tile.numberText.textString, '1');
        tile.countUp();
        this.assertEqual(tile.numberText.textString, '2');
    },
    
    testCountDown: function() {
        var tile = new lively.TileScripting.NumberTile();
        tile.numberText.setTextString('2');
        tile.countDown();
        this.assertEqual(tile.numberText.textString, '1');
        tile.countDown();
        this.assertEqual(tile.numberText.textString, '0.9');
        tile.countDown();
        this.assertEqual(tile.numberText.textString, '0.8');
    },
    
    testAsJs: function() {
        var tile = new lively.TileScripting.NumberTile();
        tile.numberText.setTextString('2');
        this.assertEqual(tile.asJs(), '2');
    }
});

TestCase.subclass('LayoutTests', {
    
    setUp: function() {
        this.baseMorph = Morph.makeRectangle(new Rectangle(0,0,50,200));
    },
    
    assertAbove: function(m1, m2) {
        this.assert(m2.getPosition().y >= m1.getPosition().y + m1.getExtent().y,
                    m1 + '('+ m1.getPosition() + ') not above ' + m2 + '(' + m2.getPosition() + ')');
    },
    
    assertLeft: function(m1, m2) {
        this.assert(m2.getPosition().x >= m1.getPosition().x + m1.getExtent().x,
                    m1 + '('+ m1.getPosition() + ') not left from ' + m2 + '(' + m2.getPosition() + ')');
    },
    
    assertSubmorphsDoNoOverlap: function(morph) {
        morph.submorphs.each(function(ea) {
            morph.submorphs.each(function(ea2) {
                // cannot use simple bounds() anymore because of borderWidth since rev 2764
                var rect1 = ea.shape.bounds().translatedBy(ea.getPosition());
                var rect2 = ea2.shape.bounds().translatedBy(ea2.getPosition());
                this.assert(ea === ea2 || !rect1.intersects(rect2),
                    ea.constructor.type + ' overlaps ' + ea2.constructor.type);
            }, this); 
        }, this);
    },    
    assertMorphsInsideBounds: function(morph) {
        morph.submorphs.each(function(ea) {
            this.assert(morph.shape.bounds().containsRect(ea.shape.bounds()), 'Morph: ' + ea + ' overlaps its ownerBounds!');
        }, this)
    },
    
    testVLayoutThreeMorphsAboveEachOther: function() {
        var sut = new VLayout(this.baseMorph);
        this.assertIdentity(sut.baseMorph, this.baseMorph);
        var morph1 = Morph.makeRectangle(0,0,20,30),
            morph2 = Morph.makeRectangle(0,0,30,40),
            morph3 = Morph.makeRectangle(0,0,10,90);
        this.baseMorph.addMorph(morph1);
        this.baseMorph.addMorph(morph2);
        this.baseMorph.addMorph(morph3);
        sut.layout();
        this.assertAbove(morph1, morph2);
        this.assertAbove(morph1, morph3);
        this.assertAbove(morph2, morph3);
    },
    
    testHLayoutTwoMorphsHorizontalAndResize: function() {
        var sut = new HLayout(this.baseMorph, {noResize: false});
        var morph1 = Morph.makeRectangle(0,0,20,30),
            morph2 = Morph.makeRectangle(0,0,30,40);
        this.baseMorph.addMorph(morph1);
        this.baseMorph.addMorph(morph2);
        sut.layout();
        this.assertLeft(morph1, morph2);
        this.assertEqual(sut.baseMorph.getExtent(), pt(50, 40));
    },
    
    testHLayoutCenterMorphs: function() {
        var sut = new HLayout(this.baseMorph, {center: true});
        var morph1 = Morph.makeRectangle(0,0,20,20),
            morph2 = Morph.makeRectangle(0,0,40,40);
        this.baseMorph.addMorph(morph1);
        this.baseMorph.addMorph(morph2);
        this.baseMorph.setPosition(pt(100,200));
        sut.layout();
        this.assertLeft(morph1, morph2);
        this.assertEqual(sut.baseMorph.getExtent(), pt(60, 40));
        this.assertMorphsInsideBounds(sut.baseMorph);
        this.assertSubmorphsDoNoOverlap(sut.baseMorph);
        this.assertEqual(morph1.getPosition().y, 10);
    }
})

});