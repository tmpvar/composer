var connect    = require("connect"),
    spawn      = require("child_process").spawn,
    jsToPorts  = require("./port").jsToPorts,
    nodes      = {};

function S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
 return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

connect.createServer.apply(connect, [
  connect.logger(),
  connect.bodyDecoder(),
  connect.router(function(app) {

    app.get("/nodes", function(req, res, next) {
      res.writeHead(200, {"Content-type": "application/json"});
      res.end(JSON.stringify(nodes, null,  "  "));
    });

    app.post("/nodes", function(req, res, next) {
      var body = req.body;
      body.type = body.type || "js";
      body.name = body.name || guid();


      if (body && body.type && body.type !== "flow") {
        req.body.ports = jsToPorts(req.body.code);
      }

      nodes[body.name] = body;
      res.writeHead("201", {"Content-type" : "application/json"});
      res.end(JSON.stringify(nodes[body.name], null, "  "));
    });

    app.get("/nodes/:name", function(req, res, next) {
      var name = req.params.name.replace(/%20/g, " ");
      if (!nodes[name]) {
        res.writeHead(404, {"Content-type": "application/json"});
        res.end(JSON.stringify({code: 404, body: "Not Found"}));
      } else {
        res.writeHead(200, {"Content-type": "application/json"});
        res.end(JSON.stringify(nodes[name], null, "  "));
      }
    });

    app.put("/nodes/:name", function(req, res, next) {
      if (req.body) {

        var body = req.body,
            name = req.params.name.replace(/%20/g, " ");
        body.type = body.type || "js";
        body.name = body.name || name;

        if (!nodes[name]) {
          res.writeHead(404, {"Content-type": "application/json"});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          if (body.type !== "flow") {
            body.ports = jsToPorts(body.code);
          }
          nodes[name] = body;
          res.writeHead("200", {"Content-type" : "application/json"});
          res.end(JSON.stringify(nodes[name], null, "  "));
        }
      }
    });

    app.get("/nodes/:name/run", function(req, res, next) {
      var name = req.params.name;
      if (!nodes[name]) {
        res.writeHead(404, {"Content-type":"application/json"});
        res.end(JSON.stringify({code: 404, body: "Not Found"}));
      } else {
        res.writeHead(200, {"Content-type":"text/plain"});
        var child = spawn("/usr/local/bin/node",
                          [__dirname + "/execute.js"]);

        child.stdin.write(JSON.stringify(nodes[name]));
        child.stdin.end();

        child.stderr.on("data", function(data) {
          console.log(data.toString());
        });
        child.stdout.on("data", function(data) {
          res.write(data);
        });
        res.on("end", function() {

        });
        var done = function() {
          try {
            res.end();
          } catch (e) {
            console.log("the client disconnected");
          }
        };

        child.stdout.on("end", done);
        child.on("exit", done);
      }
    });
  }),

  connect.staticProvider(__dirname + '/../'),
  connect.staticProvider(__dirname + '/../../')
]).listen(3000);
