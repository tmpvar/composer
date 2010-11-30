composer.transport ={
  decode : function(obj, parentNode, cb) {
    parentNode = parentNode || composer.scene;

    // Recreate the nodes
    if (obj.nodes) {
      var nodeCount = 0, idMap = {}, current;
      for (var nodeId in obj.nodes) {
        if (obj.nodes.hasOwnProperty(nodeId)) {
          nodeCount++;
          current = obj.nodes[nodeId];

          if (parentNode.hasFeature("composer.Composite")) {
            current.features = [
              "carena.Node",
              "carena.Renderable",
              "composer.Functional",
              "composer.MicroNode"
            ];
          }
          composer.createNode(nodeId, current, function(err, node) {
            nodeCount--;
            if (err) {
              console.log(err);
              return;
            }
            // TODO: keep the id map in carena
            idMap[node.myId] = node;
            parentNode.add(node);

            if (nodeCount <= 0 && obj.pipes) {
              for (var pipeIdx in obj.pipes) {
                if (obj.pipes.hasOwnProperty(pipeIdx)) {
                 var pipeObj = carena.build({},['composer.Pipe']);
                 var pipe = obj.pipes[pipeIdx];
                 var sourcePorts = idMap[pipe.source.id].ports;
                 var targetPorts = idMap[pipe.target.id].ports;
                 var port;

                 for (var i=0; i<sourcePorts.length; i++) {
                  port = sourcePorts[i];

                  if (port.direction === pipe.source.port[0] &&
                      port.name === pipe.source.port[1])
                  {
                    pipeObj.source = port;
                    break;
                  }
                 }

                 for (var i=0; i<targetPorts.length; i++) {
                  port = targetPorts[i];
                  if (port.direction === pipe.target.port[0] &&
                      port.name === pipe.target.port[1])
                  {
                    pipeObj.target = port;
                    // parent the pipe so it will get rendered
                    var source = pipeObj.source, target = pipeObj.target;
                    var commonParent = carena.commonAncestor(source,
                                                             target);
                    if (commonParent) {
                      commonParent.unshift(pipeObj);
                    }
                    break;
                  }
                 }
                }
              }
            }

            if (typeof cb === "function") {
              cb(null, parent);
            }

          });
        }
      }
    }
    return parentNode;
  },

  encode : function(branch) {
    var res = {
      type : "flow",
      name : composer.currentFlow,
    },
    nodes = {},
    pipes = [],
    recurse = function(node) {
      if (node.hasFeature("composer.Functional") &&
          node.parent === branch)
      {
        nodes[node.myId] = {
          type    : node.type,
          name    : node.name || node.myId,
          options : {
            x : node.x,
            y : node.y,
            style : {
              backgroundColor : node.style.backgroundColor
            }
          }
        };
      } else if (node.hasFeature("composer.Pipe")) {
        if (node.source && node.target) {
          pipes.push({
            source : {
              id   : node.source.parent.myId,
              port : [node.source.direction, node.source.name]
            },
            target : {
              id   : node.target.parent.myId,
              port : [node.target.direction, node.target.name]
            }
          });
        }
      }

      if (node.children && node.children.length) {
        for (var i = 0; i<node.children.length; i++) {
          recurse(node.children[i]);
        }
      }
    };
    recurse(branch);
    res.nodes = nodes;
    res.pipes = pipes;
    return res;
  }
};
