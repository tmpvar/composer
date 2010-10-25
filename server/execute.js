var stdin = process.openStdin(),
    http  = require("http"),
    url   = require("url"),
    flow = require("conductor").conductor(),
    data = "",
    rawObject,
    Script = process.binding("evals").Script
    idMap = {}, total = 0;

stdin.on('data', function(chunk) {
  data += chunk.toString();
});

stdin.on('end', function() {
  // process the input as json
  try {
    rawObject = JSON.parse(data);
  } catch (e) {
    console.dir(e.stack);
    process.exit();
  }

  
  for (var nodeId in rawObject.nodes) {
    if (rawObject.nodes.hasOwnProperty(nodeId)) {
      total++;
      createNode(nodeId, rawObject.nodes[nodeId]);
    }
  }
});

function createNode(nodeId, node) {
  
  var nodeUrl = url.parse("http://localhost:3000/nodes/" + node.name.replace(/ /g, "%20"));
  var client = http.createClient(nodeUrl.port, nodeUrl.hostname);
  var request = client.request("GET", nodeUrl.pathname, {
    host: nodeUrl.host
  });

  request.end();
  request.on('response', function(response) {
    var nodeCode = "";

    response.on("data",function(chunk) {
      nodeCode += chunk.toString("ascii");
    });

    response.on("end", function() {
      total--;
      var tmpnode = JSON.parse(nodeCode);
      node.source = tmpnode.code;
      node.ports = tmpnode.ports;

      // TODO: too much assumption here..
      var toRun = "(function(){ return " + node.source + "})()";
      var ctx = { 
        fn : null,
        require : function(str) {
          if (!str !== "fs") {
            return require(str);
          }
        },
        console : console
      };

      idMap[nodeId] = flow.node(Script.runInNewContext(toRun, ctx), nodeId);

      if (total === 0) {
        setupRouting(rawObject.pipes);
      }
    });
  });
}

function setupRouting(pipes) {
  for (var i=0; i<pipes.length; i++) {
    var pipe = pipes[i]
        source = idMap[pipe.source.id],
        target = idMap[pipe.target.id];

    if (pipe.source.port[1] === 'return') {
      source.output(target.args[pipe.target.port[1]]());
    } else {
      source.args[pipe.source.port[1]](target.args[pipe.target.port[1]]());
    }
  }
  execute();
}

// finally, execute the flow
function execute() {
  try {
    flow.execute();
  } catch (e) {
    console.dir(e);
  }
}
