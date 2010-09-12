var parse = require("./parser").parser.parse;

module.exports.jsToPorts = function(js) {
  var ip=0,op=0, res;
  recurse(parse(js),
          function(v) { ip+=v; },
          function(v) { op+=v; });
  return [ip, op];
};

// Roll down the results

function recurse(structure, infn, outfn, scope) {
  if (!structure || !structure.type) { return; }
  var i=0, l;

  // Process the types
  switch (structure.type)
  {
    case 'Program':
      scope = {};
    break;

    case 'Function':
      /*
        if we're already handling an outer function, keep the scope around
      */
      scope = (scope.args)  ?
               scope        :
               {args:{}};

      if (structure.params && structure.params.length > 0) {
        infn(structure.params.length);
        l = structure.params.length
        for (i=0; i<l; i++) {
          scope.args[structure.params[i]] = true;
        }
      }
    break;

    case 'FunctionCall':
      if (structure.name.name && scope.args[structure.name.name]) {
        infn(-1);
        outfn(1);
      }
      l = structure.arguments.length;
      for (i=0; i<l; i++) {
        recurse(structure.arguments[i], infn, outfn, scope);
      }
    break;

    case 'ReturnStatement':
      outfn(1);
    break;
  }

  // Continue down if there are more children elements
  if (structure.elements) {
    l=structure.elements.length;
    for (i=0; i<l; i++) {
      recurse(structure.elements[i], infn, outfn, scope);
    }
  }
}
