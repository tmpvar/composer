var sys    = require("sys"),
    port = require("../server/port");

var tests = [], pass = 0, fail = 0;
var ok = function(logic, failmsg)
{
    var test = {
      pass: logic,
      msg : failmsg,
    }

    tests.push(test);

    if (!logic) {
      try {
        throw new Error(failmsg);
      } catch (e) {
        console.log(e.stack);
        fail++;
      }
    } else {
      pass++;
    }
}

// Port generation
var portTests = [
  'function() {\n  return \"world\";\n}',[0,1],
  'function(str) { return str; }',[1,1],
  'function(str, fn) { setTimeout(function() { fn("hello!"); })}',[1,1]

  // TODO: is this required? maybe we can have dynamic ports
  //'function() { setTimeout(function() { arguments[0]("hello!"); })}',[1,1]
], res, i;

for (i=0; i<portTests.length; i+=2) {
  res = port.jsToPorts(portTests[i]);

  ok(res['in'].length === portTests[i+1][0], 
     "in-ports for '" + portTests[i] + "' should be " + portTests[i+1][0] +
     " not " + res['in'].length);

  ok(res['out'].length === portTests[i+1][1],
     "out-ports for '" + portTests[i] + "' should be " + portTests[i+1][1] + 
     " not " + res['out'].length);
}

sys.puts(JSON.stringify({
 total: pass+fail,
 fail: fail,
 pass: pass
}));
