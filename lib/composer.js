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

    self.sort = function(fn, save) {
      fn = fn || function(a, b) {
        if (a.getPos && b.getPos) {
          return a.getPos().z - b.getPos().z;
        }
        return 0;
      };
      
      var sorted = stack.sort(fn);
      if (save) {
        stack = sorted;
      }
      return sorted;
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
        if (timer) {
          context.fillStyle = "#000000";
          context.fillRect(0,0, obj.composer.canvas.width, obj.composer.canvas.height);

          var i=0, l=stack.length;
          for (i; i<l; i++) {
            stack[i].render();
          }
        }
      }, 1000/self.fps);
    };
    
    self.stop = function() {
      clearInterval(timer);
      timer = false;
    };

  };

  var Renderable = Composer.Renderable = function(obj, parts) {
    var size     = {height:0, width:0 },
        coords   = { x:0, y:0, z:0 },
        renderer = null;

    parts  = parts || [Collidable];
    // Set the position in 3d space
    obj.setPos = function(x,y,z) {
      var sort = (z !== coords.z);
      coords = {x:x, y:y, z:z};
      if (sort) {
        obj.renderer.sort(false, true);
      }
      return obj;
    };

    obj.__defineGetter__("x", function(value) { return coords.x });
    obj.__defineGetter__("y", function(value) { return coords.y });
    obj.__defineGetter__("z", function(value) { return coords.z });

    
    
    obj.__defineSetter__("x", function(value) {
      var sort = (value !== coords.x);
      coords.x = value;
      if (sort) {
        obj.renderer.sort(false,true);
      }
    });

    obj.__defineSetter__("y", function(value) {
      var sort = (value !== coords.y);
      coords.y = value;
      if (sort) {
        obj.renderer.sort(false,true);
      }
    });

    obj.__defineSetter__("z", function(value) {
      var sort = (value !== coords.z);
      coords.z = value;
      if (sort) {
        obj.renderer.sort(false,true);
      }
    });


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

  var DragManager = Composer.DragManager = function(obj) {
    var mx=0, my=0, node = false, draggables = [], self = {};

    document.addEventListener("mousemove", function(ev) {
     
      mx = ev.clientX - (obj.composer.canvas.offsetLeft - window.pageXOffset);
      my = ev.clientY - (obj.composer.canvas.offsetTop  - window.pageYOffset);
     
      if (node) {
        ev.canvasOffset = {x:mx, y:my};
        node.dragging(ev);
      }
    }, true);

    obj.__defineGetter__("dragmanager", function() {
      return self;
    });

    self.add = function(draggable) {
      // TODO: check for collides member
      draggables.push(draggable);
    };

    // TODO: add remove
    document.addEventListener("mousedown", function(ev) {
      var i=0; l=draggables.length, highestZ = null;
      for (i; i<l; i++) {
        if (draggables[i].collides.aabb(mx, my)) {
          if (!highestZ || draggables[i].getPos().z > highestZ.z) {
            highestZ = draggables[i];
          }
        }
      }
      
      if (highestZ) {
        node = highestZ;
        ev.canvasOffset = {x:mx, y:my};
        node.dragstart(ev);
      }
      
      
    }, true);

    document.addEventListener("mouseup", function(ev) {
       if (node) {
         node.dragend(ev);
       }
       node = false;
    }, true);

  };
  
  var Draggable = Composer.Draggable = function(obj) {
    var mouseOffset = {x:0, y:0};

    obj.__defineGetter__("mouseOffset", function() { return mouseOffset; });

    // Register this obj with the drag manager
    obj.dragstart = function(ev) {
      obj.setPos(obj.getPos().x, obj.getPos().y, 100);
      mouseOffset = {x:ev.canvasOffset.x-obj.getPos().x, y:ev.canvasOffset.y-obj.getPos().y};
    };
    
    obj.dragging = function(ev) {
      obj.setPos(ev.canvasOffset.x-mouseOffset.x, ev.canvasOffset.y-mouseOffset.y, 100);
    };
    
    obj.dragend = function(ev) {
      mouseOffset = {x:0, y:0};
      obj.setPos(obj.getPos().x, obj.getPos().y, 0);
    };

    // Register this node with the DragManager
    obj.composer.dragmanager.add(obj);
  }


  // Expose thine self
  window.Composer = Composer;

})(window);