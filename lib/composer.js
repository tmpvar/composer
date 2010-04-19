/****************************************************
*                  Composer                         *
*                                                   *
*  License:     MIT (see: ../LICENSE.txt)           *
*  Copyright:   2010 Elijah Insua                   *
*  Description: Visual data and flow control editor *
*****************************************************/
(function(window) {
  
  // Core composer factory
  var Composer = function(canvas, options, parts) {
    // sensible defaults for params
    parts = parts   || [Renderer];

    var self  = options || {},
        version = "0.0.1",
        i       = 0,
        len     = parts.length;

    // Augment self with new properties
    self.__defineGetter__("version", function() { return version; });
    self.__defineGetter__("canvas", function() { return canvas; });

    // Hang a reference to this instance on the target canvas
    canvas.composer = self;

    // Based on the incomming parts array, build out self.
    for (i; i<len; i++) {
      parts[i](self);
    }

    return self;
  };

  // Base canvas renderer
  var Renderer = function(obj) {
    return 1;
  };

  // Expose thine self
  window.Composer = Composer;

})(window);