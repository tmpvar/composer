composer.spawnEditor = function(newNode, nodeName, nodeCode) {
  // allow only one editor at a time
  if (composer.editorWindow) {
    composer.editorWindow.parent.remove(composer.editorWindow);
    name.parent === null;
    editor.parent === null;
    composer.editorWindow = false;
  }

  // spawn a new carena
  composer.editorWindow = carena.build({
    style : {
      backgroundColor: "blue",
    },
    x:100, y: 100,
    height: 310,
    width: 400
  },[
    "carena.Node",
    "carena.Draggable"
  ]);

  var editor = carena.build({
    x:110,y:140, width: 380, height: 260
  }, [
    "carena.Node",
    "carena.RelativeToParent",
    "cider.Textual",
    "cider.Editable",
    "cider.FocusTarget"
  ]),
  lineNumbers = carena.build({},[
    "cider.LineNumbers",
    "carena.RelativeToParent"
  ]),
  name = carena.build({
    x:110,
    y:110,
    width: 270,
    height: 20
  },[
    "carena.Node",
    "carena.RelativeToParent",
    "cider.Textual",
    "cider.Editable",
    "cider.FocusTarget"
  ]),
  saveButton = carena.build({
    width: 80,
    height: 20,
    x:410,
    y:110,
    style : {
      backgroundColor: "grey"
    }
  },[
    "carena.Box",
    "carena.Eventable",
    "carena.RelativeToParent"
  ]);

  name.style.paddingLeft = 10;
  name.fromString(nodeName);
  name.setFocus();
  name.font.set(composer.defaultFont);
  editor.font.set(composer.defaultFont);
  // Setup the button
  // TODO: this probably could be made easier heh.
  saveButton.event.bind("mouse.in", function() {
    saveButton.color = "orange";
    return false;
  });
  saveButton.event.bind("mouse.out", function(name, data) {
    saveButton.color = "grey";
    return false;
  });
  saveButton.renderSteps.push(function(renderer) {

    renderer.context.fillStyle = saveButton.color;
    renderer.context.fillRect(saveButton.x,
                              saveButton.y,
                              saveButton.width,
                              saveButton.height);

    renderer.context.fillStyle = "black";
    renderer.context.fillText("save", saveButton.x+20, saveButton.y+14);
  });

  function mouseUp(evName, data) {
    if (data.target === saveButton) {
      // Save to storage

      // remove the editor
      // TODO: figure out the root cause of this
      if (!editor.parent || !name.parent || !composer.editorWindow.parent) {
        return;
      }
      var req = {
        contentType: "application/json",
        dataType : "json",
        data : JSON.stringify({
          name: name.toString(),
          code: editor.toString()
        }),
        success : function() {
          editor.parent.remove(editor);
          name.parent.remove(name);
          composer.editorWindow.parent.remove(composer.editorWindow);
          name.parent === null;
          editor.parent === null;
          composer.editorWindow = false;
        }
      };
      jQuery.ajax({

        url: "/nodes/"+name.toString(),
        success : function() { newNode = false; },
        error   : function() { newNode = true; },
        contentType : "application/json",
        dataType : 'json',
        complete : function() {
          req.url = (newNode) ? "/nodes" : "/nodes/" + name.toString();
          req.type = (newNode) ? "post" : "put";
          jQuery.ajax(req);
        }
      });

      return false;
    }
  }
  saveButton.event.bind("mouse.up", mouseUp);
  editor.fromString(nodeCode);

  composer.camera.add(composer.editorWindow.add(editor.add(lineNumbers))
        .add(name)
        .add(saveButton));

  name.setFocus(true);
  name.event.bind("keyboard.down", function(name, data) {
    if (data.key === 9) {
      editor.setFocus(true);
    }
  });
}
