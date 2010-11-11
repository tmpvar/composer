composer.navigator = {
  go : function(nodeName) {
    composer.currentFlow = nodeName;

    // Maintain consistency with the location bar
    // TODO BROWSER: this is browser specific and needs to be moved.
    composer.navigator._hashchange_last = '#/nodes/' + nodeName;
    window.location.hash = composer.navigator._hashchange_last;

    var selected = null;
    jQuery.ajax({
      url : "/nodes/" + composer.currentFlow,
      dataType: "json",
      success : function(data) {
        composer.scene.add(composer.transport.decode(data));
        composer.scene.width=0;
        composer.scene.height=0;
      },
      error : function(text) {
        console.log("ERROR", text);
      }
    })
  },
  _hashchange_last : '',
  pollHashChange   : function() {
    if(composer.navigator._hashchange_last!=location.hash) {
      // clean the existing scene
      composer.scene.removeAll();

      // load up the new selection
      composer.navigator._hashchange_last = location.hash;
      route(location.hash).run();
    }
  }
};



// Setup the Hash based routes
route("#/nodes/:node").bind(function(obj) {
  composer.navigator.go(obj.node)
});

// Poll for changes
setInterval(composer.navigator.pollHashChange, 50);

