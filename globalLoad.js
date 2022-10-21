class GlobalLoad { 
	constructor(coord, magnitude) {
		this.coord = coord;
		this.magnitude = magnitude;
	}
	
	stepLoad (increment) {
		this.coord = this.coord + increment;	
	}
	
	setCoord (coord) {
		this.coord = coord;
	}
	
}