// add this action to chisel
composer.chisel.addAction('node', 'edit', function(node) {
  composer.spawnEditor(false,
                       node.representation.data.node.name,
                       node.representation.data.node.code);
});
