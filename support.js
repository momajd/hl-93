class Support {
	constructor(node) {
		this.node = node;
		this.dof = node.yDOF;
		node.yDOF.isRestrained = true;
		this.reaction = undefined;
	}
	
	coord() {
		return this.node.coord;
	}
	
	setReaction(reaction) {
		this.reaction = reaction;
	}
}