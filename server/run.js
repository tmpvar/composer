var connect    = require("connect"),
    mongo      = require("mongoose").Mongoose,
    db         = mongo.connect('mongodb://localhost/composer'),
    Flow;

mongo.model('Flow',{
  properties : ["name"],
  indexes    : ["name"]
});
Flow = db.model('Flow');

connect.createServer.apply(connect, [
  connect.bodyDecoder(),
  connect.router(function(app) {
    app.get("/flows/:name", function(req, res, next) {
      Flow.find({name: "123"}).all(function(cursor) {
        if (!cursor || cursor.length === 0) {
          res.writeHead(404, {'Content-Type':'text/json'});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          res.writeHead(200, {'Content-Type':'text/json'});
          res.end(JSON.stringify(cursor.pop(), true, "  "));
        }
      });
    });
    app.post("/flows", function(req, res, next) {
      if (req.body) {
        var flow = new Flow(req.body);
        if (flow.IsNew()) {
          flow.save(function() {
            console.log(flow.toString());
          });
        }
      }
    });

  }),
  connect.staticProvider(__dirname + '/www/')
]).listen(3000);
