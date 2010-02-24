var is_proto_property_supported = {}.__proto__ !== undefined;
if (! is_proto_property_supported) {
  alert("We're not in Safari or Firefox, right?");
}
