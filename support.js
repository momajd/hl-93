class Support {
	constructor(node) {
		this.node = node;
		node.yDOF.isRestrained = true;
	}
	
	coord() {
		return this.node.coord;
	}
}