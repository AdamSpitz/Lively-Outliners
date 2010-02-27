// aaa - What do I do with this?

function reflect(o) {
  var m = Object.create(lobby.mirror);
  m.initialize(o);
  return m;
}
