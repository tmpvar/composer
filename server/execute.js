var stdin = process.openStdin(),
    http  = require("http"),
    url   = require("url"),
    Conduct = require(__dirname + "/../../conductor/lib/conductor"),
    data = "",
    rawObject,
    Script = process.binding("evals").Script;

stdin.on('data', function(chunk) {
  data += chunk.toString();
});

stdin.on('end', function() {
  // process the input as json
  try {
    rawObject = JSON.parse(data);
  } catch (e) {
    console.log(e.stack);
    process.exit();
  }

  // collect the code responsible for execution
  var pipes = [], composition = {}, refs = {}, letter = 64, total = 0;
  rawObject.scene.forEach(function(node) {
    if (node.features) {
      var features = node.features.join(",");

      if (features.indexOf("composer.Functional") > -1) {
        var lastLetter = String.fromCharCode(letter).toUpperCase();
        letter++;
        var id = String.fromCharCode(letter);
        node.conductorId = id;
        refs[node.settings.myId] = id;
        composition[id] = [];
        total++;

        // TODO: do not assume this is a url!
        var nodeUrl = url.parse(node.settings.code);
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
            // TODO: too much assumption here..
            var toRun = "(function(){ return " + JSON.parse(nodeCode).code + "})()";
            var context = { fn : null};

            // TODO: this only works with return :/ need to fix
            composition[id].push(Script.runInThisContext(toRun, context));

            if (total === 0) {
              execute();
            }
          });
        });

        var num = 0;
        node.children.forEach(function(child) {
          if (child.features) {
            child.features.forEach(function(feature) {
              if (feature === "composer.Port") {
                refs[child.settings.myId] = node.conductorId;
                if (num>0) {
                  refs[child.settings.myId] += num;
                }
                num++;
              }
            })
          }
        });
      } else if (features.indexOf("composer.Pipe") > -1) {
        pipes.push(node);
      }

    }
  });

  // Meanwhile, back at the bat cave..
  var flowable = {}
  // Now connect the pipes, yay!
  pipes.forEach(function(pipe) {
    var source = refs[pipe.settings.source],
        target = refs[pipe.settings.target];
    if (!flowable[target]) {
      flowable[target] = [];
    }
    flowable[target].push(source);
  });

  flowable.forEach(function(performer, flow) {
    Array.prototype.unshift.apply(composition[flow], performer);
  })



  // finally, execute the flow
  function execute() {
    try {
      console.log("{");
      var parts = []
      composition.forEach(function(part, k) {
        var p = k +': ["' + part.join('","') + "]"
        parts.push(p.replace('"function', "function"));
      });
      
      console.log(parts.join(",") + "\n}");
      
      Conduct(composition)();
    } catch (e) {
      console.dir(e);
    }
  }
});
