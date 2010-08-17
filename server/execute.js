var stdin = process.openStdin(),
    http  = require("http"),
    url   = require("url"),
    Conduct = require(__dirname + "/../../conductor/lib/conductor"),
    data = "",
    rawObject,
    Script = process.binding("evals").Script;

stdin.on('data', function(chunk) {
  data += chunk;
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
  var pipes = [], composition = {}, letter = 64, total = 0;
  rawObject.scene.forEach(function(node) {
    if (node.features) {
      node.features.forEach(function(feature) {
        if (feature === "composer.Functional") {
          letter++;
          var id = String.fromCharCode(letter);
          node.conductorId = id;
          composition[id] = [
          ];

          composition[id].push("_1");
          if (letter === 66) {

            composition[id].push("A1");
          }
          total++;

          // TODO: do not assume this is a url!


          var nodeUrl = url.parse(node.code);
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
              composition[id].push(Script.runInThisContext(toRun));

              if (total === 0) {
                build();
              }
            });

          });

        } else if (feature === "composer.Pipe") {
          pipes.push(node);
        }
      });
    }
  });

  // build out a conductor flow using the data + ports
  function build() {

    function run(message) {
      return function(err, output) {

      }
    }
try {
    Conduct(composition)();
} catch (e) {

}
  }

  // execute the flow!

});
