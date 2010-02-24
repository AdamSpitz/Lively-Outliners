<?xml version="1.0" encoding="utf-8"?>

<code>
<class name="Pen" super="Object">
 The Pen/Hilbert curve demo.

 <proto name="initialize"><![CDATA[ 
    function(loc) {
        this.location = (loc !== undefined) ? loc : WorldMorph.current().bounds().center();
        this.penWidth = 2;
        this.penColor = Color.blue;
        this.fillColor = null;
        this.heading = 0;
        this.newLine(this.location); 
    }]]></proto>
    

<proto name="setPenColor"><![CDATA[
    function(color) { 
        this.penColor = color; 
    }]]></proto>
    
<proto name="setPenWidth"><![CDATA[ 
    function(size) { 
        this.penWidth = size; 
    }]]></proto>
    
<proto name="turn"><![CDATA[
    function(degrees) { 
        this.heading += degrees; 
    }]]></proto>
    
<proto name="go"><![CDATA[ 
    function(dist) { 
        this.location = this.location.addPt(Point.polar(dist, this.heading.toRadians()));
        this.vertices.push(this.location); 
    }]]></proto>
    
<proto name="drawLines"><![CDATA[ 
    function() {
        var morph;

        if (this.fillColor) {
            morph = new Morph(new lively.scene.Polygon(this.vertices));
            morph.setFill(this.fillColor);
        } else {
            morph = new Morph(new lively.scene.Polyline(this.vertices));
            morph.setFill(null);
        }
        morph.setBorderWidth(this.penWidth);
        morph.setBorderColor(this.penColor);
    
        WorldMorph.current().addMorph(morph); 
    
/* if (morph.world().backend())
        morph.world().backend().createMorph(morph.morphId(), morph, morph.world().morphId());
*/

        return morph;
    }]]></proto>
    
<proto name="fillLines"><![CDATA[
     function(color) { 
        this.fillColor = color; 
        return this.drawLines();
    }]]></proto>
    
<proto name="hilbert"><![CDATA[ 
     function(n,s) {
        // Draw an nth level Hilbert curve with side length s.
        if (n == 0) 
            return this.turn(180);
    
        if (n > 0) { 
            var a = 90;  
            var m = n - 1; 
        } else { 
            var a = -90;  
            var m = n + 1; 
        }
        
        this.turn(a); 
        this.hilbert(0 - m, s);
        this.turn(a); 
        this.go(s); 
        this.hilbert(m, s);
        this.turn(0 - a); 
        this.go(s); 
        this.turn(0 - a); 
        this.hilbert(m, s);
        this.go(s); 
        this.turn(a); 
        this.hilbert(0 - m, s);
        this.turn(a); 
    }]]></proto>
    
<proto name="filbert"><![CDATA[
    function(n, s, color) {
        // Two Hilbert curves form a Hilbert tile
        this.newLine();  
        this.setPenColor(Color.black); 
        this.setPenWidth(1);
        this.hilbert(n, s); 
        this.go(s);
        this.hilbert(n, s); 
        this.go(s);
        return this.fillLines(color); 
    }]]></proto>
    
<proto name="newLine"><![CDATA[ 
    function(loc) {
        this.startingLocation = loc ? loc : this.location;
        this.vertices = [ this.startingLocation ];
    }]]></proto>
    
<proto name="filberts"><![CDATA[ 
    function(n, s) {
        // Four interlocking filberts
        var n2 = Math.pow(2,n-1);
        var morphs = [ ];
    
        for (var i = 0; i < 4; i++) {
            morphs.push(this.filbert(n, s, Color.wheel(4)[i]));
            this.go((n2 - 1)*s); 
            this.turn(-90); 
            this.go(n2 * s); 
            this.turn(180);
        }

        return morphs; 
    }]]></proto>


<static name="hilbertFun"><![CDATA[ 
    function(world, loc) {
// The menu-driven filled Hilbert curve demo
    var orderMenu = new MenuMorph([]);

    for (var i=0; i<=5; i++) {
        orderMenu.addItem([i.toString(), orderMenu, "makeFilberts", i]);
    }

    orderMenu.makeFilberts = function(order) {
        if (this.morphs) for (var i=0; i<4; i++) this.morphs[i].remove();
        if (i=0) { this.morphs == null; return; }
        var P = new Pen();
        this.morphs = P.filberts(order,5);
    };

    orderMenu.openIn(world, loc, true, "Hilbert Fun");
}]]></static>


<static name="script"><![CDATA[ 
// The default script for the Pen/Hilbert demo
["P = new Pen();",
"P.setPenColor(Color.red);",
"for (var i=1; i<=40; i++)",
"    { P.go(2*i); P.turn(89); };",
"P.drawLines();",
""].join("\n")


]]></static>
</class>
</code>
