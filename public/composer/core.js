(function(out) {
  var composer = out.composer = {
    currentFlow : false,
    defaultFont : "16px ProggyClean",
    defaultText : function(type) {
      return $("#" + type + "-text").text();
    },
    createNode : function(nodeId, nodeObj, fn) {
      $.ajax({
        url     : '/nodes/' + nodeObj.name,
        dataType: 'json',
        success : function(data) {
          nodeObj.options.width  = 100;
          nodeObj.options.height = 100;
          nodeObj.options.name = data.name;
          var type     = data.type,
              features = nodeObj.features || [
                "carena.Node",
                "carena.Renderable",
                "composer.Functional",
                "carena.Draggable",
                "carena.RelativeToParent",
                "carena.Box"
              ], node;

          node  = carena.build(nodeObj.options || {}, features, {
                myId: nodeId
              }),
              // Build the label
              label = carena.build({
                color: "white",
                style: {
                  backgroundColor: "black"
                },
                width: node.width,
                height: 20,
                x: node.x,
                y: node.y,
                text: nodeObj.name
              }, [
                "cider.Textual",
                "carena.Eventable",
                "carena.RelativeToParent"
              ]);

          label.font.set(composer.defaultFont);
          label.style.paddingLeft = 5;
          label.style.paddingTop = 0;
          node.add(label);

          // TODO: refactor this into nice pieces
          if (type === "flow") {
            node.width = 200;
            node.height = 200;
            label.width = 200;

            var innards = carena.build({
              width : node.width-4,
              height: (node.height-label.height)-4,
              x     : node.x+2,
              y     : node.y+label.height+2,
              style : {
                backgroundColor : "black"
              }
            }, [
              'carena.Node',
              'carena.Style',
              'carena.RelativeToParent',
            ]),
            scaleNode = carena.build({
              width:innards.width,
              height:innards.height,
              x: innards.x,
              y: innards.y
            },[
              'carena.Node',
              'carena.Eventable',
              'composer.Composite',
              'carena.RelativeToParent'
            ]);

            node.add(innards.add(scaleNode));

            jQuery.ajax({
              url : "/nodes/" + nodeObj.name,
              dataType: "json",
              success : function(data) {
                composer.transport.decode(data, scaleNode, function() {
                  // calculate the bounds of the children
                  var bounds = scaleNode.bounds,
                      scale = (node.width/composer.renderer.canvas.width)*4;
                  scaleNode.scale = scale;
                  scaleNode.x = innards.x;
                  scaleNode.y = innards.y;
                  fn(null, node);
                });
              },
            });
            return;
          }


          if (data.ports) {
            // build out ports
            if (data.ports.out) {
              for (var i=0; i<data.ports['out'].length; i++) {
                node.add(carena.build({
                  x: node.x + (i*22),
                  y: node.y + node.height,
                  width: 20,
                  height:10,
                  style : {
                    backgroundColor: "green"
                  },
                  port : data.ports['out'][i]
                }, [
                  "carena.RelativeToParent", "composer.Port"
                ]));
              }
            }

            // build in ports
            if (data.ports['in']) {
              for (var j=0; j<data.ports['in'].length; j++) {
                node.add(carena.build({
                  x: node.x + (j*22),
                  y: node.y - 10,
                  width: 20,
                  height:10,
                  style : {
                    backgroundColor : "red"
                  },
                  port : data.ports['in'][j]
                }, [
                  "carena.RelativeToParent", "composer.Port"
                ]));
              }
            }
          }
          fn(null, node);
        }
      });
    }
  };

  carena.addFeature("composer.Functional", function(obj, options, storage) {
    storage.name = obj.name || storage.name || "";
    storage.code = storage.code || options.code || obj.code || "";
    carena.require("carena.Node", arguments);
    carena.require("carena.Eventable", arguments);
    return carena.applyProperties(obj,{
      get code() { return storage.code; },
      set code(value) {
        storage.code = value;
      },
      get name() { return storage.name; },
      set name(value) {
        storage.name = value;
      },
      get ports() {
        var ret = [];
        for (var i=0; i<obj.children.length; i++) {
          if (obj.children[i].hasFeature("composer.Port")) {
            ret.push(obj.children[i]);
          }
        }
        return ret;
      }
    });
  });

  carena.addFeature("composer.Composite", function(obj, options, storage) {
    carena.require("composer.Functional", arguments);

    obj.renderSteps.push(function(renderer) {

      var scaleX = obj.bounds.width/renderer.canvas.width, i;

      renderer.context.save();
      renderer.context.translate(obj.x, obj.y);
      renderer.context.scale(scaleX, scaleX);

      for (i=0; i<obj.children.length; i++) {
        obj.children[i].descend(function(grandchild) {
          return grandchild.render(renderer);
        });
      }

      renderer.context.restore();
      return false;
    });

    return obj;
  });

  carena.addFeature("composer.MicroNode", function(obj, options, storage) {
    obj.containsPoint = function() { return false; };
    return obj;
  });

  carena.addFeature("composer.ModalManager", function(obj, options, storage) {
    carena.require("carena.Node", arguments);
    var safe = { modal : false };
    return carena.applyProperties(obj,{
      show : function(node) {
        if (!safe.modal) {
          safe.modal = node;
          obj.add(node);
          return true;
        }
        return false;
      },
      hide : function(node) {
        if (safe.modal === node) {
          safe.modal = false;
          obj.remove(node);
          return true;
        }
        return false;
      }
    });
  });

  carena.addFeature("composer.Port", function(obj, options, storage) {
    var safe = {};
    carena.require("carena.Box", arguments);
    carena.require("carena.Eventable", arguments);
    carena.require("carena.Draggable", arguments);

    storage.port = obj.port || storage.port || {
      type          : "argument",
      direction     : "in",
      portIndex     : 0,
      name          : 0
    };

    storage.port.direction = storage.port.direction || "in";
    storage.port.portIndex = storage.port.portIndex || 0;
    storage.port.name      = storage.port.name      || storage.port.portIndex;

    return carena.applyProperties(obj, {
      get port() { return true; },
      get portIndex() { return storage.port.portIndex; },
      get direction() { return storage.port.direction; },
      get name() { return storage.port.name; },
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
         var pipe  = safe.pipe = obj.createPipe();
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
        proxy.event.trigger("mouse.move", {
          target: proxy,
          collisions: [proxy],
          mouse: mouse
        });

        proxy.event.bind("drag.end", function(name, data) {
          var l = data.collisions.length,
              i = 0,
              parent = proxy.parent,
              commonParent = null,
              ret = true;

          for (i; i<l; i++) {
            if (data.collisions && data.collisions[i].port) {
              data.source = data.target;
              data.target = data.collisions[i];
              parent.event.trigger(name, data);
              pipe.target = data.target;
              commonParent = carena.commonAncestor(data.target, parent);
              if (commonParent) {
                safe.pipe.parent.remove(pipe);
                commonParent.unshift(pipe);
              }
              ret = false;
              break;
            }
          }

          // remove the pipe, as the drop target wasnt reached
          pipe.parent.remove(pipe);

          // Remove the proxy last, as the pipe still is targeted to it.
          proxy.parent.remove(proxy);
          proxy = null;

          return ret;
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

    obj.renderSteps.push(function(renderer) {
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
      renderer.context.save();
      renderer.context.strokeStyle = obj.color || "yellow";
      renderer.context.lineWidth = 5;
      renderer.context.beginPath();
      renderer.context.moveTo(safe.source.x + (safe.source.width/2),
                              safe.source.y + (safe.source.height/2));

      renderer.context.lineTo(safe.target.x + (safe.target.width/2),
                              safe.target.y + (safe.target.height/2));
      renderer.context.fill();
      renderer.context.stroke();
      renderer.context.restore();
    });

    return carena.applyProperties(obj, {
      // TODO: connect to the target/source x/y events
      //       this may or may not be beneficial for adv. collisions

      get source() {  return safe.source; },
      set source(value) { safe.source = value; },

      get target() { return safe.target; },
      set target(value) { safe.target = value; },

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
