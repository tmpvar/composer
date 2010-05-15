/*jslint browser: true, devel: true, windows: true, es5: true,
  onevar: true, undef: true, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, newcap: true, immed: true, 
  strict: true, maxlen: 80 */

/******************************************************
*                  Composer                           *
*                                                     *
*  License:     MIT (see: ../LICENSE.txt)             *
*  Copyright:   2010 Elijah Insua                     *
*  Description: Visual data and flow control editor   *
******************************************************/
"use strict";
(function (window) {
  var lastId = 0,
  
  // Core composer factory
  Composer = function (canvas, options, features) {
    // Require a canvas
    if (!canvas) {
      throw new Error("Composer requires a canvas element");
    }

    // sensible defaults for params
    features = features || [Composer.Renderer];
    options = options || {};
    
    var version = "0.0.1",
        context = canvas.getContext("2d"),
        binds   = {},
        self    = {
          get version() { return version; },
          set version(value) {},

          get canvas() { return canvas; },
          set canvas(value) {},

          get context() { return context; },
          set context(value) {}
        };

    // Hang a reference to this instance on the target canvas
    canvas.composer = self;

    Composer.create = self.create = function (obj, options, parts) {
      
      if (arguments.length === 2 && options && options.length) {
        parts = options;
      }
      parts = parts || [];
      var i   = 0,
          len = parts.length,
          myId = lastId+=1;

      obj.composer = self;
      obj.id = myId;
      // Based on the incomming parts array, build out self.
      for (i=0; i<len; i+=1) {
        parts[i](obj, options);
      }

      return obj;
    };

    self.bind = function (name, fn) {
      if (!binds[name]) {
        binds[name] = [];
      }
      binds[name].push(fn);
    };

    self.unbind = function (name, fn) {
      if (binds[name]) {

        // slice a callback off
        if (fn) {
          var i=0, l=binds[name], start, rest;
          for (i=0; i<l; i+=1) {
            if (binds[name][i] === fn) {
               start = binds[name].slice(0,i);
               rest  = binds[name].slice(i+1);
               binds[name] = start.push.apply(start,rest);
            }
          }
        } else {
          binds[name] = [];
        }
      }
    };

    self.trigger = function (name, data) {
      if (binds[name]) {
        var i=0, l=binds[name].length;
        for (i=0; i<l; i+=1) {
          binds[name][i](data);
        }
      }
    };

    return self.create(self, options, features);
  },

  // Base canvas renderer
  Renderer = Composer.Renderer = function (obj, options) {
    var stack = [], stackToRender = [],
        self  = {},
        timer,
        dirtyNodes = [],
        backgroundColor = "#000000",
        clearRects = [];
    
    // Add getters to the base object
    obj.__defineGetter__("renderer", function () { return self; });

    self.addDirty = function (node) {
      dirtyNodes.push(node);
    };
    
    self.removeDirty = function (node) {
      var i=0, l=dirtyNodes.length, start, rest;

      for (i=0; i<l; i+=1) {
        if (dirtyNodes[i] === node) {
          start = dirtyNodes.slice(0,i);
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
    self.__defineGetter__("length", function () { return stack.length; });

    self.sort = function (fn, save) {
      fn = fn || function (a, b) {
        return a.z-b.z;
       /* if (a.z === b.z) {
          return 0
        } else if (a.z > b.z) {
          return 1;
        }
        return -1;*/
      };
      
      var sorted = stack.sort(fn);
      if (save) {
        stack = sorted;
      }
      return sorted;
    };

    self.add = function (renderable) {
      stack.push(renderable);
      //self.sort(false, true);
      renderable.renderer = self;
      return self;
    };

    self.remove = function (renderable) {
      var i=0, l=stack.length, start, rest;

      for (i=0; i<l; i+=1) {
        if (stack[i] === renderable) {
          start = stack.slice(0,i);
          rest  = stack.slice(i+1);
          start.push.apply(start, rest);
          stack = start;
          renderable.renderer = null;
        }
      }
      return self;
    };
    
    self.addClearRect = function (x, y, width, height) {
      clearRects.push({x: x, y:y, width:width, height:height });
    };
    
    self.clearRects = function () {
      var i=0, l=clearRects.length, r;
      for (i=0; i<l; i+=1) {
        r = clearRects[i];
        obj.composer.context.fillStyle = backgroundColor;
        obj.composer.context.fillRect(r.x,r.y,r.width,r.height);
      }
      clearRects = [];
    };

    self.render = function (fn) {
      if (fn) {
       fn();
      }

      var needsRender = false,
          stackToRender = [],
          i=0,
          ox,
          oy,
          size,
          data,
          si=0,
          sl=stack.length,
          ri=0,
          rl;

      if (self.dirty) {
        for (i=0; i<sl; i+=1) {
          ox   = stack[i].x;
          oy   = stack[i].y;
          size = stack[i].getSize(); 

          if (stack[i].composer.hasOwnProperty('x') && 
              stack[i].composer.hasOwnProperty('y') && 
              stack[i].composer !== stack[i]) 
          {
            ox += stack[i].composer.x;
            oy += stack[i].composer.y;
          }        

          if ((ox >= 0 || ox + size.width >= 0) && 
                (size.width + ox <= obj.canvas.width || 
                  ox <= obj.canvas.width) &&
              (oy >= 0 || oy + size.height >= 0) && 
                (size.height + oy <= obj.canvas.height || 
                  oy <= obj.canvas.height)) 
          {
            stackToRender.push(stack[i]);
          }
        }

        // clear the entire canvas and start from scratch
        if (self.dirty) {
          // TODO: only clear the rect that the composer is occupying
          obj.composer.context.fillStyle = backgroundColor;
          obj.composer.context.fillRect(0,
                                        0,
                                        obj.composer.canvas.width,
                                        obj.composer.canvas.height);
        }
        self.dirty = false;
        needsRender = true;
        // Partial rendering
      } else if (dirtyNodes.length > 0) {
        sl = stack.length;
        for (si=0; si<sl; si+=1) {
          if (stack[si].dirty === true) {
            stackToRender.push(stack[si]);
          }
        }
        dirtyNodes = [];
        needsRender = true;
      }

      if (needsRender && stackToRender.length > 0) {
        self.clearRects();
        
        if (obj.hasOwnProperty("x") && obj.hasOwnProperty("y")) {
          data = { relativeX : obj.x, relativeY : obj.y};
        } else {
          data = { relativeX: 0, relativeY: 0 };
        }
        
        rl = stackToRender.length;
        for (ri=0; ri<rl; ri+=1) {
          stackToRender[ri].dirty = false;
          stackToRender[ri].render(data);
        }
      }
    };

    self.start = function (fn) {
      timer = setTimeout(function () {
        self.render(fn); 
        self.start(fn);
        }, 0);
    };

    self.stop = function () {
      clearTimeout(timer);
      timer = false;
    };

    self.renderIndex = function (node) {
      var i=0, l=stack.length;
      for (i=0; i<l; i+=1) {
        if (stack[i].id === node.id) {
          return i;
        }
      }
      return -1;
    };

  },

  Renderable = Composer.Renderable = function (obj, parts) {
    var size     = {height:0, width:0 },
        coords   = { x:0, y:0, z:0 },
        renderer = null,
        dirty    = true;
    
    obj.__defineGetter__("dirty", function () { return dirty; });
    obj.__defineSetter__("dirty", function (value) { 
      if (dirty === value) { return; }
      
      dirty = value;
      if (dirty && obj.composer !== obj) {
        obj.composer.renderer.addDirty(obj);
      } else if (obj.composer !== obj) {
        obj.composer.renderer.removeDirty(obj);
      }
    });

    parts  = parts || [Composer.Collidable];
    // Set the position in 3d space
    obj.setPos = function (x,y,z) {
      var sort = (z !== coords.z || y !== coords.y || x !== coords.x);
      
      obj.y = y;
      obj.x = x;
      obj.z = z;
      
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

    obj.__defineGetter__("x", function (value) { return coords.x; });
    obj.__defineGetter__("y", function (value) { return coords.y; });
    obj.__defineGetter__("z", function (value) { return coords.z; });

    obj.__defineSetter__("x", function (value) {
      if (value !==coords.x) {
        coords.x = value;

        if (obj.composer && obj.composer.renderer) {
          obj.dirty = true;
          obj.composer.renderer.sort(false,true);
          obj.composer.trigger("node.x.changed", { source: obj });
        }
      }
    });

    obj.__defineSetter__("y", function (value) {
      if (value !== coords.y) {
        coords.y = value;

        if (obj.composer && obj.composer.renderer) {
          obj.dirty = true;
          obj.composer.renderer.sort(false,true);
          obj.composer.trigger("node.y.changed", { source: obj });
        }
      }
    });

    obj.__defineSetter__("z", function (value) {
      if (value !== coords.z) {
        coords.z = value;

        if (obj.composer && obj.composer.renderer) {
          obj.dirty = true;
          obj.composer.renderer.sort(false,true);
          obj.composer.trigger("node.z.changed", { source: obj });
        }
      }
    });

    // Get the position in 3d space
    obj.getPos = function () {
      return coords;
    };

    obj.getSize = function () {
      return size;
    };

    obj.setSize = function (width, height) {
      size = {width: width, height:height };
      return obj;
    };

    obj.render = function () {

    };

    // Automatically add the object to the stack
    if (obj.composer          &&
        obj.composer.renderer &&
        obj.composer.renderer.add)
    {
      obj.composer.renderer.add(obj);
    }

    return obj;
  },
  Collidable = Composer.Collidable = function (obj) {
    var self = {}, overlaps = [], overlappedBy = [];

    obj.__defineGetter__("collides", function () { return self; });

    self.overlaps = {
      add : function (node) {
        overlaps.push(node);
      },
      remove : function (node) {
        var i=0, l = overlaps.length, start, rest;
        for (i=0; i<l; i+=1) {
          if (overlaps[i] === node) {
            start = overlaps.slice(0,i);
            rest  = overlaps.slice(i+1);
            start.push.apply(start, rest);
            overlaps = start;
          }
        }
      },
      clear : function () { 
        var current;
        while (overlaps.length > 0) {
          current = overlaps.pop();
          current.collides.overlappedBy.remove(obj);
        }
      },
      dirty : function () {
        var i=0, l = overlaps.length;
        for (i=0; i<l; i+=1) {
          overlaps[i].dirty = true;
        }
      }

    };

    self.overlappedBy = {
      cacheId : 0,
      add : function (node) {
        overlappedBy.push(node);
      },
      length : function () { return overlappedBy.length; },
      item   : function (index) { return overlappedBy[index] || null; },
      remove : function (node) {
        var i=0, l = overlappedBy.length, start, rest;
        for (i=0; i<l; i+=1) {
          if (overlappedBy[i] === node) {
            start = overlappedBy.slice(0,i);
            rest  = overlappedBy.slice(i+1);
            start.push.apply(start, rest);
            overlappedBy = start;
          }
        }
      },
      dirty : function (cacheId) {
        self.overlappedBy.cacheId = cacheId;
        var i=0, l = overlappedBy.length;
        for (i=0; i<l; i+=1) {
          if (overlappedBy[i].collides.overlappedBy.cacheId !== cacheId) {
            overlappedBy[i].dirty = true;
            overlappedBy[i].collides.overlappedBy.dirty(cacheId);
          }
        }
      }
    };

    // Simple AABB collision detection
    self.aabb = function (x,y) {
      var ox, oy, composer = obj.composer, size = obj.getSize();

      // The composer is always clickable (infinite pan)
      if (composer === obj) { return true; }

      if (composer.x && composer.y) {
        ox = obj.x + composer.x;
        oy = obj.y + composer.y;
      } else {
        ox = obj.x;
        oy = obj.y;
      }

      if (ox <= x && x <= ox+size.width &&
          oy <= y && y <= oy+size.height)
      {
        return true;
      }
      return false;
    };

    return self;
  },
  DragManager = Composer.DragManager = function (obj) {
    var mx=0, my=0, node = false, draggables = [], self = {};

    self.cacheOverlap = function (data) {
      var current = data.source,
          stack = current.composer.renderer.stack,
          i = 0,
          l = stack.length,
          dx,
          dy,
          dsize = current.getSize(),
          ox = 0,
          oy = 0,
          oi = 0, 
          ol = current.collides.overlappedBy.length(),
          overlapper;

      // clean the overlap cache for nodes that this node was previously
      // overlapping
      current.collides.overlaps.clear();

      for (oi=ol-1; oi>=0; oi-=1) {
        overlapper = current.collides.overlappedBy.item(oi);
        if (overlapper) {
          overlapper.collides.overlaps.remove(current);
          current.collides.overlappedBy.remove(overlapper);
        }
      }

      if (current.composer.hasOwnProperty('x') && 
          current.composer.hasOwnProperty('y')) 
      {
        ox = current.composer.x;
        oy = current.composer.y;
      }

      for (i=0; i<l; i+=1) {
        dx = stack[i].x+ox;
        dy = stack[i].y+oy;
        dsize = stack[i].getSize();
        if (stack[i].collides && 
            (
              current.collides.aabb(dx            , dy)              ||
              current.collides.aabb(dx            , dy+dsize.height) ||
              current.collides.aabb(dx+dsize.width, dy+dsize.height) ||
              current.collides.aabb(dx+dsize.width, dy)
            )
          )
        {
          // Mark nodes that node is overlapping dirty
          if (stack[i] !== current         &&
              current.composer !== current &&
              stack[i].composer !== stack[i])
          {
            stack[i].collides.overlappedBy.add(current);
            current.collides.overlaps.add(stack[i]);
          }
        }
      }
    };

    if (obj.composer && obj.composer.bind) {
      obj.composer.bind("node.z.changed", self.cacheOverlap);
    }

    document.addEventListener("mousemove", function (ev) {
      mx = ev.clientX - (obj.composer.canvas.offsetLeft - window.pageXOffset);
      my = ev.clientY - (obj.composer.canvas.offsetTop  - window.pageYOffset);

      if (node) {

        // Mark nodes that node is overlapping dirty
        var stack = obj.composer.renderer.stack, 
            i = 0, 
            l = stack.length, 
            dx = node.x, 
            dy = node.y,
            dsize = node.getSize(), 
            current, 
            collides, 
            cacheId = (new Date()).getTime(),
            aabb;

        if (obj.composer.hasOwnProperty('x') && 
            obj.composer.hasOwnProperty('y')) 
        {
          dx += obj.composer.x;
          dy += obj.composer.y;
        }

        for (i=0; i<l; i+=1) {
          current = stack[i];
          if (current.collides && current.collides && current.collides.aabb) {
            aabb = current.collides.aabb;
            if (aabb(dx            , dy)              || // Upper left
                aabb(dx            , dy+dsize.height) || // Top right
                aabb(dx+dsize.width, dy+dsize.height) || // Bottom right
                aabb(dx+dsize.width, dy)                 // Upper right
              )
            {
              current.dirty = true;
              // Don't do collision detection on the node thats being dragged
              if (current !== node) {
                current.collides.overlappedBy.dirty(cacheId);
              }
            }
          }
        }

        // Add a new area to be cleared before rendering new nodes
        obj.composer.renderer.addClearRect(dx, dy, dsize.width, dsize.height);

        ev.canvasOffset = {x:mx, y:my};
        node.dragging(ev);
      }
    }, true);

    obj.__defineGetter__("dragmanager", function () {
      return self;
    });

    self.add = function (draggable) {
      // TODO: check for collides member
      draggables.push(draggable);
    };

    document.addEventListener("mousedown", function (ev) {
      // if the composer has an x,y use it for relative rendering
      var ox = mx,
          oy = my,
          i = 0,
          // TODO: use a pre-computed "visible" render list
          stack = obj.composer.renderer.stack,
          l = stack.length-1;

      // Reset the node
      node = null;
      for (i=l; i>=0; i-=1) {
        if (stack[i].collides.aabb(ox, oy)) {
          node = stack[i];
          obj.composer.renderer.dirty = true;
          break;
        }
      }

      // if there were no matches
      if (!node) {
        node = obj.composer;
      }

      // trait test for draggable
      if (node.dragstart) {
        ev.canvasOffset = {x:ox, y:oy};
        node.dragstart(ev);
      }
    }, true);

    document.addEventListener("mouseup", function (ev) {
      if (node) {
        ev.canvasOffset = {x:mx, y:my};
        node.dragend(ev);
      }

      obj.composer.renderer.dirty = true;
      node = false;
    }, true);
  },
  Draggable = Composer.Draggable = function (obj) {
    var mouseOffset = {x:0, y:0}, draggingZ = 1;

    obj.__defineGetter__("mouseOffset", function () { 
      return mouseOffset;
    });

    obj.__defineSetter__("mouseOffset", function (value) { 
      mouseOffset = value; 
    });

    obj.dragstart = function (ev) {
      var ox = ev.canvasOffset.x-obj.x, oy = ev.canvasOffset.y-obj.y;
      obj.z = draggingZ;
      mouseOffset = {x:ox, y:oy};
    };

    obj.dragging = function (ev) {
      var ox = ev.canvasOffset.x-mouseOffset.x, 
          oy = ev.canvasOffset.y-mouseOffset.y;

      if (obj.composer === obj) {
        obj.composer.renderer.dirty = true;
      }

      obj.dirty = true;
      obj.setPos(ox, oy, draggingZ);
    };

    obj.dragend = function (ev) {
      mouseOffset = {x:0, y:0};
      obj.z = 0;
    };

    // Register this node with the DragManager
    obj.composer.dragmanager.add(obj);
  },
  Droppable = Composer.Droppable = function (obj) {
    obj.dropstart = function (ev) {};
    obj.dropping = function (ev) {};
    obj.dropend = function (ev) {};
  },
  DropTarget = Composer.DropTarget = function (obj) {
    obj.test = function (droppable) {
      // test whether the incomming droppable is allowed to drop here
    };
  },
  DropManager = Composer.DropManager = function (obj) {
    var self = {}, targets = [];
    obj.__defineGetter__("dropmanager", function () { return self; });
    self.__defineGetter__("length", function () { return targets.length; });
    self.add = function (droptarget) {
      targets.push(droptarget);
    };
  };

  // Expose thine self
  window.Composer = Composer;
}(window));