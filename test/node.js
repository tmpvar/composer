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
], res, i;

for (i=0; i<portTests.length; i+=2) {
  try {
    res = port.jsToPorts(portTests[i]);
    console.dir(res);
  } catch (e) {
  console.log("WTF!");
    console.log(e);
  }
  ok(res[0] === portTests[i+1][0], 
     "in-ports for '" + portTests[i] + "' should be " + portTests[i+1][0]);

  ok(res[1] === portTests[i+1][1],
     "out-ports for '" + portTests[i] + "' should be " + portTests[i+1][1]);
}


sys.puts(JSON.stringify({
 total: pass+fail,
 fail: fail,
 pass: pass
}));
