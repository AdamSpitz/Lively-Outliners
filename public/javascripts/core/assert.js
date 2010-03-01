function assert(b, msg) {
  if (! b) {
    throw msg || "Assertion failure!";
  }
}
