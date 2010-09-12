var parse = require("./parser").parser.parse;

module.exports.jsToPorts = function(js) {
  var ip=[],op=[], res = {
   'in'  : {},
   'out' : {},
   inLength : 0,
   outLength : 0
  }
  recurse(parse(js), res);
  
  // Clean up the results
  
  for (var inp in res['in']) {
    var item = res['in'][inp];
    ip[item.portIndex] = item;
  }

  for (var outp in res['out']) {
    var item = res['out'][outp];
    op[item.portIndex] = item;
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
            portIndex : data.inLength
          };
          data.inLength++;

          scope.args[structure.params[i]] = true;
        }
      }
    break;

    case 'FunctionCall':
      if (structure.name.name && scope.args[structure.name.name]) {
        
        if (data['in'][structure.name.name]) {
          delete data['in'][structure.name.name];
          data.inLength--;
        }

        data['out'][structure.name.name] = {
          name      : structure.name.name,
          type      : "callback",
          direction : "out",
          portIndex : data.outLength
        };
        data.outLength++;
      }
      l = structure.arguments.length;
      for (i=0; i<l; i++) {
        recurse(structure.arguments[i], data, scope);
      }
    break;

    case 'ReturnStatement':
      data['out']["return"] = {
        name      : "return",
        type      : "return",
        direction : "out",
        portIndex : data.outLength
      };
      data.outIndex++;
    break;
  }

  // Continue down if there are more children elements
  if (structure.elements) {
    l=structure.elements.length;
    for (i=0; i<l; i++) {
      recurse(structure.elements[i], data, scope);
    }
  }
}
