(function(out) {
  var composer = out.composer = {};

  // Features
  composer.feature = {};
  composer.feature.Port = function(obj, options) {
    var safe = {

    };

    if (!obj.event) {
      carena.feature.Eventable(obj, options);
    }

    if (!obj.dragstart) {
      carena.feature.Draggable(obj, options);
    }

    return carena.applyProperties(obj, {
      get port() { return true; },
      createPipe : function() {
        return carena.Build({}, [composer.feature.Pipe]);
      },
      createProxy : function() {
        var proxy = safe.proxy = carena.Build({}, [
          carena.feature.Node,
          carena.feature.Eventable,
          carena.feature.Draggable,
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
          obj.event.trigger("mouse.up", {target: obj});

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
  };

  composer.feature.Pipe = function(obj, options) {

    var safe = {
      source: null,
      target : null
    };

    if (!obj.myId) {
      carena.feature.Node(obj, options);
    }

    if (!obj.event) {
      carena.feature.Eventable(obj, options);
    }

    return carena.applyProperties(obj, {
      // TODO: connect to the target/source x/y events
      //       this may or may not be beneficial for adv. collisions

      get source() {  return safe.source; },
      set source(value) { safe.source = value; },

      get target() { return safe.target; },
      set target(value) { safe.target = value; },

      render : function(renderer) {
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
      }
    });
  };
}(window));
