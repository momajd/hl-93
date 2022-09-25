class DegreeOfFreedom {
	constructor(node, direction) {
		this.node = node; 
		this.direction = direction;
		this.displacement = 0;
		this.force = 0;
		this.matrixIndex = undefined; // position of dof in the global stiffness matrix
		this.isRestrained = false;
	}
}