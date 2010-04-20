/****************************************************
*                  Composer                         *
*                                                   *
*  License:     MIT (see: ../LICENSE.txt)           *
*  Copyright:   2010 Elijah Insua                   *
*  Description: Visual data and flow control editor *
****************************************************/
(function(window) {

  // Core composer factory
  var Composer = function(canvas, options, features) {

    // Require a canvas
    if (!canvas) {
      throw new Error("Composer requires a canvas element");
    }

    // sensible defaults for params
    features = features || [Renderer];

    var self  = options || {},
        version = "0.0.1";

    // Augment self with new properties
    self.__defineGetter__("version", function() { return version; });
    self.__defineGetter__("canvas", function() { return canvas; });

    // Hang a reference to this instance on the target canvas
    canvas.composer = self;

    Composer.create = self.create = function(obj, options, parts) {
      if (arguments.length === 2 && options && options.length) {
        parts = options;
      }
      parts = parts || [];
      var i   = 0,
          len = parts.length;

      obj.__defineGetter__("composer", function () { return self; });

      // Based on the incomming parts array, build out self.
      for (i; i<len; i++) {
        parts[i](obj, options);
      }

      return obj;
    }
    
    return self.create(self, null, features);
  };

  // Base canvas renderer
  var Renderer = Composer.Renderer = function(obj, options) {
    var stack = [],
        self  = {fps: 30} || options,
        timer,
        context = obj.canvas.getContext("2d");

    // Add getters to the base object
    obj.__defineGetter__("renderer", function() { return self; });

    // Add getters to this object
    self.__defineGetter__("length", function() { return stack.length; });
    self.__defineGetter__("context", function() { return context; });

    self.sort = function(fn) {
      fn = fn || function(a, b) {
        if (a.getPos && b.getPos) {
          return a.getPos().z - b.getPos().z;
        }
        return 0;
      };

      return stack.sort(fn);
    };

    self.add = function(renderable) {
      stack.push(renderable);
      stack = self.sort();
      renderable.renderer = self;
      return self;
    };

    self.remove = function(renderable) {
      var i=0; l=stack.length;

      for (i; i<l; i++) {
        if (stack[i] === renderable) {
          var start = stack.slice(0,i),
              rest  = stack.slice(i+1);
          start.push.apply(start, rest);
          stack = start;
          renderable.renderer = null;
        }
      }
      return self;
    };

    self.start = function() {
      timer = setInterval(function() {  
        context.fillStyle = "#000000";
        context.fillRect(0,0, obj.composer.canvas.width, obj.composer.canvas.height);

        var i=0, l=stack.length;
        for (i; i<l; i++) {
          stack[i].render();
        }

      }, 1000/self.fps);
    };
    
    self.stop = function() {
      clearInterval(timer);
    };

  };

  var Renderable = Composer.Renderable = function(obj, parts) {
    var size     = {height:0, width:0 },
        coords   = { x:0, y:0, z:0 },
        renderer = null;

    parts  = parts || [Collidable];
    // Set the position in 3d space
    obj.setPos = function(x,y,z) {
      coords = {x:x, y:y, z:z};
      return obj;
    };

    // Get the position in 3d space
    obj.getPos = function() {
      return coords;
    };

    // Get the 
    obj.getSize = function() {
      return size;
    };

    obj.setSize = function(width, height) {
      size = {width: width, height:height };
      return obj;
    };

    obj.render = function() {

    };

    // Automatically add the object to the stack
    if (obj.composer && obj.composer.renderer && obj.composer.renderer.add) {
      obj.composer.renderer.add(obj);
    }

    return obj;
  };

  var Collidable = Composer.Collidable = function(obj) {
    var self = {};

    obj.__defineGetter__("collides", function() { return self; });

    // Simple AABB collision detection
    self.aabb = function(x,y) {
      var pos  = obj.getPos(),
          size = obj.getSize();

      if (pos.x < x && x < pos.x+size.width && 
          pos.y < y && y < pos.y+size.height) 
      {
        return true;
      }
      return false;
    };

    return self;
  };

  // Expose thine self
  window.Composer = Composer;

})(window);