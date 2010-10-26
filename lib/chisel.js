// Spawn a dialog for choosing a node from the db
var chooser = carena.build({
  x: 10,
  y: 10,
  height: 100,
  width: 400,
  style : {
    backgroundColor: "white"
  }
},[
  "carena.Node", 
  "carena.Renderable",
  "carena.Draggable"
]),
input = carena.build({
  x : chooser.x+3,
  y : chooser.y+3,
  width : chooser.width-6,
  height : chooser.height-6,
  style : {
    backgroundColor: "#00000",
    color: "white",
    paddingLeft : 3,
    paddingRight : 3,
    paddingTop : 3,
    paddingBottom : 3
  }
},[
  "cider.Textual",
  "cider.Editable",
  "carena.RelativeToParent",
  "cider.FocusTarget"
]),
available = carena.build({},[
  "carena.Node"
]);

input.font.set(composer.defaultFont);
input.setFocus(false);
chooser.add(input).add(available);

composer.chisel = {
  modalManager : null,
  hide         : function() {
    composer.chisel.modalManager.hide(chooser);
    input.setFocus(false);
    input.fromString("");
  },
  show         : function() {
    input.setFocus(true);
    composer.chisel.modalManager.show(chooser);
  }
};

var timeout = null;
input.event.bind("text.*", function(name, data) {

  if (timeout) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(function() {
    var str = data.node.toString(), node;
    if (str.length > 0) {
      $.ajax({
        url      : "/chisel?q=" + str + "",
        dataType : "json",
        success  : function(data) {
          while(available.children.length > 0) {
            available.remove(available.child(0));
          }
          for (var i=0; i<data.length; i++) {
            node = carena.build({
              x : chooser.x,
              y : chooser.y + chooser.height + i*20,
              width: chooser.width,
              height: 20,
              text : data[i]["name"],
              style : {
                backgroundColor : "black",
                color: "white"
              }
            }, [
              "cider.Textual",
              "carena.RelativeToParent"
            ]);
            available.add(node);
          }
        },
        error: function() {
          while(available.children.length > 0) {
            available.remove(available.child(0));
          }
        }
      });
    } else {
      while(available.children.length > 0) {
        available.remove(available.child(0));
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
