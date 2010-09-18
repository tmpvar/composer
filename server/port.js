var parse = require("./parser").parser.parse;

module.exports.jsToPorts = function(js) {
  var ip=[],op=[], res = {
   'in'  : {},
   'out' : {},
  }
  recurse(parse(js), res);

  // Clean up the results
  for (var inp in res['in']) {
    ip.push(res['in'][inp]);
  }

  for (var outp in res['out']) {
    op.push(res['out'][outp]);
  }

  return { 'in' : ip, 'out' : op };
};

// Roll down the results

function recurse(structure, data, scope) {
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
        l = structure.params.length
        for (i=0; i<l; i++) {

          data['in'][structure.params[i]] = {
            name      : structure.params[i],
            type      : "argument",
            direction : "in",
          };

          scope.args[structure.params[i]] = true;
        }
      }
    break;

    case 'FunctionCall':
      if (structure.name.name && scope.args[structure.name.name]) {
        if (data['in'][structure.name.name]) {
          delete data['in'][structure.name.name];
        }

        data['out'][structure.name.name] = {
          name      : structure.name.name,
          type      : "callback",
          direction : "out",
        };
      }
      l = structure.arguments.length;
      for (i=0; i<l; i++) {
        recurse(structure.arguments[i], data, scope);
      }
    break;

    case "VariableDeclaration":
      recurse(structure.value, data, scope);
    break;

    case "VariableStatement":
      if (structure.declarations) {
        var dd = 0, dl = structure.declarations.length;
        for (dd; dd<dl; dd++) {
          recurse(structure.declarations[dd], data, scope);
        }
      }
    break;

    case 'ReturnStatement':
      data['out']["return"] = {
        name      : "return",
        type      : "return",
        direction : "out",
      };

      if (structure.value) {
        recurse(structure.value, data, scope);
      }
      
    break;
  }

  if (structure.value && structure.value.type) {
    recurse(structure.value, data, scope);
  }

  // Continue down if there are more children elements
  if (structure.elements) {
    l=structure.elements.length;
    for (i=0; i<l; i++) {
      recurse(structure.elements[i], data, scope);
    }
  }
}
