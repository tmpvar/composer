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
  connect.logger(),
  connect.bodyDecoder(),
  connect.router(function(app) {
    app.get("/flows/:name", function(req, res, next) {
      Flow.find({name: req.params.name}).all(function(cursor) {
        if (!cursor || cursor.length === 0) {
          res.writeHead(404, {'Content-Type':'application/json'});
          res.end(JSON.stringify({code: 404, body: "Not Found"}));
        } else {
          res.writeHead(200, {'Content-Type':'application/json'});
          res.end(JSON.stringify(cursor.pop(), null, "  "));
        }
      });
    });
    app.post("/flows", function(req, res, next) {
      if (req.body) {
        req.body.name = "THEFLOW";
        req.body._id = 123123123; 
        var flow = new Flow(req.body, true);
        
       
        //if (flow.IsNew()) {
          flow.save(function() {
            res.writeHead("201",{"Content-Type" : "application/json"});
            res.end('{ "status": 201}');
          });
        //}
      }
    });

  }),
  connect.staticProvider(__dirname + '/../'),
  connect.staticProvider(__dirname + '/../../')
]).listen(3000);
