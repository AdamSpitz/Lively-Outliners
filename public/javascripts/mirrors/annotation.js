Object.subclass("ObjectAnnotation", {
  slotAnnotations: function() {
    return this._slotAnnotations || (this._slotAnnotations = {});
  },
});

Object.subclass("SlotAnnotation", {
});
