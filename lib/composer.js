/******************************************************
*                  Composer                           *
*                                                     *
*  License:     MIT (see: ../LICENSE.txt)             *
*  Copyright:   2010 Elijah Insua                     *
*  Description: Visual data and flow control editor   *
******************************************************/
(function(window) {
  var lastId = 0;
  
  // Core composer factory
  var Composer = function(canvas, options, features) {
    
    // Require a canvas
    if (!canvas) {
      throw new Error("Composer requires a canvas element");
    }

    // sensible defaults for params
    features = features || [Renderer];
    options = options || {};
    var self = options, version = "0.0.1";

    // Augment self with new properties
    self.__defineGetter__("version", function() { return version; });
    self.__defineGetter__("canvas", function() { return canvas; });

    // Hang a reference to this instance on the target canvas
    canvas.composer = self;

    Composer.create = self.create = function(obj, options, parts) {
      var myId = lastId++;
      
      if (arguments.length === 2 && options && options.length) {
        parts = options;
      }
      parts = parts || [];
      var i   = 0,
          len = parts.length;

      obj.composer = self;
      obj.id = myId;
      // Based on the incomming parts array, build out self.
      for (i; i<len; i++) {
        parts[i](obj, options);
      }

      return obj;
    };
    
    return self.create(self, options, features);
  };

  // Base canvas renderer
  var Renderer = Composer.Renderer = function(obj, options) {
    var stack = [], stackToRender = [],
        self  = {fps: 30} || options,
        timer,
        context = obj.canvas.getContext("2d"),
        dirtyNodes = [],
        backgroundColor = "#000000",
        clearRects = [];
    
    // Add getters to the base object
    obj.__defineGetter__("renderer", function() { return self; });

    self.addDirty = function(node) {
      dirtyNodes.push(node);
    };
    
    self.removeDirty = function(node) {
      var i=0; l=dirtyNodes.length;

      for (i; i<l; i++) {
        if (dirtyNodes[i] === node) {
          var start = dirtyNodes.slice(0,i),
              rest  = dirtyNodes.slice(i+1);
          start.push.apply(start, rest);
          dirtyNodes = start;
        }
      }
    };
    
    // DO NOT DO THIS.
    self.stack = stack;
    
    self.dirty = true;
    
    // Add getters to this object
    self.__defineGetter__("length", function() { return stack.length; });
    self.__defineGetter__("context", function() { return context; });

    self.sort = function(fn, save) {
      fn = fn || function(a, b) {
        if (a.z !== b.z) {
          return a.z - b.z;
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
      //self.sort(false, true);
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
    
    self.addClearRect = function(x, y, width, height) {
      clearRects.push({x: x, y:y, width:width, height:height });
    };
    
    self.clearRects = function() {
      var i=0, l=clearRects.length, r;
      for (i; i<l; i++) {
        r = clearRects[i];
        context.fillStyle = backgroundColor;
        context.fillRect(r.x,r.y,r.width,r.height);
      }
      clearRects = [];
    };
    
    // TODO: remove
    var firstRender = true;
    
    self.render = function(fn) {  
      if (fn) {
       fn();
      }
      
      var needsRender = false, stackToRender = [];
      if (self.dirty) {
        
        firstRender = false;
        var i=0; l=stack.length;
        for (i; i<l; i++) {
          var ox = stack[i].x, oy = stack[i].y, size = stack[i].getSize(); 

          if (stack[i].composer.hasOwnProperty('x') && 
              stack[i].composer.hasOwnProperty('y') && 
              stack[i].composer !== stack[i]) 
          {
            ox += stack[i].composer.x;
            oy += stack[i].composer.y;
          }        

          if ((ox >= 0 || ox + size.width >= 0) && (size.width + ox <= obj.canvas.width || ox <= obj.canvas.width) &&
              (oy >= 0 || oy + size.height >= 0) && (size.height + oy <= obj.canvas.height || oy <= obj.canvas.height)) 
          {
            stackToRender.push(stack[i]);
          }
        }

        // clear the entire canvas and start from scratch
        if (self.dirty) {
          context.fillStyle = backgroundColor;
          context.fillRect(0,0, obj.composer.canvas.width, obj.composer.canvas.height);
        }
        needsRender = true;
        // Partial rendering
      } else if (dirtyNodes.length > 0) {
        dirtyToRender = [];

        var si=0, sl = stack.length, di = 0, dl = dirtyNodes.length;
        for (si; si<sl; si++) {
          
          for (di=0; di<dl; di++) {
            if (dirtyNodes[di] === stack[si]) {
              dirtyToRender.push(dirtyNodes[di]);
              break;
            }
          }
        }
        
        stackToRender = dirtyToRender;
        dirtyNodes = [];
        needsRender = true;
      }

      
      if (needsRender && stackToRender.length > 0) {
      
        var data;
        self.clearRects();
        self.dirty = false;
        
        if (obj.hasOwnProperty("x") && obj.hasOwnProperty("y")) {
          data = { relativeX : obj.x, relativeY : obj.y};
        } else {
          data = { relativeX: 0, relativeY: 0 };
        }
        
        var ri=0, rl=stackToRender.length;
        for (ri; ri<rl; ri++) {
          stackToRender[ri].dirty = false;
          stackToRender[ri].render(data);
        }
      }
    };

    self.start = function(fn) {
      timer = setTimeout(function() {
        self.render(fn); 
        self.start(fn);
        }, 0);
    };

    self.stop = function() {
      clearTimeout(timer);
      timer = false;
    };

    self.renderIndex = function(node) {
      var i=0, l=stack.length;
      for (i; i<l; i++) {
        if (stack[i].id === node.id) {
          return i;
        }
      }
      return -1;
    };

  };

  var Renderable = Composer.Renderable = function(obj, parts) {
    var size     = {height:0, width:0 },
        coords   = { x:0, y:0, z:0 },
        renderer = null,
        dirty    = true;
    
    obj.__defineGetter__("dirty", function() { return dirty; });
    obj.__defineSetter__("dirty", function(value) { 
      if (dirty === value) { return; }
      
      dirty = value;
      if (dirty && obj.composer !== obj) {
        obj.composer.renderer.addDirty(obj);
      } else if (obj.composer !== obj) {
        obj.composer.renderer.removeDirty(obj);
      }
    });

    parts  = parts || [Collidable];
    // Set the position in 3d space
    obj.setPos = function(x,y,z) {
      var sort = (z !== coords.z || y !== coords.y || x !== coords.x);
      coords = {x:x, y:y, z:z};
      if (sort) {
        if (obj.composer && obj.composer.renderer) {
          obj.composer.renderer.sort(false, true);
        }
        if (obj.composer === obj) {
          obj.composer.renderer.dirty = true;
        }
        obj.dirty = true;
      }
      return obj;
    };

    obj.__defineGetter__("x", function(value) { return coords.x; });
    obj.__defineGetter__("y", function(value) { return coords.y; });
    obj.__defineGetter__("z", function(value) { return coords.z; });

    obj.__defineSetter__("x", function(value) {
      if (value !==coords.x) {
        coords.x = value;
        obj.dirty = true;
        
        if (obj.composer && obj.composer.renderer) {
          obj.composer.renderer.sort(false,true);
        }
      }
    });

    obj.__defineSetter__("y", function(value) {
      if (value !== coords.y) {
        coords.y = value;
        obj.dirty = true;
        
        if (obj.composer && obj.composer.renderer) {
          obj.composer.renderer.sort(false,true);
        }
      }
    });

    obj.__defineSetter__("z", function(value) {
      if (value !== coords.z) {
        coords.z = value;
        obj.dirty = true;
        if (obj.composer && obj.composer.renderer) {
          obj.composer.renderer.sort(false,true);
        }
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
    var self = {}, overlaps = [], overlappedBy = [];

    obj.__defineGetter__("collides", function() { return self; });
    
    self.overlaps = {
      
      add : function(node) {
        overlaps.push(node);
      },
      remove : function(node) {
        var i=0, l = overlaps.length;
        for (i; i<l; i++) {
          if (overlaps[i] === node) {
            var start = overlaps.slice(0,i),
                rest  = overlaps.slice(i+1);
            start.push.apply(start, rest);
            overlaps = start;
          }
        }
      },
      clear : function() { 
        var current;
        while (overlaps.length > 0) {
          current = overlaps.pop();
          current.collides.overlappedBy.remove(obj)
        }
      },
      dirty : function() {
        var i=0, l = overlaps.length;
        for (i; i<l; i++) {
          overlaps[i].dirty = true;
        }
      }

    }
    
    self.overlappedBy = {
      cacheId : 0,
      add : function(node) {
        overlappedBy.push(node);
      },
      length : function() { return overlappedBy.length; },
      item   : function(index) { return overlappedBy[index] || null; },
      remove : function(node) {
        var i=0, l = overlappedBy.length;
        for (i; i<l; i++) {
          if (overlappedBy[i] === node) {
            var start = overlappedBy.slice(0,i),
                rest  = overlappedBy.slice(i+1);
            start.push.apply(start, rest);
            overlappedBy = start;
          }
        }
      },
      dirty : function(cacheId) {
        self.overlappedBy.cacheId = cacheId;
        var i=0, l = overlappedBy.length;
        for (i; i<l; i++) {
          if (overlappedBy[i].collides.overlappedBy.cacheId !== cacheId) {
            overlappedBy[i].dirty = true;
            overlappedBy[i].collides.overlappedBy.dirty(cacheId);
          }
        }
      }
    };

    // Simple AABB collision detection
    self.aabb = function(x,y) {
      var ox, oy, composer = obj.composer;

      // The composer is always clickable (infinite pan)
      if (composer === obj) { return true; }

      if (composer.x && //composer.hasOwnProperty('x') && 
          composer.y //composer.hasOwnProperty('y')
          ) 
      {
        ox = obj.x + composer.x;
        oy = obj.y + composer.y;
      } else {
        ox = obj.x;
        oy = obj.y; 
      }


      var size = obj.getSize();
      
      
      if (ox <= x && x <= ox+size.width && 
          oy <= y && y <= oy+size.height) 
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
        
        // Mark nodes that node is overlapping dirty
        var stack = obj.composer.renderer.stack;
        var i=0, l = stack.length;
        var dx = node.x, dy = node.y, dsize = node.getSize();
        if (obj.composer.hasOwnProperty('x') && 
            obj.composer.hasOwnProperty('y')) 
        {
          dx += obj.composer.x;
          dy += obj.composer.y;
        }
        
        var current, collides, cacheId = (new Date()).getTime();
        for (i; i<l; i++) {
          current = stack[i], aabb = stack[i].collides.aabb;
          if (aabb(dx            , dy)              || // Upper left
              aabb(dx            , dy+dsize.height) || // Top right
              aabb(dx+dsize.width, dy+dsize.height) || // Bottom right
              aabb(dx+dsize.width, dy)                 // Upper right
            )
          {
            current.dirty = true;
            if (current !== node) {
              current.collides.overlappedBy.dirty(cacheId);
            }
          }
        }
        
        // Add a new area to be cleared before rendering new nodes
        obj.composer.renderer.addClearRect(dx, dy, dsize.width, dsize.height);

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

    document.addEventListener("mousedown", function(ev) {
      // if the composer has an x,y use it for relative rendering
      var ox = mx, oy = my;
      
      var i=0, l=draggables.length, highestZ = null;
      for (i; i<l; i++) {
        if (draggables[i].collides.aabb(ox, oy)) {
          if (!highestZ || draggables[i].z >= highestZ.z) {
            highestZ = draggables[i];
          }
        }
        if (draggables[i].z > 0) {
          draggables[i].z = draggables[i].z - 1;
        }
      }
      
      if (highestZ) {
        node = highestZ;
        ev.canvasOffset = {x:ox, y:oy};
        node.dragstart(ev);
        obj.composer.renderer.dirty = true;
      }

    }, true);

    document.addEventListener("mouseup", function(ev) {
      
      
      if (node) {
        
        // clean the overlap cache for nodes that this node was previously
        // overlapping
        node.collides.overlaps.clear();
        
        var oi=0, ol=node.collides.overlappedBy.length();
        for (oi=ol-1; oi>=0; oi--) {
          var overlapper = node.collides.overlappedBy.item(oi);
          if (overlapper) {
            overlapper.collides.overlaps.remove(node);
            node.collides.overlappedBy.remove(overlapper);
          }
        }
        
        // Mark nodes that node is overlapping dirty
        var stack = obj.composer.renderer.stack;
        var i=0, l = stack.length;
        var dx = node.x, dy = node.y, dsize = node.getSize();
        if (obj.composer.hasOwnProperty('x') && 
            obj.composer.hasOwnProperty('y')) 
        {
          dx += obj.composer.x;
          dy += obj.composer.y;
        }

        for (i; i<l; i++) {
          if (stack[i].collides.aabb(dx            , dy)              || // Upper left
              stack[i].collides.aabb(dx            , dy+dsize.height) || // Top right
              stack[i].collides.aabb(dx+dsize.width, dy+dsize.height) || // Bottom right
              stack[i].collides.aabb(dx+dsize.width, dy)                 // Upper right
            )
          {
            if (stack[i] !== node && node.composer !== node && stack[i].composer !== stack[i]) {
              stack[i].collides.overlappedBy.add(node);
              node.collides.overlaps.add(stack[i]);
            }
          }
        }


        ev.canvasOffset = {x:mx, y:my};
        node.dragend(ev);
       
      }

      obj.composer.renderer.dirty = true;
      node = false;
    }, true);

  };
  
  var Draggable = Composer.Draggable = function(obj) {
    var mouseOffset = {x:0, y:0}, draggingZ = 1000;

    obj.__defineGetter__("mouseOffset", function() { return mouseOffset; });
    obj.__defineSetter__("mouseOffset", function(value) { mouseOffset = value; });

    obj.dragstart = function(ev) {
      var ox = ev.canvasOffset.x-obj.x, oy = ev.canvasOffset.y-obj.y;
      obj.z = draggingZ;
      mouseOffset = {x:ox, y:oy};
      
    };

    obj.dragging = function(ev) {
      var ox = ev.canvasOffset.x-mouseOffset.x, oy = ev.canvasOffset.y-mouseOffset.y;
      
      if (obj.composer === obj) {
        obj.composer.renderer.dirty = true;
      }
      
      obj.dirty = true;
      obj.setPos(ox, oy, draggingZ);
    };

    obj.dragend = function(ev) {
      mouseOffset = {x:0, y:0};
      obj.z = obj.z-1;
    };

    // Register this node with the DragManager
    obj.composer.dragmanager.add(obj);
  };


  // Expose thine self
  window.Composer = Composer;

})(window);