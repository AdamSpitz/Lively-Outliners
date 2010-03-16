function exitValueOf(f) {
  var exitToken = {};
  var exiter = function(v) {
    exitToken.value = v;
    throw exitToken;
  };
  try {
    return f(exiter);
  } catch (exc) {
    if (exc === exitToken) {
      return exc.value;
    } else {
      // must be some other exception
      throw exc;
    }
  }
}
