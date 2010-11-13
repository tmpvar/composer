// add this action to chisel
composer.chisel.addAction('flow', 'edit flow', function(node) {
  composer.navigator.go(node.representation.name);
});
