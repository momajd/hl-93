class StructureView {
	constructor(context, structure) {
		this.context = context;
		this.structure = structure;
		this.spanCounter = 3;
		this.structureHeight = 8;  
		
		this.translateCanvas();
		this.redraw();
	}
	
	scale () {
		return 0.6 * this.context.canvas.width / this.structure.length;
	}
	
	structureWidth () {
		return this.structure.length * this.scale();
	}
	
	translateCanvas () {
		// position the structure in the middle of the canvas
		let canvasWidth = this.context.canvas.width;
		this.xOffset = (canvasWidth - this.structureWidth() ) / 2;  // define instance var since this value will be used to clear canvas
		this.yOffset = 100;   // based on visual preference 
		this.context.translate(this.xOffset, this.yOffset);
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
			let x = support.coord() * this.scale() - 7.5;
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
	
	drawReactions() {
		this.structure.supports.forEach (support => {
			let ctx = this.context;
			let x = support.coord() * this.scale();
			let y = this.structureHeight + 25; // 20 is height that support is drawn
			ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
			ctx.strokeStyle = "rgba(0, 0, 200, 0.5)";
			
			if (support.reaction > 0) { 
				//draw arrow
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x + 6, y + 12);
				ctx.lineTo(x - 6, y + 12);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(x, y + 12);
				ctx.lineTo(x, y + 12 + support.reaction);
				ctx.closePath();
				ctx.stroke();
				
				//text
				ctx.font= '12px sans-serif';
				ctx.fillText( `${math.round(support.reaction*100)/100} k`, x + 6, y + 12);
			} else if (support.reaction < 0) {
				//draw arrow
				ctx.beginPath();
				ctx.moveTo(x, y + 12 - support.reaction);
				ctx.lineTo(x + 6, y - support.reaction);
				ctx.lineTo(x - 6, y - support.reaction);
				ctx.fill();
				
				ctx.beginPath();
				ctx.moveTo(x, y );
				ctx.lineTo(x, y - support.reaction);
				ctx.closePath();
				ctx.stroke();
				
				//text
				ctx.font= '12px sans-serif';
				ctx.fillText( `${math.round(support.reaction*100)/100} k`, x + 6, y + 12);
			}
			
		});
	}
	
	drawDistributedLoads() {
		
	}
	
	drawSpanDimensions() {
		let ctx = this.context;
		ctx.fillStyle = "black";
		ctx.strokeStyle = "black";
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
			ctx.fillText(`Span ${i + 1}`, (x1 + x2)/2 - 25, y + 20);
		}
	}
	
	
	clearCanvas() {
		let canvas = this.context.canvas;
		this.context.clearRect(-this.xOffset, -this.yOffset, canvas.width, canvas.height);
	}
	
	redraw() {
		this.clearCanvas();
		this.drawStructure();
		this.drawSupports();
		this.drawSpanDimensions();
		this.drawReactions();
		this.drawLoads();
		
	}
	
}