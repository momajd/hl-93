class Member {
	constructor(nearNode, farNode, stiffness) {
		this.nearNode = nearNode; 
		nearNode.aheadMember = this;
		this.farNode = farNode;
		farNode.backMember = this;
		this.length = farNode.coord - nearNode.coord;
		this.EI = stiffness;
		this.calculateMemberMatrix();
		this.beginShear = undefined; //defined when structure is solved
		this.beginMoment = undefined;
		this.endShear = undefined;
		this.endMoment = undefined; 
		
		// fixed end moments
		this.femMomentA = 0;
		this.femMomentB = 0;
		this.femShearA = 0;
		this.femShearB = 0;
	}
	
	calculateMemberMatrix() {
		this.matrix = math.zeros(4, 4);
		
		this.matrix.set([0, 0], 12*this.EI/this.length**3 );
		this.matrix.set([0, 1], 6*this.EI/this.length**2 );
		this.matrix.set([0, 2], -12*this.EI/this.length**3 );
		this.matrix.set([0, 3], 6*this.EI/this.length**2 );
		
		this.matrix.set([1, 0], 6*this.EI/this.length**2 );
		this.matrix.set([1, 1], 4*this.EI/this.length );
		this.matrix.set([1, 2], -6*this.EI/this.length**2 );
		this.matrix.set([1, 3], 2*this.EI/this.length );
		
		this.matrix.set([2, 0], -12*this.EI/this.length**3 );
		this.matrix.set([2, 1], -6*this.EI/this.length**2 );
		this.matrix.set([2, 2], 12*this.EI/this.length**3 );
		this.matrix.set([2, 3], -6*this.EI/this.length**2 );
		
		this.matrix.set([3, 0], 6*this.EI/this.length**2 );
		this.matrix.set([3, 1], 2*this.EI/this.length );
		this.matrix.set([3, 2], -6*this.EI/this.length**2 );
		this.matrix.set([3, 3], 4*this.EI/this.length );
	}
	
	resetFixedEndMoments() {
		this.femMomentA = 0;
		this.femMomentB = 0;
		this.femShearA = 0;
		this.femShearB = 0;
	}
}