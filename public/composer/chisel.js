// Spawn a dialog for choosing a node from the db
var chooser = carena.build({
  x: 10,
  y: 10,
  height: 100,
  width: 420,
  style : {
    backgroundColor: "#424242"
  }
},[
  "carena.Node",
  "carena.Renderable",
  "carena.Draggable"
]),
action   = carena.build({
  x: chooser.x+3+(chooser.width/2),
  y: chooser.y+3,
  width : (chooser.width/2)-6,
  height: chooser.height-34,
  style : {
    backgroundColor : "black"
  }
},[
  'carena.Node',
  'carena.RelativeToParent'
]),
frag = carena.build({
  x: chooser.x+3,
  y: chooser.y+3,
  width : (chooser.width/2)-3,
  height: chooser.height-34,
  style : {
    backgroundColor : "black"
  }
},[
  'carena.Node',
  'carena.RelativeToParent'
]),
input = carena.build({
  x : chooser.x+3,
  y : chooser.y+chooser.height-28,
  width : chooser.width-6,
  height : 25,
  style : {
    backgroundColor: "#00000",
    color: "white",
    paddingLeft : 3,
    paddingRight : 3,
    paddingTop : 4,
    paddingBottom : 3
  }
},[
  "cider.Textual",
  "cider.Editable",
  "carena.RelativeToParent",
  "cider.FocusTarget"
]),
available = carena.build({},[
  "carena.Node",
  "carena.RelativeToParent"
]);

chooser._render = chooser.render;
chooser.render = function(renderer) {
  chooser.x = renderer.canvas.width/2-chooser.width/2;
  chooser.y = renderer.canvas.height/2-chooser.height;
  return chooser._render(renderer);
}
input.font.set(composer.defaultFont);
input.setFocus(false);
chooser.add(input).add(available).add(action).add(frag);

composer.chisel = {
  filters      : [],
  actions      : {},
  selection    : 0,
  addAction    : function(type, cb) {
    if (!composer.chisel.actions[type]) {
      composer.chisel.actions[type] = [];
    }
    composer.chisel.actions[type].push(cb);
  },
  modalManager : null,
  hide         : function() {
    composer.chisel.modalManager.hide(chooser);
    frag.removeAll();
    action.removeAll();
    input.setFocus(false);
    input.fromString("");
  },
  show         : function() {
    input.setFocus(true);
    composer.chisel.modalManager.show(chooser);
  },
  perform      : function(action, obj, cb) {

  },

  clearSuggestions : function() {
    available.removeAll();
  },

  addFilterResult : function(err, data) {
    if (err) {
      console.log("ERROR:", err);
    };

    if (data.str === input.toString()) {
      node = carena.build({
        x : chooser.x,
        y : chooser.y + chooser.height + available.children.length*20,
        width: chooser.width,
        height: 20,
        text : data.name,
        representation: data,
        background : '#103069',
        style : {
          backgroundColor : "black",
          color: "white"
        }
      }, [
        "carena.Box",
        "cider.Textual",
        "carena.RelativeToParent"
      ]);
      if (available.children.length === 0) {
        node.background = "#5E99FF";
        window.node = node;
      }
      available.add(node);
    }
  }
};

available.event.bind("mouse.in", function(name, data) {
  available.child(composer.chisel.selection).background = '#103069';
  composer.chisel.selection = data.target.parent.childIndex(data.target);
  available.child(composer.chisel.selection).background = '#5E99FF';
});

// NOTE: this only works because input hasn't bound to this event yet.
input.event.bind("keyboard.down", function(name, data) {
  var ret = false, children = !!available.children.length;

  switch (data.key) {
    case 9:
      if (children) {
        available.child(composer.chisel.selection).background = '#BF6600';
        var textNode = available.child(composer.chisel.selection);
        composer.chisel.clearSuggestions();
        textNode.text = input.text;
        input.fromString("");
        frag.removeAll();
        frag.add(textNode);
        textNode.x = frag.x+10;
        textNode.y = frag.y+10;
        textNode.width = frag.width-20;
        textNode.height = frag.height-20;
        textNode.style.paddingTop = textNode.height/3;
        textNode.style.paddingLeft = 5;

        // TODO: shift context

        // get a list of actions to display to the user

      }
    break;

    case 38: // up
      if (children) {
        available.child(composer.chisel.selection).background = '#103069';
        if (composer.chisel.selection -1 < 0) {
          composer.chisel.selection = available.children.length-1;
        } else {
          composer.chisel.selection -= 1;
        }
        available.child(composer.chisel.selection).background = '#5E99FF';
      }
    break;

    case 40: // down
      if (children) {
        available.child(composer.chisel.selection).background = '#103069';
        if (composer.chisel.selection >= available.children.length-1) {
          composer.chisel.selection = 0;
        } else {
          composer.chisel.selection += 1;
        }
        available.child(composer.chisel.selection).background = '#5E99FF';
      }
    break;

    case 13:
      console.log("return");
    break;

    default:
      console.log(data.key);
      ret = true;
    break;
   }

   return ret;
});

var timeout = null;
input.event.bind("text.*", function(name, data) {
  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(function() {
    var str = data.node.toString(), node;

    // clean the display
    composer.chisel.clearSuggestions();
    composer.chisel.selection = 0;

    if (str.length > 0) {
      for (var i=0; i<composer.chisel.filters.length; i++) {
        composer.chisel.filters[i](str, composer.chisel.addFilterResult);
      }
    }
  }, 100);
});

/*
      jQuery.ajax({
        url: "/nodes",
        dataType: "json",
        success: function(data) {
          var keys = Object.keys(data), l = keys.length, h = 30, w = 300;
          var buildSelectionNode = function(item) {
            var tmp = carena.build({
              y: chooser.y + 1+(i*h)+(i*1),
              x: chooser.x + 10,
              width: chooser.width-20,
              height: h,
              background: "black",
              color: "white",
              code: item.code || "",
              name: item.name || ""
            }, [
              "carena.Node",
              "carena.Eventable",
              "composer.Functional",
              "cider.Textual"
            ]);
            tmp.font.set(defaultFont);
            tmp.event.bind("mouse.in", function() {
              tmp.background = "#222";
            });

            tmp.event.bind("mouse.out", function() {
              tmp.background = "black";
            });

            tmp.event.bind("mouse.click.2", function() {
              chooser.parent.remove(chooser);
              chooser = null;
              spawnEditor(false, item.name, item.code);
            });
            tmp.event.bind("mouse.click", function(name) {
              // Build a real node.
              var rnd = carena.build({x:20, y: 20, width: 100, height:100,
                code : window.location + "nodes/" + item.name,
                name : item.name || "",
                style : {
                  backgroundColor: "rgb(" + (new Date()).getTime()%255 +
                       ", 128," + Math.round(Math.random()*200%255) + ")",
                }
              }, [
                "carena.Box",
                "carena.Draggable",
                "carena.RelativeToParent",
                "composer.Functional"
              ],{});

              var label = carena.build({
                x: rnd.x,
                y:rnd.y,
                width:rnd.width,
                height: 20,
                color: "white",
                text: item.name
              },[
                "carena.Node",
                "cider.Textual",
                "carena.RelativeToParent"
              ]);
              label.font.set(defaultFont);
              label.style.paddingLeft = 2;
              label.style.paddingTop = 2;

              for (var i=0; i<item.ports['out'].length; i++) {
                rnd.add(carena.build({
                  x: rnd.x + (i*22),
                  y: rnd.y + rnd.height,
                  width: 20,
                  height:10,
                  style : {
                    backgroundColor: "green"
                  },
                  port : item.ports['out'][i]
                }, [
                  "carena.RelativeToParent", "composer.Port"
                ]));
              }

              for (var j=0; j<item.ports['in'].length; j++) {
                rnd.add(carena.build({
                  x: rnd.x + (j*22),
                  y: rnd.y - 10,
                  width: 20,
                  height:10,
                  style : {
                    backgroundColor : "red"
                  },
                  port : item.ports['in'][j]
                }, [
                  "carena.RelativeToParent", "composer.Port"
                ]));
              }

              camera.target.add(rnd.add(label));
              if (chooser.parent) {
                chooser.parent.remove(chooser);
              }
              chooser = null;
            });

            tmp.style.paddingLeft = 10;
            tmp.style.paddingTop  = 6;
            tmp.fromString(item.name);
            return tmp;
          }

          for (var i=0; i<l; i++) {
            chooser.add(buildSelectionNode(data[keys[i]]));
          }
        }
      });
    }*/

