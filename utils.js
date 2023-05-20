// <!-- Initial Structure -->
const structure = new Structure();
structure.constructStructureFromSpans([100, 100, 100], 500000);  //initial span lengths and stiffness (EI value).. should match html
	
structure.solve();  //results will be 0 but this is so the moment and shear charts have coordinates

const canvas = document.getElementById("canvas");  
const context = canvas.getContext("2d"); 
canvas.width  = canvas.parentElement.offsetWidth;

const structureView = new StructureView(context, structure);
structureView.redraw();

// <!-- UI Functions -->

function updateNumberOfSpans() {
	let numSpans = parseInt(document.getElementById("numSpans").value);
	if (structureView.spanCounter === 5 && numSpans === 5) {alert("Max number of spans allowed is 5")};
	structureView.spanCounter = numSpans;
	
	for (let i = 1; i <= 5; i++) {
		let element = document.getElementById(`span${i}Div`);
		element.style.display = (i <= numSpans) ? "block" : "none";
	}
	
	updateSpanLengthsAndStiffness();
}

function updateSpanLengthsAndStiffness() {
	let spanArray = [];
	for (let i = 1; i <= structureView.spanCounter; i++) {
		let spanLength = Number(document.getElementById(`span${i}`).value);
		if (spanLength > 0) { spanArray.push(spanLength) };
	}
	
	let stiffness = Number(document.getElementById('stiffnessInput').value);
	
	structure.constructStructureFromSpans(spanArray, stiffness);
	resetLoadsCanvasAndCharts();
}

let stepDistance; // distance that vehicles step after each interval
function updateStepDistance() {
	stepDistance = Number(document.getElementById("stepDistance").value);
}
updateStepDistance();

function createConcentratedLoad() {
	resetLoadsCanvasAndCharts();
	let loadMag = -1*Number(document.getElementById("concentratedLoadInput").value);
	let load = new GlobalLoad(0, loadMag);
	structure.addGlobalLoad(load);
	structureView.redraw();
}

function createHl93TruckLoad () {
	resetLoadsCanvasAndCharts();
	let rearAxleSpacing = document.getElementById("hl93RearAxleSpacing30").checked ? 30 : 14;
	
	let axle1 = new GlobalLoad(0, -8);
	let axle2 = new GlobalLoad(-14, -32);
	let axle3 = new GlobalLoad(-14 - rearAxleSpacing, -32);
	
	[axle1, axle2, axle3].forEach(axle => structure.addGlobalLoad(axle));
	structureView.redraw();
}

function createHl93TandemLoad() {
	resetLoadsCanvasAndCharts();
	let axle1 = new GlobalLoad(0, -25);
	let axle2 = new GlobalLoad(-4, -25);
	[axle1, axle2].forEach(axle => structure.addGlobalLoad(axle));
	structureView.redraw();
}

function createDualTrucks() {
	resetLoadsCanvasAndCharts();
	let rearAxleSpacing = Number(document.getElementById('dualTruckSpacing1Input').value);
	let factor = Number(document.getElementById('dualTruckFactorInput').value);
	
	let firstTruckAxle1 = new GlobalLoad(0, -8*factor);
	let firstTruckAxle2 = new GlobalLoad(-14, -32*factor);
	let firstTruckAxle3 = new GlobalLoad(-28, -32*factor);
	
	let secondTruckAxle1 = new GlobalLoad(firstTruckAxle3.coord - rearAxleSpacing, -8*factor);
	let secondTruckAxle2 = new GlobalLoad(secondTruckAxle1.coord - 14, -32*factor);
	let secondTruckAxle3 = new GlobalLoad(secondTruckAxle2.coord - 14, -32*factor);
	
	[firstTruckAxle1, firstTruckAxle2, firstTruckAxle3, secondTruckAxle1, secondTruckAxle2, secondTruckAxle3].forEach(axle => structure.addGlobalLoad(axle));
	structureView.redraw();
}

function changeDualTruckSpacing () {
	let newRearAxleSpacing = Number(document.getElementById('dualTruckSpacing1Input').value);
	
	let firstTruckAxle3 = structure.globalLoads[2];
	let secondTruckAxle1 = structure.globalLoads[3];
	let secondTruckAxle2 = structure.globalLoads[4];
	let secondTruckAxle3 = structure.globalLoads[5];
	
	secondTruckAxle1.setCoord(firstTruckAxle3.coord - newRearAxleSpacing);
	secondTruckAxle2.setCoord(secondTruckAxle1.coord - 14);
	secondTruckAxle3.setCoord(secondTruckAxle2.coord - 14);
	
	structure.solve();
	structureView.redraw();
	updateCharts();
}

function resetLoadsCanvasAndCharts () {
	clearMovingLoadIntervals();
	structure.removeAllLoads();
	structure.solve(); // results will be 0 but this is so the moment and shear charts have coordinates
	structureView.redraw();
	resetCharts();
	if (paused) {togglePause()}
}


// <!-- Initial Chart Coords.. empty arrays for now -->

const momentCoordinates = [];   
const shearCoordinates = [];
const deflectionCoordinates = [];


// <!-- Deflection Chart -->

const deflectionData = {
	datasets: [{
		label: 'Deflection',
		data: deflectionCoordinates, 
		backgroundColor: 'rgb(255,99, 132)',
		showLine: true
	}]
};

const deflectionConfig = {
	type: 'scatter',
	data: deflectionData,
	options: {
		scales: {
			x: {
				type: 'linear', 
				position: 'bottom',
				title: {
					display: true,
					text: 'Distance [ft]'
				}
			},
			y: {
				title: {
					display: true,
					text: 'Deflection [ft]'
				}
			}
		},
		animation: false,
		plugins: {
			legend: {display: false}
		}
	}
};

const deflectionChart = new Chart(
	document.getElementById('deflectionChart'),
	deflectionConfig
);

// <!-- Moment Chart -->

const momentData = {
	datasets: [{
		label: 'Moment',
		data: momentCoordinates, 
		backgroundColor: 'rgb(0, 206, 209)',
		showLine: true
	}]
};

const momentConfig = {
	type: 'scatter',
	data: momentData,
	options: {
		scales: {
			x: {
				type: 'linear', 
				position: 'bottom', 
				title: {
					display: true,
					text: 'Distance [ft]'
				}
			},
			y: {
				title: {
					display: true, 
					text: 'Moment [kip*ft]'
				}
			}
		},
		animation: false,
		plugins: {
			legend: {display: false}
		}
	}
};

const momentChart = new Chart(
	document.getElementById('momentChart'),
	momentConfig
);


// <!-- Shear Chart -->

const shearData = {
	datasets: [{
		label: 'Shear',
		data: shearCoordinates, 
		backgroundColor: 'rgb(75, 192, 192)',
		showLine: true
	}]
};

const shearConfig = {
	type: 'scatter',
	data: shearData,
	options: {
		scales: {
			x: {
				type: 'linear', 
				position: 'bottom',
				title: { 
					display: true,
					text: 'Distance [ft]'
				} 
			},
			y: {
				title: {
					display: true,
					text: 'Shear [kip]'
				}
			}
		},
		animation: false,
		plugins: {
			legend: {display: false}
		}
	}
};

const shearChart = new Chart(
	document.getElementById('shearChart'),
	shearConfig
);


// <!-- Chart Functions -->

let yMinDeflection = -1;  // variables used later on for chart updating.. this is for retaining the max/min y coordinates on the charts during moving loads
let yMaxDeflection = 1;
let yMinMoment = -1;
let yMaxMoment = 1;
let yMinShear = -1;
let yMaxShear = 1;

function updateCharts() {	// this function is very messy.  There probably is a cleaner way to assemble the chart coordinations.. Consider doing this in the Structure class
	while ( momentCoordinates.length > 2*structure.nodes.length - 2) {momentCoordinates.pop()}  // remove any extra coordinates at load locations from previous iterations
	while ( shearCoordinates.length > 2*structure.nodes.length - 2) {shearCoordinates.pop()}

	let coord_array_idx = 0;
	structure.members.forEach (member => {
		deflectionCoordinates[coord_array_idx] = {x: member.nearNode.coord, y: member.nearNode.yDOF.displacement};
		deflectionCoordinates[coord_array_idx + 1] = {x: member.farNode.coord, y: member.farNode.yDOF.displacement};
		
		momentCoordinates[coord_array_idx] = {x: member.nearNode.coord, y: -1 * member.beginMoment};
		momentCoordinates[coord_array_idx + 1] = {x: member.farNode.coord, y: member.endMoment};
		
		shearCoordinates[coord_array_idx] = {x: member.nearNode.coord, y: member.beginShear};
		shearCoordinates[coord_array_idx + 1] = {x: member.farNode.coord, y: -1*member.endShear};
		
		coord_array_idx += 2;
	});
	
	// Previous loop only adds coordinates at the node locations.  Now add the coordinates for the exact load locations between nodes:
	// Each member will have at most 2 concentrated loads on it a one time (from the tightly spaced tandem).. so account for the possibility of either 1 or 2 concentrated loads within a member
	// In the future, the program should account for any number of concentrated loads on a single member
	structure.members.forEach (member => {
		let memberLoads = [];
		structure.globalLoads.forEach(load => {
			if (load.coord > member.nearNode.coord && load.coord < member.farNode.coord) {memberLoads.push(load)} 
		});
		memberLoads.sort( (a, b) => {return a.coord - b.coord} );  // order the loads so that the left-most load is first
		
		if (memberLoads.length === 1 || memberLoads.length === 2) {
			let load1 = memberLoads[0];
			let x1 = load1.coord - member.nearNode.coord; 
			let momentBeforeLoad1 = -1*member.beginMoment + member.beginShear * x1; 
			momentCoordinates[coord_array_idx] = {x: load1.coord, y: momentBeforeLoad1};
			momentCoordinates[coord_array_idx + 1] = {x: load1.coord, y: momentBeforeLoad1};  //same coordinate as previous, but need this to keep moment coord array same size as shear coord array
			
			let shearBeforeLoad1 = member.beginShear; 
			shearCoordinates[coord_array_idx] = {x: load1.coord, y: shearBeforeLoad1};
			let shearAfterLoad1 = shearBeforeLoad1 + load1.magnitude; 
			shearCoordinates[coord_array_idx + 1] = {x: load1.coord, y: shearAfterLoad1};
			
			coord_array_idx += 2;
			
			if (memberLoads.length === 2) {
				let load2 = memberLoads[1];
				let x2 = load2.coord - member.nearNode.coord;
				let momentBeforeLoad2 = -1*member.beginMoment + (member.beginShear * x2) + (load1.magnitude * (x2 - x1));
				momentCoordinates[coord_array_idx] = {x: load2.coord, y: momentBeforeLoad2};
				momentCoordinates[coord_array_idx + 1] = {x: load2.coord, y: momentBeforeLoad2};
				
				let shearBeforeLoad2 = shearAfterLoad1; 
				shearCoordinates[coord_array_idx] = {x: load2.coord, y: shearBeforeLoad2}; 
				let shearAfterLoad2 = shearBeforeLoad2 + load2.magnitude;
				shearCoordinates[coord_array_idx + 1] = {x: load2.coord, y: shearAfterLoad2};
				
				coord_array_idx += 2;
			}
		}
	});
	
	//update max and min y coordinates for each graph
	let deflectionYCoords = deflectionCoordinates.map(coord => coord['y']);
	if ( math.max(deflectionYCoords) > yMaxDeflection) { yMaxDeflection = math.round( math.max(deflectionYCoords)*100/100 ) } //round to avoid floating point precision in JS
	if ( math.min(deflectionYCoords) < yMinDeflection) { yMinDeflection = math.round( math.min(deflectionYCoords)*100/100 ) }
	deflectionChart.options.scales.y.min = yMinDeflection;
	deflectionChart.options.scales.y.max = yMaxDeflection;
	
	let momentYCoords = momentCoordinates.map(coord => coord['y']);
	if ( math.max(momentYCoords) > yMaxMoment) { yMaxMoment = math.round( math.max(momentYCoords)*100/100 ) }
	if ( math.min(momentYCoords) < yMinMoment) { yMinMoment = math.round( math.min(momentYCoords)*100/100 ) }
	momentChart.options.scales.y.min = yMinMoment;
	momentChart.options.scales.y.max = yMaxMoment;
	
	let shearYCoords = shearCoordinates.map(coord => coord['y']);
	if (math.max(shearYCoords) > yMaxShear) { yMaxShear = math.round( math.max(shearYCoords)*100/100 ) }
	if (math.min(shearYCoords) < yMinShear) { yMinShear = math.round( math.min(shearYCoords)*100/100 ) }
	shearChart.options.scales.y.min = yMinShear;
	shearChart.options.scales.y.max = yMaxShear;
	
	// sort to get loaded points in correct position
	momentCoordinates.sort( (a, b) => {return a['x'] - b['x']} );  
	shearCoordinates.sort( (a, b) => {return a['x'] - b['x']} );
	
	
	deflectionChart.update();
	momentChart.update();
	shearChart.update();
}

function resetCharts() {
	while (deflectionCoordinates.length > 0) {deflectionCoordinates.pop()}
	while (momentCoordinates.length > 0) {momentCoordinates.pop()}
	while (shearCoordinates.length > 0) {shearCoordinates.pop()}
	
	yMinDeflection = -1;  
	yMaxDeflection = 1;
	yMinMoment = -1;
	yMaxMoment = 1;
	yMinShear = -1;
	yMaxShear = 1;
	
	updateCharts();
}


// <!-- Moving Loads Functions -->

let animationDelay = 100; // milliseconds
let paused = false;
let movingLoadIntervals = []; // container to keep intervals so that they can be cleared later on

function clearMovingLoadIntervals () {
	movingLoadIntervals.forEach( interval => clearInterval(interval) );
	movingLoadIntervals = [];
}

function runHL93Truck() {
	let axle1 = new GlobalLoad(0, -8);
	let axle2 = new GlobalLoad(-14, -32);
	let axle3 = new GlobalLoad(-28, -32);
	[axle1, axle2, axle3].forEach(axle => structure.addGlobalLoad(axle));
	
	let fixedRearAxle = undefined;
	let rearAxleInterval = undefined;
	
	if (document.getElementById("hl93RearAxleSpacing14").checked) {
		fixedRearAxle = true;
		axle3.setCoord(axle2.coord - 14);
	} else if (document.getElementById("hl93RearAxleSpacing30").checked) {
		fixedRearAxle = true;
		axle3.setCoord(axle2.coord - 30);
	} else if (document.getElementById("hl93RearAxleSpacing4").checked) {
		fixedRearAxle = false;
		rearAxleInterval = 4;
	} else if (document.getElementById("hl93RearAxleSpacing8").checked) {
		fixedRearAxle = false;
		rearAxleInterval = 8;
	} else if (document.getElementById("hl93RearAxleSpacing16").checked) {
		fixedRearAxle = false;
		rearAxleInterval = 16;
	}
	
	let hl93Interval = setInterval(function () {
		if (!paused) {
			if (fixedRearAxle) {
				structure.stepLoads(stepDistance);
			} else {
				if (axle2.coord - axle3.coord < 30 && axle3.coord > 0) {
					axle3.setCoord(axle3.coord - rearAxleInterval);
				} else {
					axle3.setCoord(axle2.coord - 14);
					structure.stepLoads(stepDistance);
				}
			}
			
			structure.solve();
			structureView.redraw();
			updateCharts();
			
			if (axle3.coord > structure.length) { clearMovingLoadIntervals() }											
		}
	}, animationDelay);
	
	movingLoadIntervals.push(hl93Interval);
}

function runHL93Tandem() {
	createHl93TandemLoad();
	let lastAxle = structure.globalLoads.reduce( (previous, current) => (previous.coord < current.coord ? previous : current));
	
	let tandemInterval = setInterval(function() {
		if (!paused) {
			stepForward();
			if (lastAxle.coord > structure.length) { clearMovingLoadIntervals() }
		}
	}, animationDelay);
	
	movingLoadIntervals.push(tandemInterval);
}

function runConcentratedLoad () {
	createConcentratedLoad();
	let load = structure.globalLoads[0]; // only 1 load
	
	let unitLoadInterval = setInterval(function() {
		if (!paused) {
			stepForward();
			if (load.coord > structure.length) { clearMovingLoadIntervals() }
		}
		
	}, animationDelay);
	
	movingLoadIntervals.push(unitLoadInterval);
}

function runDualTrucks() {
	createDualTrucks();
	let lastAxle = structure.globalLoads.reduce( (previous, current) => (previous.coord < current.coord ? previous : current));
	
	let dualTruckInterval = setInterval(function() {
		if (!paused) {
			stepForward();
			if (lastAxle.coord > structure.length) { clearMovingLoadIntervals() }
		}
	}, animationDelay);
	
	movingLoadIntervals.push(dualTruckInterval);
}

function run() {
	resetLoadsCanvasAndCharts();
	if (paused) {togglePause()}
	
	if (document.getElementById('hl93-truck-tab-pane').classList.contains('active') ) {
		runHL93Truck();
	} else if (document.getElementById('hl93-tandem-tab-pane').classList.contains('active') ) {
		runHL93Tandem();
	} else if (document.getElementById('dual-truck-tab-pane').classList.contains('active') ) {
		runDualTrucks();
	} else if (document.getElementById('con-load-tab-pane').classList.contains('active') ) {
		runConcentratedLoad();
	}
}

function stepForward () {
	structure.stepLoads(stepDistance);
	structure.solve();
	structureView.redraw();
	updateCharts();
}

function stepBack() {
	structure.stepLoads(-1*stepDistance);
	structure.solve();
	structureView.redraw();
	updateCharts();
}

function togglePause() {
	paused = !paused;
	let buttonEl = document.getElementById("pauseButton");
	buttonEl.textContent = paused ? "Unpause" : "Pause";
}


createHl93TruckLoad(); // after the structure, charts, and everything else is constructed, redraw the canvas with the HL93, just for visual purposes