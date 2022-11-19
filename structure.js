class Structure {
	constructor () {
		this.nodes = [];
		this.members = [];
		this.nodalLoads = [];
		this.globalLoads = [];
		this.dofs = [];
		this.supports =[];
		this.matrix = undefined;
		this.length = 0;
	}
	
	
	constructStructureFromSpans (spanArray, stiffness) {
		this.clearStructure();
		let spanDivisions = 10;  // refine structure as needed
		
		let globalDist = 0;
		spanArray.forEach(span => {
			let spanDist = 0;
			
			while (spanDist < span) { 
				let node = new Node(globalDist);
				this.addNode(node);
				if (spanDist === 0) {this.addSupport(node)};
				spanDist = Math.round( (spanDist + span/spanDivisions)*1000) /1000; //rounding to deal with floating point precision in JS
				globalDist = Math.round( (globalDist + span/spanDivisions)*1000) /1000;
			}
		});
		
		let lastNode = new Node(globalDist);
		this.addNode(lastNode);
		this.addSupport(lastNode);
		
		for (let i = 0; i < this.nodes.length - 1; i++) {
			let nearNode = this.nodes[i];
			let farNode = this.nodes[i + 1];
			let member = new Member(nearNode, farNode, stiffness);
			this.addMember(member);
		}
	}
	
	clearStructure() { 
		this.nodes = [];
		this.members = [];
		this.nodalLoads = [];
		this.globalLoads = [];
		this.dofs = [];
		this.supports =[];
		this.matrix = undefined;
		this.length = 0;
	}
	
	addNode (node) {
		this.nodes.push(node);
		this.dofs.push(node.yDOF);
		this.dofs.push(node.zDOF);
		
		if (node.coord > this.length) {this.length = node.coord;}
	}
	
	addMember (member) {
		this.members.push(member);
	}
	
	addNodalLoad (dof, magnitude) {
		let load = new NodalLoad(dof, magnitude);
		this.nodalLoads.push(load);
	}
	
	
	addSupport (node) {
		let support = new Support(node);
		this.supports.push(support);
	}
	
	addGlobalLoad (globalLoad) {
		this.globalLoads.push( globalLoad );
	}
	
	removeAllLoads () {
		this.globalLoads = [];
		this.removeAllNodalLoads();
	}
	
	removeAllNodalLoads () {
		this.nodalLoads = [];	
		this.members.forEach( member => member.resetFixedEndMoments() );
	}
	
	createNodalLoadsFromGlobalLoads () {
		this.removeAllNodalLoads();
		
		this.globalLoads.forEach( globalLoad => {
			if (globalLoad.coord >= 0 && globalLoad.coord <= this.length) {
				let member = this.memberAtPosition(globalLoad.coord);
				let a = globalLoad.coord - member.nearNode.coord;
				let b = member.length - a;
				
				// construct fixed-end-moments unless load is exactly at a node location
				if (a === 0) {
					this.addNodalLoad(member.nearNode.yDOF, globalLoad.magnitude); 
				} else if (b === 0)	{
					this.addNodalLoad(member.farNode.yDOF, globalLoad.magnitude);
				} else {
					member.femMomentA += globalLoad.magnitude * b**2 * a / member.length**2;
					member.femMomentB += -(globalLoad.magnitude * a**2 * b / member.length**2);
					member.femShearA += globalLoad.magnitude * (3*a + b)* b**2 / member.length**3;
					member.femShearB += globalLoad.magnitude * (a + 3*b)* a**2 / member.length**3;
				}
			}
		});
		
		this.members.forEach( member => {
			if (member.femShearA != 0) {this.addNodalLoad(member.nearNode.yDOF, member.femShearA)};
			if (member.femMomentA != 0) {this.addNodalLoad(member.nearNode.zDOF, member.femMomentA)};
			if (member.femShearB != 0) {this.addNodalLoad(member.farNode.yDOF, member.femShearB)};
			if (member.femMomentB !=0) {this.addNodalLoad(member.farNode.zDOF, member.femMomentB)};
		});
		
	}
	
	createNodalLoadsFromDistributedLoads () {
		//TODO
	}
	
	stepLoads (increment) { 
		this.globalLoads.forEach(load => load.stepLoad(increment) );
	}
	
	memberAtPosition (position) {  
		let foundMember = undefined;
		this.members.forEach( member => {
			if (member.nearNode.coord <= position && member.farNode.coord >= position) {foundMember = member;}
		});
		return foundMember;
	}
	
	spanLengths() { //TODO need this? 
		let spanLengths = [];
		for (let i = 1; i < this.supports.length; i++) {
			spanLengths.push( this.supports[i].coord() - this.supports[i-1].coord() );
		}
		return spanLengths;
	}
	
	assignMatrixIndecesToDOFs () {
		this.dofs.sort( (a,b) => a.isRestrained - b.isRestrained); //position restrained DOFs last in stiffness matrix
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
			
			let temp = this.matrix.get([i1, i1]) + member.matrix.get([0, 0]);
			this.matrix.set([i1, i1], temp);
			
			temp = this.matrix.get([i1, i2]) + member.matrix.get([0, 1]);
			this.matrix.set([i1, i2], temp);
			
			temp = this.matrix.get([i1, i3]) + member.matrix.get([0, 2]);
			this.matrix.set([i1, i3], temp);
			
			temp = this.matrix.get([i1, i4]) + member.matrix.get([0, 3]);
			this.matrix.set([i1, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i2, i1]) + member.matrix.get([1, 0]);
			this.matrix.set([i2, i1], temp);
			
			temp = this.matrix.get([i2, i2]) + member.matrix.get([1, 1]); 
			this.matrix.set([i2, i2], temp);
			
			temp = this.matrix.get([i2, i3]) + member.matrix.get([1, 2]);
			this.matrix.set([i2, i3], temp);
			
			temp = this.matrix.get([i2, i4]) + member.matrix.get([1, 3]);
			this.matrix.set([i2, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i3, i1]) + member.matrix.get([2, 0]);
			this.matrix.set([i3, i1], temp);
			
			temp = this.matrix.get([i3, i2]) + member.matrix.get([2, 1]);
			this.matrix.set([i3, i2], temp);
			
			temp = this.matrix.get([i3, i3]) + member.matrix.get([2, 2]); 
			this.matrix.set([i3, i3], temp);
			
			temp = this.matrix.get([i3, i4]) + member.matrix.get([2, 3]);
			this.matrix.set([i3, i4], temp);
			
			/*  */
			
			temp = this.matrix.get([i4, i1]) + member.matrix.get([3, 0]);
			this.matrix.set([i4, i1], temp);
			
			temp = this.matrix.get([i4, i2]) + member.matrix.get([3, 1]); 
			this.matrix.set([i4, i2], temp);
			
			temp = this.matrix.get([i4, i3]) + member.matrix.get([3, 2]);
			this.matrix.set([i4, i3], temp);
			
			temp = this.matrix.get([i4, i4]) + member.matrix.get([3, 3]); 
			this.matrix.set([i4, i4], temp);
			
		});
	}
	
	partitionStiffnessMatrix () {
		if (this.matrix === undefined) {return}
		let subsetSize = this.dofs.length - this.supports.length;
		return this.matrix.subset(math.index(math.range(0, subsetSize), math.range(0, subsetSize)));
	}
	
	loadVector () {
		let vectorSize = this.dofs.length - this.supports.length;
		let loadArr = math.zeros(vectorSize);
		
		this.nodalLoads.forEach( load => {
			if (!load.dof.isRestrained) {
				let newLoad = loadArr.get([load.dof.matrixIndex]) + load.magnitude; // need in case there are loads that are applied to the same node
				loadArr.set([load.dof.matrixIndex], newLoad);
			}
		});
		
		return loadArr;
	}
	
	solveDeflections() {
		if (this.matrix === undefined) {return}
		
		let displacements = math.multiply(this.loadVector(), math.inv(this.partitionStiffnessMatrix()));

		displacements.forEach( (displacement, idx) => {
			this.dofs[idx].displacement = displacement;
		});
		
	}
	
	solveMomentsAndShears() {
		if (this.matrix === undefined) {return}
		
		this.members.forEach(member => {
			
			let memberDisplacementVector = math.matrix([
					member.nearNode.yDOF.displacement,
					member.nearNode.zDOF.displacement,
					member.farNode.yDOF.displacement,
					member.farNode.zDOF.displacement
				]);
				
			let forces = math.multiply(memberDisplacementVector, member.matrix);
			
			member.beginShear = (forces.get([0]) - member.femShearA);
			member.beginMoment = (forces.get([1]) - member.femMomentA);
			member.endShear = (forces.get([2]) - member.femShearB);
			member.endMoment = (forces.get([3]) - member.femMomentB);
			
		});
	}
	
	solveReactions() {
		if (this.matrix === undefined) {return}
		let displacements = this.dofs.map ( dof => dof.displacement );
		let forces = math.multiply(displacements, structure.matrix);
		
		this.supports.forEach( support => {
			let reaction = forces.get([support.dof.matrixIndex]);
			let fem1 = support.node.backMember ? support.node.backMember.femShearB : 0; 
			let fem2 = support.node.aheadMember ? support.node.aheadMember.femShearA : 0;
			let totalReaction = reaction - fem1 - fem2;
			
			// need to account for when a load is directly on top of a support
			structure.globalLoads.forEach ( load => {
				if (load.coord === support.coord() ) {totalReaction -= load.magnitude}
			});
			
			support.setReaction(totalReaction);
		});
		
		
	}
	
	solve() {
		let startTime = Date.now();
		
		if (this.matrix === undefined) {
			this.assignMatrixIndecesToDOFs();
			this.calculateStiffnessMatrix();
		}
		// console.log(`calculated stiffness matrix ${Date.now() - startTime} milliseconds`);
		
		this.createNodalLoadsFromGlobalLoads();
		let time2 = Date.now();
		// console.log(`created nodal loads ${time2 - startTime} milliseconds`);
		
		this.solveDeflections();
		let time3 = Date.now();
		// console.log(`solved Deflections ${time3 - time2} milliseconds`);
		
		this.solveMomentsAndShears();
		let time4 = Date.now();
		// console.log(`solved Moments & Shears ${time4 - time3} milliseconds`);
		
		this.solveReactions();
		let time5 = Date.now();
		// console.log(`solved Reactions ${time5 - time4} milliseconds`);
		
		let endTime = Date.now();
		// console.log(`Total solve time = ${endTime - startTime} milliseconds`);
	}
	
	
	// minDeflection () {
		// let deflections = this.nodes.map (node => node.yDOF.displacement);
		// return Math.min(...deflections); 
	// }
	
	// maxDeflection () {
		// let deflections = this.nodes.map (node => node.yDOF.displacement);
		// return Math.max(...deflections); 
	// }
	
}