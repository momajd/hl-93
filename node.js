class Node {
	constructor(coord) {
		this.coord = coord; 
		this.yDOF = new DegreeOfFreedom(this, "y");
		this.zDOF = new DegreeOfFreedom(this, "z");
		this.backMember = undefined;
		this.aheadMember = undefined;
	}
	
	addSupport() {
		this.yDOF.isRestrained = true;
	}
	
	isSupported() {
		return this.yDOF.isRestrained === true;
	}
}