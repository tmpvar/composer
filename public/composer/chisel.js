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

  contexts     : {
    frag : {
      activate : function() { /* noop */ },
      prev     : function() { /* noop */ },
      next     : function() {
        if (!available.child(composer.chisel.selection)) {
          return false;
        }
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
        composer.chisel.context = composer.chisel.contexts.action;
        composer.chisel.context.activate(textNode);
      },
      filter : function(str) {
        for (var i=0; i<composer.chisel.filters.length; i++) {
          composer.chisel.filters[i](str, composer.chisel.addFilterResult);
        }
      }
    },
    action : {
      activate : function(node) {
        composer.chisel.contexts.action.filter('');
        composer.chisel.selection = 0;
      },
      prev : function() {
        action.removeAll();
        frag.removeAll();
        composer.chisel.context = composer.chisel.contexts.frag;
      },
      next : function() {
        // actually perform the action
        var activeNode = available.child(composer.chisel.selection);
        // pass the data back into the fn
        activeNode.representation.data.fn(frag.child(0));

        // reset state
        composer.chisel.context = composer.chisel.contexts.frag;
        composer.chisel.hide();
      },
      filter : function(str) {
        var representation = node.representation, i;
        for (var t=0; t<representation.type.length; t++) {
          var type = representation.type[t];
          if (composer.chisel.actions[type]) {
            var actions = composer.chisel.actions[type],
                l       = actions.length,
                i;

            for (i=0; i<l; i++) {
              var action = composer.chisel.actions[type][i];
              composer.chisel.addFilterResult(null, {
                name : action.name,
                str  : str,
                data : action
              });
            }
          }
        }
      }
    }
  },

  selection    : 0,
  addAction    : function(type, name, cb) {
    if (!composer.chisel.actions[type]) {
      composer.chisel.actions[type] = [];
    }
    composer.chisel.actions[type].push({
      name : name,
      fn   : cb
    });
  },
  modalManager : null,
  hide         : function() {
    composer.chisel.modalManager.hide(chooser);
    frag.removeAll();
    action.removeAll();
    input.setFocus(false);
    input.fromString("");
    available.removeAll();
  },
  show         : function() {
    input.setFocus(true);
    composer.chisel.modalManager.show(chooser);
  },
  perform      : function(action, obj, cb) {

  },

  clearSuggestions : function() {
    if (available && available.removeAll) {
      available.removeAll();
    }
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

composer.chisel.context = composer.chisel.contexts.frag;

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
      composer.chisel.context.next();
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
        composer.chisel.context.filter(str);
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

