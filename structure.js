class Structure {
	constructor () {
		this.nodes = [];
		this.members = [];
		this.loads = [];
		this.dofs = [];
		this.supports =[];
		this.matrix = undefined;
		this.EI = 1000; //assumed 
	}
	
	addNode (node) {
		this.nodes.push(node);
		this.dofs.push(node.yDOF);
		this.dofs.push(node.zDOF);
	}
	
	addMember (member) {
		this.members.push(member);
	}
	
	addLoad (node, magnitude) {
		let load = new Load(node, magnitude);
		this.loads.push(load);
	}
	
	removeAllLoads () {
		this.loads = [];
	}
	
	addSupport (node) {
		let support = new Support(node);
		this.supports.push(support);
	}
	
	memberAtPosition (position) {
		let foundMember = undefined;
		this.members.forEach( member => {
			if (member.nearNode.coord <= position && member.farNode.coord > position) {
				foundMember = member;
			}
		});
		return foundMember;
	}
	
	assignMatrixIndecesToDOFs () {
		this.dofs.sort( (a,b) => a.isRestrained - b.isRestrained);
		this.dofs.forEach( (dof, idx) => dof.matrixIndex = idx);
	}
	
	
	calculateStiffnessMatrix () {
		let numberDOFs = this.nodes.length * 2; 
		this.matrix = math.zeros(numberDOFs, numberDOFs);
		
		this.members.forEach(member => {
			let i1 = member.nearNode.yDOF.matrixIndex;
			let i2 = member.nearNode.zDOF.matrixIndex;
			let i3 = member.farNode.yDOF.matrixIndex;
			let i4 = member.farNode.zDOF.matrixIndex;
			
			/*  */
			
			let temp = this.matrix.get([i1, i1]) + 12/math.pow(member.length, 3) * this.EI;
			this.matrix.set([i1, i1], temp);
			
			temp = this.matrix.get([i1, i2]) + 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i1, i2], temp);
			
			temp = this.matrix.get([i1, i3]) - 12/math.pow(member.length, 3) * this.EI;
			this.matrix.set([i1, i3], temp);
			
			temp = this.matrix.get([i1, i4]) + 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i1, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i2, i1]) + 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i2, i1], temp);
			
			temp = this.matrix.get([i2, i2]) + 4/member.length * this.EI; 
			this.matrix.set([i2, i2], temp);
			
			temp = this.matrix.get([i2, i3]) - 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i2, i3], temp);
			
			temp = this.matrix.get([i2, i4]) + 2/member.length * this.EI;
			this.matrix.set([i2, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i3, i1]) - 12/math.pow(member.length, 3) * this.EI;
			this.matrix.set([i3, i1], temp);
			
			temp = this.matrix.get([i3, i2]) - 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i3, i2], temp);
			
			temp = this.matrix.get([i3, i3]) + 12/math.pow(member.length, 3) * this.EI; 
			this.matrix.set([i3, i3], temp);
			
			temp = this.matrix.get([i3, i4]) - 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i3, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i4, i1]) + 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i4, i1], temp);
			
			temp = this.matrix.get([i4, i2]) + 2/member.length * this.EI; 
			this.matrix.set([i4, i2], temp);
			
			temp = this.matrix.get([i4, i3]) - 6/math.pow(member.length, 2) * this.EI;
			this.matrix.set([i4, i3], temp);
			
			temp = this.matrix.get([i4, i4]) + 4/member.length * this.EI; 
			this.matrix.set([i4, i4], temp);
			
		});
	}
	
	partitionStiffnessMatrix () {
		if (this.matrix === undefined) {return;}
		let subsetSize = this.dofs.length - this.supports.length;
		return this.matrix.subset(math.index(math.range(0, subsetSize), math.range(0, subsetSize)));
	}
	
	loadVector () {
		let vectorSize = this.dofs.length - this.supports.length;
		let loadArr = math.zeros(vectorSize);
		
		this.loads.forEach( load => {
			if (!load.node.yDOF.isRestrained) {
				loadArr.set([load.node.yDOF.matrixIndex], load.magnitude);
			}
		});
		
		return loadArr;
	}
	
	solveDeflections() {
		if (this.matrix === undefined) {
			this.assignMatrixIndecesToDOFs();
			this.calculateStiffnessMatrix();
		}
		
		let displacements = math.multiply(this.loadVector(), math.inv(this.partitionStiffnessMatrix()));

		displacements.forEach( (displacement, idx) => {
			this.dofs[idx].displacement = displacement;
		});
	}
	
	solveMomentsAndShears() {
		if (this.matrix === undefined) {return;}
		
		this.members.forEach(member => {
			
			let memberDisplacementVector = math.matrix([
					member.nearNode.yDOF.displacement,
					member.nearNode.zDOF.displacement,
					member.farNode.yDOF.displacement,
					member.farNode.zDOF.displacement
				]);
				
			let forces = math.multiply(memberDisplacementVector, member.matrix);
			
			member.beginShear = forces.get([0]);
			member.beginMoment = forces.get([1]);
			member.endShear = forces.get([2]);
			member.endMoment = forces.get([3]);
			
		});
	}
	
	
}