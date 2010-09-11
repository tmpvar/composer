(function(out) {
  var composer = out.composer = {};

  // Features
  carena.addFeature("composer.Functional", function(obj, options, storage) {
    storage.name = storage.name || obj.name || "";
    storage.code = storage.code || options.code || obj.code || "";
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);
    carena.require("carena.Draggable", arguments);
    return carena.applyProperties(obj,{
      get code() { return storage.code; },
      set code(value) {
        storage.code = value;
      },
      get name() { return storage.name; },
      set name(value) {
        storage.name = value;
      }
    });
  });

  carena.addFeature("composer.Port", function(obj, options, storage) {
    var safe = {};
    carena.require("carena.Box", arguments);
    carena.require("carena.Eventable", arguments);
    carena.require("carena.Draggable", arguments);

    return carena.applyProperties(obj, {
      get port() { return true; },
      createPipe : function() {
        return carena.build({}, ["composer.Pipe"]);
      },
      createProxy : function() {
        var proxy = safe.proxy = carena.build({}, [
          "carena.Node",
          "carena.Eventable",
          "carena.Draggable",
        ]);
        proxy.x      = obj.x;
        proxy.y      = obj.y;
        proxy.width  = obj.width;
        proxy.height = obj.height;
        proxy.color  = "white";
        return proxy;
      },

      dragstart : function(node, mouse) {
          var pipe = safe.pipe = obj.createPipe();
              proxy = safe.proxy = obj.createProxy();

          pipe.source = obj;
          pipe.target = proxy;

          obj.add(proxy);
          obj.event.trigger("mouse.up", {target: obj, mouse: mouse});

          obj.unshift(pipe);
          // trigger on the parent of the port to get around a recursion
          // problem
          proxy.event.trigger("mouse.down", {
            target: proxy,
            collisions: [proxy],
            mouse: mouse
          });

          proxy.event.bind("drag.end", function(name, data) {
            if (data.target === safe.proxy) {
              var l = data.collisions.length,
                  i = 0,
                  parent = safe.proxy.parent,
                  commonParent = null;

              parent.remove(safe.proxy);

              for (i; i<l; i++) {
                if (data.collisions && data.collisions[i].port) {
                  data.source = data.target;
                  data.target = data.collisions[i];
                  parent.event.trigger(name, data);
                  safe.proxy = null;
                  pipe.target = data.target;
                  commonParent = carena.commonAncestor(data.target, parent);
                  if (commonParent) {
                    safe.pipe.parent.remove(pipe);
                    commonParent.unshift(pipe);
                  }

                  return false;
                }
              }

              // remove the pipe, as the drop target wasnt reached
              pipe.parent.remove(pipe);

              return false;
            }
          });
          return proxy;
      }
    });
  });

  carena.addFeature("composer.Pipe", function(obj, options, storage) {
    var safe = {
      source : null,
      target : null
    }
    storage.source = options.source || null;
    storage.target = options.target || null;

    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);

    return carena.applyProperties(obj, {
      // TODO: connect to the target/source x/y events
      //       this may or may not be beneficial for adv. collisions

      get source() {  return safe.source; },
      set source(value) { safe.source = value; },

      get target() { return safe.target; },
      set target(value) { safe.target = value; },

      render : function(renderer) {

        if (!safe.source && typeof storage.target === "string") {
          obj.parent.descend(function(node, walker) {
            if (node.id === storage.target) {
              safe.target = node;
              walker.stop();
              return false;
            }
          })
        }

        if (!safe.source && typeof storage.source === "string") {
          obj.parent.descend(function(node, walker) {
            if (node.id === storage.source) {
              safe.source = node;
              walker.stop();
              return false;
            }
          })
        }
        if (!safe.target || !safe.source) {
          return;
        }

        renderer.context.strokeStyle = obj.color || "yellow";
        renderer.context.lineWidth = 5;
        renderer.context.beginPath();
        renderer.context.moveTo(safe.source.x + (safe.source.width/2),
                                safe.source.y + (safe.source.height/2));

        renderer.context.lineTo(safe.target.x + (safe.target.width/2),
                                safe.target.y + (safe.target.height/2));
        renderer.context.fill();
        renderer.context.stroke();
      },
      dehydrate : function() {
        if (safe.source) {
          storage.source = safe.source.myId;
        }

        if (safe.target) {
          storage.target = safe.target.myId;
        }
        return storage;
      }
    });
  });
}(window));
