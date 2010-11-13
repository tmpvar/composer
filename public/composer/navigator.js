composer.navigator = {
  go : function(nodeName) {
    composer.currentFlow = nodeName;

    // Maintain consistency with the location bar
    // TODO BROWSER: this is browser specific and needs to be moved.
    composer.navigator._hashchange_last = '#/nodes/' + nodeName;
    window.location.hash = composer.navigator._hashchange_last;

    var selected = null,
        update   = function() {
          composer.save('put');
        };

    jQuery.ajax({
      url : "/nodes/" + composer.currentFlow,
      dataType: "json",
      success : function(data) {
        if (composer.scene) {
          // unbind the dirty event so there are no mishaps
          composer.scene.event.unbind("node.dirty", update);

          // clean the existing scene
          composer.scene.removeAll();
        }
        composer.scene.add(composer.transport.decode(data));
        composer.scene.width=0;
        composer.scene.height=0;
        composer.scene.event.bind("node.dirty", update);
      },
      error : function(text) {
        composer.save();
      }
    })
  },
  _hashchange_last : '',
  pollHashChange   : function() {
    if(composer.navigator._hashchange_last !== location.hash) {
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


