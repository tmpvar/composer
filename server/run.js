var connect    = require("connect"),
    spawn      = require("child_process").spawn,
    jsToPorts  = require("./port").jsToPorts,
    nodes      = {
  "hello": {
    "name": "hello",
    "code": "function() {\n return \"hello\";\n}",
    "type": "js",
    "ports": {
      "in": [],
      "out": [
        {
          "name": "return",
          "type": "return",
          "direction": "out"
        }
      ]
    }
  },
  "out": {
    "name": "out",
    "code": "function(data) { console.log(data); }",
    "type": "js",
    "ports": {
      "in": [
        {
          "name": "data",
          "type": "argument",
          "direction": "in"
        }
      ],
      "out": []
    }
  },
  "THEFLOW": {
    "type": "flow",
    "name": "THEFLOW",
    "nodes": {
      "bc552d91-aab6-7e5a-d336-486ceb714a33": {
        "name": "http respond",
        "options": {
          "x": 295,
          "y": 344,
          "style": {
            "backgroundColor": "rgb(202, 128,43)"
          }
        }
      },
      "f502d984-0159-1835-be80-30271b752e27": {
        "name": "http server",
        "options": {
          "x": 293,
          "y": 177,
          "style": {
            "backgroundColor": "rgb(246, 128,83)"
          }
        }
      },
      "02d3fef4-d3ab-90f4-2b7b-57385e7f634a": {
        "name": "port 10017",
        "options": {
          "x": 292,
          "y": 26,
          "style": {
            "backgroundColor": "rgb(78, 128,53)"
          }
        }
      }
    },
    "pipes": [
      {
        "source": {
          "id": "02d3fef4-d3ab-90f4-2b7b-57385e7f634a",
          "port": [
            "out",
            "return"
          ]
        },
        "target": {
          "id": "f502d984-0159-1835-be80-30271b752e27",
          "port": [
            "in",
            "port"
          ]
        }
      },
      {
        "source": {
          "id": "f502d984-0159-1835-be80-30271b752e27",
          "port": [
            "out",
            "response"
          ]
        },
        "target": {
          "id": "bc552d91-aab6-7e5a-d336-486ceb714a33",
          "port": [
            "in",
            "res"
          ]
        }
      },
      {
        "source": {
          "id": "f502d984-0159-1835-be80-30271b752e27",
          "port": [
            "out",
            "request"
          ]
        },
        "target": {
          "id": "bc552d91-aab6-7e5a-d336-486ceb714a33",
          "port": [
            "in",
            "req"
          ]
        }
      }
    ]
  },
  "http server": {
    "name": "http server",
    "code": "function(port, request, response) {\n  require(\"http\").createServer(function(res, res) {\n    request(req);\n    response(res); \n  }); \n}",
    "type": "js",
    "ports": {
      "in": [
        {
          "name": "port",
          "type": "argument",
          "direction": "in"
        }
      ],
      "out": [
        {
          "name": "request",
          "type": "callback",
          "direction": "out"
        },
        {
          "name": "response",
          "type": "callback",
          "direction": "out"
        }
      ]
    }
  },
  "port 10017": {
    "name": "port 10017",
    "code": "function() { return 10017; }",
    "type": "js",
    "ports": {
      "in": [],
      "out": [
        {
          "name": "return",
          "type": "return",
          "direction": "out"
        }
      ]
    }
  },
  "http respond": {
    "name": "http respond",
    "code": "function(req, res) {\n res.writeHead(200, { \"Content-type\": \"text/plain\"});\n res.end(\"hello!\");\n}",
    "type": "js",
    "ports": {
      "in": [
        {
          "name": "req",
          "type": "argument",
          "direction": "in"
        },
        {
          "name": "res",
          "type": "argument",
          "direction": "in"
        }
      ],
      "out": []
    }
  }
};

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
