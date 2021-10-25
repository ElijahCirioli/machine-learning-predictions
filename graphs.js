let scoreGraph, confidenceGraph, accuracyGraph;

class Graph {
	constructor(id, title, labelY) {
		this.id = id;
		this.title = title;
		this.width = 380;
		this.height = 200;
		this.offsetX = 40;
		this.offsetY = 5;
		this.minY = 0;
		this.maxY = 0;
		this.baselineY = 0;
		this.labelX = "Time";
		this.labelY = labelY;
		this.values = [];
		this.lineColor = "#58d638";
		this.drawLabels = false;
		this.createElement();
		this.addAxisLabels();
		this.canvas = $(`#${this.id}`).children("canvas");
		this.context = this.canvas[0].getContext("2d");
	}

	createElement() {
		$(`#${this.id}`).remove();
		$("#graphs-wrap").append(
			`<div class="graph" id="${this.id}">
                <p class="graph-title">${this.title}</p>
                <canvas width=${this.width} height=${this.height} class="graph-canvas"></canvas>
            </div>`
		);
	}

	addAxisLabels() {
		$(`#${this.id}`).append(`<p class="graph-axis-label graph-x-label">${this.labelX}</p>`);
		$(`#${this.id}`).append(`<p class="graph-axis-label graph-y-label">${this.labelY}</p>`);
	}

	getScaledX(x) {
		return (x * (this.width - 2 * this.offsetX)) / this.values.length + this.offsetX;
	}

	getScaledY(y) {
		return ((this.maxY - y) * (this.height - this.offsetY)) / (this.maxY - this.minY) + this.offsetY;
	}

	draw() {
		this.context.clearRect(0, 0, this.width, this.height);
		if (this.baselineY !== undefined) {
			this.drawBaselineY();
		}
		if (this.values.length > 0) {
			this.plotValues();
		}
		this.drawAxisX();
		this.drawAxisY();
		if (this.drawLabels) {
			this.drawAllLabels();
		}
	}

	drawAllLabels() {
		console.log("drawing labels");
		this.context.fillStyle = "#e3e3e3";
		this.context.font = "12px 'Roboto Mono', monospace";
		this.context.textAlign = "right";
		this.context.fillText(this.getLabelText(this.maxY), this.offsetX - 6, this.getScaledY(this.maxY) + 10);
		this.context.fillText(this.getLabelText(this.minY), this.offsetX - 6, this.getScaledY(this.minY) - 3);
		if (this.baselineY !== undefined) {
			this.context.fillText(this.getLabelText(this.baselineY), this.offsetX - 6, this.getScaledY(this.baselineY) + 4);
		}
		this.context.textAlign = "left";
		const mostRecentVal = this.values[this.values.length - 1];
		let mostRecentScaled = this.getScaledY(mostRecentVal) + 4;
		if (mostRecentScaled > this.height - 5) {
			mostRecentScaled = this.height - 5;
		}
		this.context.fillText(this.getLabelText(mostRecentVal), this.width - this.offsetX + 5, mostRecentScaled);
	}

	getLabelText(val) {
		return val + "";
	}

	drawAxisX() {
		this.context.strokeStyle = "white";
		this.context.lineWidth = 2;
		this.context.beginPath();
		this.context.moveTo(this.offsetX, this.height - 1);
		this.context.lineTo(this.width - this.offsetX, this.height - 1);
		this.context.stroke();
	}

	drawAxisY() {
		this.context.strokeStyle = "white";
		this.context.lineWidth = 2;
		this.context.beginPath();
		this.context.moveTo(this.offsetX, this.offsetY);
		this.context.lineTo(this.offsetX, this.height);
		this.context.stroke();
	}

	drawBaselineY() {
		const y = this.getScaledY(this.baselineY);
		this.context.strokeStyle = "#9e9e9e";
		this.context.lineWidth = 2;
		this.context.setLineDash([5, 5]);
		this.context.beginPath();
		this.context.moveTo(this.offsetX, y);
		this.context.lineTo(this.width - this.offsetX, y);
		this.context.stroke();
		this.context.setLineDash([]);
	}

	plotValues() {
		this.context.strokeStyle = this.lineColor;
		this.context.lineWidth = 3;
		this.context.beginPath();
		this.context.moveTo(this.getScaledX(0), this.getScaledY(0));
		for (let x = 0; x < this.values.length; x++) {
			const pixelX = this.getScaledX(x + 1);
			const pixelY = this.getScaledY(this.values[x]);
			this.context.lineTo(pixelX, pixelY);
		}
		this.context.stroke();
	}

	addValue(val) {
		this.values.push(val);
		this.draw();
	}
}

class ScoreTimeGraph extends Graph {
	constructor() {
		super("score-time-graph", "Score vs Time", "Score");
		this.baselineY = 0;
		this.minY = -2;
		this.maxY = 2;
		this.drawLabels = true;
		this.values.push(0);
		this.draw();
	}

	draw() {
		const maxY = Math.max(...this.values);
		const minY = Math.min(...this.values);
		if (this.maxY <= maxY) {
			this.maxY = maxY + 1;
		}
		if (this.minY >= minY) {
			this.minY = minY - 1;
		}
		super.draw();
	}
}

class ConfidenceTimeGraph extends Graph {
	constructor() {
		super("confidence-time-graph", "Confidence vs Time", "Confidence");
		this.baselineY = undefined;
		this.minY = 0;
		this.maxY = 1;
		this.drawLabels = true;
		this.draw();
	}

	getLabelText(value) {
		return Math.round(100 * value) + "%";
	}
}

class AccuracyTimeGraph extends Graph {
	constructor() {
		super("accuracy-time-graph", "Total Accuracy vs Time", "Accuracy");
		this.baselineY = undefined;
		this.minY = 0;
		this.maxY = 1;
		this.drawLabels = true;
		this.draw();
	}

	getLabelText(value) {
		return Math.round(100 * value) + "%";
	}
}

function updateGraphs(confidence, correct) {
	scoreGraph.addValue(score);
	confidenceGraph.addValue(confidence);
	if (correct) {
		numCorrect++;
	}
	console.log(numCorrect / (roundNumber - 1));
	accuracyGraph.addValue(numCorrect / (roundNumber - 1));
}
