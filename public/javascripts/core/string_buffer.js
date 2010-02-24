function StringBuffer(initialString) {
   this.buffer = [];
   if (initialString != null) {this.append(initialString);}
 }

StringBuffer.prototype.append = function append(string) {
  this.buffer.push(string);
  return this;
};

StringBuffer.prototype.toString = function toString() {
  return this.buffer.join("");
};
