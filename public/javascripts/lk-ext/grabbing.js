Morph.addMethods({
    justReceivedDrop: function(m) {
      // children can override
    },

    onMouseMove: function(evt, hasFocus) { //default behavior
        if (evt.mouseButtonPressed && this==evt.hand.mouseFocus && this.owner && this.owner.openForDragAndDrop && this.okToBeGrabbedBy(evt)) { // why does LK not by default check okToBeGrabbedBy(evt)? -- Adam
            this.moveBy(evt.mousePoint.subPt(evt.priorPoint));
        } // else this.checkForControlPointNear(evt);
        if (!evt.mouseButtonPressed) this.checkForControlPointNear(evt);
    },


    morphToGrabOrReceive: function(evt, droppingMorph, checkForDnD) {
        // If checkForDnD is false, return the morph to receive this mouse event (or null)
        // If checkForDnD is true, return the morph to grab from a mouse down event (or null)
        // If droppingMorph is not null, then check that this is a willing recipient (else null)

        if (!this.fullContainsWorldPoint(evt.mousePoint)) return null; // not contained anywhere
        // First check all the submorphs, front first
        for (var i = this.submorphs.length - 1; i >= 0; i--) {
            var hit = this.submorphs[i].morphToGrabOrReceive(evt, droppingMorph, checkForDnD);
            if (hit != null) {
                //console.log(this + ">>morphToGrabOrReceive hit");
                return hit;  // hit a submorph
            }
        }

        // Check if it's really in this morph (not just fullBounds)
        if (!this.containsWorldPoint(evt.mousePoint)) return null;

        // If no DnD check, then we have a hit (unless no handler in which case a miss)
        if (!checkForDnD) return this.mouseHandler ? this : null;

        // On drops, check that this is a willing recipient
        if (droppingMorph != null) {
            return this.acceptsDropping(droppingMorph) ? this : null;
        } else {
            // On grabs, can't pick up the world or morphs that handle mousedown
            // DI:  I think the world is adequately checked for now elsewhere
            // else return (!evt.isCommandKey() && this === this.world()) ? null : this;
            return this.okToBeGrabbedBy(evt) ? this : null; // Modified to check okToBeGrabbedBy(evt) -- Adam, August 2008
        }

    },

    beUngrabbable: function() {if (!this.old_okToBeGrabbedBy) {this.old_okToBeGrabbedBy = this.okToBeGrabbedBy; this.okToBeGrabbedBy = function(evt) {return null;};}},
    beGrabbable:   function() {if ( this.old_okToBeGrabbedBy) {this.okToBeGrabbedBy = this.old_okToBeGrabbedBy; this.old_okToBeGrabbedBy = null;}},

  grabMe: function(evt) {
    // Had to do this to make the morph be right under the hand, and to get the drop shadows right.
    evt.hand.world().addMorphAt(this, evt.hand.position().subPt(this.getExtent().scaleBy(0.5)));
    evt.hand.grabMorph(this, evt);
  },

});
