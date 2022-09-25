class Node {
	constructor(coord) {
		this.coord = coord; 
		this.shear = 0;
		this.moment = 0;
		this.yDOF = new DegreeOfFreedom(this, "y");
		this.zDOF = new DegreeOfFreedom(this, "z");
	}
	
	addSupport() {
		this.yDOF.isRestrained = true;
	}
}