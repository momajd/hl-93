class StructureView {
	constructor(context, structure) {
		this.context = context;
		this.structure = structure;
		this.spanCounter = 1;
		
		this.structureHeight = 8;  
		
		this.redraw();
	}
	
	scale () {
		return 0.9 * this.context.canvas.width / this.structure.length;
	}
	
	structureWidth () {
		return this.structure.length * this.scale();
	}
	
	updateSpanCount (numSpans) {
		if (numSpans > 0 && numSpans <= 5) {this.spanCounter = numSpans;}
	}
	
	drawStructure() {		
		this.context.fillStyle = "rgba(0, 0, 200, 0.5)";
		this.context.fillRect(0, 0, this.structureWidth(), this.structureHeight);
	}
	
	drawSupports() {
		this.structure.supports.forEach( support => {
			let x = support.coord() * this.scale() - 10;
			let y = this.structureHeight + 2;
			
			this.context.fillStyle = "grey";
			this.context.fillRect(x, y, 15, 20);
		});
	}
	
	drawLoads() {
		this.structure.globalLoads.forEach( load => {
			let ctx = this.context;
			//draw wheel
			ctx.beginPath();
			let x = load.coord * this.scale();
			let y = -10;
			let radius = 10;
			
			ctx.arc(x, y, radius, 0, 2*Math.PI);
			ctx.fillStyle = "black";
			ctx.fill();
			
			//draw arrow
			ctx.beginPath();
			ctx.moveTo(x, y - radius);
			ctx.lineTo(x + 6, y - radius - 12);
			ctx.lineTo(x - 6, y - radius - 12);
			ctx.fill();
			
			ctx.beginPath();
			ctx.moveTo(x, y - 12 - radius);
			ctx.lineTo(x, y - 12 - radius + load.magnitude);
			ctx.closePath();
			ctx.stroke();
			
			//text
			ctx.font = '12px sans-serif';
			ctx.fillText(`${-1*load.magnitude} k`, x + 2, y - 12 - radius + load.magnitude);
		});
	}
	
	drawSpanDimensions() {
		let ctx = this.context;
		ctx.fillStyle = "black";
		ctx.lineWidth = 0.5;
		
		for (let i = 0; i < structure.supports.length - 1; i++) {
			let nearSupport = structure.supports[i];
			let farSupport = structure.supports[i+1];
			
			// left arrow
			let x1 = nearSupport.coord() * this.scale();
			let y = this.structureHeight + 50;
			
			ctx.beginPath();
			ctx.moveTo( x1, y);
			ctx.lineTo( x1 + 10, y + 3);
			ctx.lineTo( x1 + 10, y - 3);
			ctx.fill();
			
			// right arrow
			let x2 = farSupport.coord() * this.scale();
			
			ctx.beginPath();
			ctx.moveTo( x2, y);
			ctx.lineTo( x2 - 10, y + 3);
			ctx.lineTo( x2 - 10, y - 3);
			ctx.fill(); 
			
			// dim line
			ctx.beginPath();
			ctx.moveTo(x1, y);
			ctx.lineTo(x2, y);
			ctx.closePath();
			ctx.stroke();
			
			// text
			let spanLength = Math.round( (farSupport.coord() - nearSupport.coord() )* 100) / 100;
			ctx.font = '16px sans-serif';
			ctx.fillText(`${spanLength} ft`, (x1 + x2)/2 - 20, y - 5);
		}
	}
	
	animate() {
		//TODO - remove if not needed
	}
	
	clearCanvas() {
		let canvas = this.context.canvas;
		this.context.clearRect(-25, -80, canvas.width, canvas.height);
	}
	
	redraw() {
		this.clearCanvas();
		this.drawStructure();
		this.drawSupports();
		this.drawLoads();
		this.drawSpanDimensions();
	}
	
}