Object.subclass("CacheInvalidator", {
  initialize: function() {
    this.timestamp = 0;
  },

  invalidate: function() {
    ++ this.timestamp;
  },

  is_cache_valid_if_last_updated_at: function(t) {
    return this.timestamp == t;
  },
});

Object.subclass("Cache", {
  initialize: function(invalidator, f) {
    this.invalidator = invalidator;
    this.get_updated_value = f;
  },

  is_valid: function() {
    return this.invalidator.is_cache_valid_if_last_updated_at(this.timestamp_when_last_updated);
  },

  invalidate_if_necessary: function() {
    if (! this.is_valid()) {
      this.invalidate();
    }
  },

  invalidate: function() {
    this.cached_value = null;
  },

  value: function() {
    this.invalidate_if_necessary();
    if (this.cached_value == null) {
      this.cached_value = this.get_updated_value();
      this.timestamp_when_last_updated = this.invalidator.timestamp;
    }
    return this.cached_value;
  },
});
