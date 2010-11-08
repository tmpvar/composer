// add this action to chisel
composer.chisel.addAction('text', 'new node', function(node) {
  composer.spawnEditor(true, node.representation.name, "");
});
