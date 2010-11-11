// add this action to chisel
composer.chisel.addAction('text', 'new flow', function(node) {
  $.ajax({
    url         : '/nodes',
    type        : 'POST',
    dataType    : 'json',
    contentType : 'application/json',
    data     : JSON.stringify({
      "type": "flow",
      "name": node.representation.name,
      "nodes": {},
      "pipes": []
    }),
    //TODO: Error handling
    complete : function() {
      composer.navigator.go(node.representation.name);
    }
  });
});
