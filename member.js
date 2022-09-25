class Member {
	constructor(nearNode, farNode) {
		this.nearNode = nearNode; 
		this.farNode = farNode;
		this.length = farNode.coord - nearNode.coord;
		this.EI = 1000;  //TODO
		this.calculateMemberMatrix();
		this.beginShear = undefined;
		this.beginMoment = undefined;
		this.endShear = undefined;
		this.endMoment = undefined; 
	}
	
	calculateMemberMatrix() {
		this.matrix = math.zeros(4, 4);
		let test = 1000;
		this.matrix.set([0, 0], 12/math.pow(this.length, 3) * this.EI );
		this.matrix.set([0, 1], 6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([0, 2], -12/math.pow(this.length, 3) * this.EI );
		this.matrix.set([0, 3], 6/math.pow(this.length, 2) * this.EI );
		
		this.matrix.set([1, 0], 6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([1, 1], 4/this.length * this.EI);
		this.matrix.set([1, 2], -6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([1, 3], 2/this.length * this.EI );
		
		this.matrix.set([2, 0], -12/math.pow(this.length, 3) * this.EI );
		this.matrix.set([2, 1], -6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([2, 2], 12/math.pow(this.length, 3) * this.EI );
		this.matrix.set([2, 3], -6/math.pow(this.length, 2) * this.EI );
		
		this.matrix.set([3, 0], 6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([3, 1], 2/this.length * this.EI );
		this.matrix.set([3, 2], -6/math.pow(this.length, 2) * this.EI );
		this.matrix.set([3, 3], 4/this.length * this.EI);
	}
}