// add this action to chisel
composer.chisel.addAction('node', 'add', function(node) {
  var item = node.representation.data.node, features = [
    "carena.Box",
    "carena.Draggable",
    "carena.RelativeToParent",
    "composer.Functional"
  ], nodeType = item.type;

  if (nodeType === "flow") {
    features.push("composer.Composite");
  }

  // Build a real node.
  var rnd = carena.build({x:20, y: 20, width: 100, height:100,
    code : window.location + "nodes/" + item.name,
    name : item.name || "",
    style : {
      backgroundColor: "rgb(" + (new Date()).getTime()%255 +
           ", 128," + Math.round(Math.random()*200%255) + ")",
    }
  }, features);

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
  label.font.set(composer.defaultFont);
  label.style.paddingLeft = 2;
  label.style.paddingTop = 2;

  if (item.ports) {
    if (item.ports.out) {
      for (var i=0; i<item.ports.out.length; i++) {
        rnd.add(carena.build({
          x: rnd.x + (i*22),
          y: rnd.y + rnd.height,
          width: 20,
          height:10,
          style : {
            backgroundColor: "green"
          },
          port : item.ports.out[i]
        }, [
          "carena.RelativeToParent", "composer.Port"
        ]));
      }
    }
    if (item.ports['in']) {
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
    }
  }
  composer.camera.target.add(rnd.add(label));
});
