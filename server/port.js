var parse = require("./parser").parser.parse;

module.exports.jsToPorts = function(js) {
  var ip=0,op=0, res;

  res = parse(js);
  console.log(JSON.stringify(res));

  return [ip, op];
}
