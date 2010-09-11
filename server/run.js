var connect    = require("connect"),
    mongo      = require("mongoose").Mongoose,
    db         = mongo.connect('mongodb://localhost/composer'),
    spawn      = require("child_process").spawn,
    Flow, Node;

mongo.model('Flow',{
  collection : "flows",
  properties : ["name"],
  indexes    : ["name"]
});
mongo.model('Node', {
  collection : "nodes",
  properties : ["name", "code"],
  indexes    : ["name"]
});
Flow = db.model('Flow');
Node = db.model('Node');

connect.createServer.apply(connect, [
//  connect.logger(),
  connect.bodyDecoder(),
  connect.router(function(app) {
    app.get("/flows/:name", function(req, res, next) {
      Flow.find({name: req.params.name}).all(function(cursor) {
        if (!cursor || cursor.length === 0) {
          res.writeHead(404, {'Content-type':'application/json'});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          res.writeHead(200, {'Content-type':'application/json'});
          res.end(cursor.pop().toJSON(null, "  "));
        }
      });
    });

    app.get("/flows/:name/run", function(req, res, next) {
      Flow.find({name: req.params.name}).one(function(cursor) {

        if (!cursor || cursor.length === 0) {
          res.writeHead(404, {"Content-type":"application/json"});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          res.writeHead(200, {"Content-type":"text/plain"});
          var child = spawn("/usr/local/bin/node",
                           [__dirname + "/execute.js"]);

          child.stdin.write(cursor.toJSON());
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
    });

    app.post("/flows", function(req, res, next) {
      if (req.body) {
        req.body.name = "THEFLOW";
        req.body._id = 123123123;
        var flow = new Flow(req.body, true);

        flow.save(function() {
          res.writeHead("201",{"Content-type" : "application/json"});
          res.end('{ "status": 201}');
        });
      }
    });

    app.get("/nodes", function(req, res, next) {
      Node.find().all(function(cursor) {
        res.writeHead(200, {"Content-type": "application/json"});
        var result = [];
        cursor.forEach(function(obj) {
          result.push(obj.toObject());
        });
        res.end(JSON.stringify(result));
      });
    });

    app.post("/nodes", function(req, res, next) {
      if (req.body) {
        var node = new Node(req.body, true);
        node.save(function() {
          res.writeHead("201", {"Content-type" : "application/json"});
          res.end('{ "status": 201 }');
        });
      }
    });

    app.get("/nodes/:node", function(req, res, next) {
      var node = req.params.node.replace("%20", " ");
      Node.find({name: node}).one(function(cursor) {
        if (!cursor || cursor.length === 0) {
          res.writeHead(404, {"Content-type": "application/json"});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          res.writeHead(200, {"Content-type": "application/json"});
          res.end(cursor.toJSON());
        }
      });
    });

    app.put("/nodes/:node", function(req, res, next) {
      if (req.body) {
        var node = req.params.node.replace("%20", " ");
        Node.find({name: node}).one(function(cursor) {
          if (!cursor || cursor.length === 0) {
            res.writeHead(404, {"Content-type": "application/json"});
            res.end(JSON.stringify({code: 404, body: "Not Found"}));
          } else {
            var update = cursor.toObject();
            console.dir(req.body)
            update.code = req.body.code;

            (new Node(update, true)).save(function() {
              res.writeHead("200", {"Content-type" : "application/json"});
              res.end(JSON.stringify(update, null, true));
            });
          }
        });
      }
    });
  }),

  connect.staticProvider(__dirname + '/../'),
  connect.staticProvider(__dirname + '/../../')
]).listen(3000);
