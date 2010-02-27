String.prototype.startsWithVowel = function() {
  return (/^[AEIOUaeiou]/).exec(this);
};

String.prototype.prependAOrAn = function() {
  return this.startsWithVowel() ? "an " + this : "a " + this;
};
