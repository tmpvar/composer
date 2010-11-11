// add this action to chisel
composer.chisel.addAction('text', 'edit flow', function(node) {
  composer.navigator.go(node.representation.name);
});
