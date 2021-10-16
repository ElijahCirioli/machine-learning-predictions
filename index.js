let userMemory = [];
let computerMemory = [];
const memoryDepth = 10;
const possibleInputs = 2;
const rewardMagnitude = 100;
const epochs = 5;
const confidenceThreshold = 0.1;
let model;
let score = 0;
let disabled = false;

async function chooseButton(button, letter) {
	disableButtons();

	const inputTensor = constructMemoryTensor();
	console.log("INPUT:");
	inputTensor.print();
	const prediction = await model.predict(inputTensor).dataSync();
	console.log("PREDICTION:");
	console.log(prediction);
	const predictionIndex = getPredictionIndex(prediction);

	let reward = 0;

	const possibleOutputs = ["A", "B"];
	const predictionOutput = possibleOutputs[predictionIndex];

	if (predictionOutput === letter) {
		score--;
		reward = rewardMagnitude;
	} else {
		score++;
		reward = -rewardMagnitude;
	}

	$("#score-text").text(`Score: ${score}`);
	$("#prediction-text").text(`Computer: ${predictionOutput} | You: ${letter}`);
	$("#confidence-text").text(`Computer was ${Math.round(prediction[predictionIndex] * 100)}% confident in that prediction`);

	// add to user memory
	userMemory.unshift(button);
	if (userMemory.length > memoryDepth) {
		userMemory.splice(memoryDepth);
	}

	// add to computer memory
	computerMemory.unshift(getComputerOneHot(predictionIndex));
	if (computerMemory.length > memoryDepth) {
		computerMemory.splice(memoryDepth);
	}

	await trainModel(inputTensor, prediction, predictionIndex, reward);

	enableButtons();
}

function adjustScore() {
	// TODO: move stuff in here
}

function constructMemoryTensor() {
	const combinedArray = [];
	for (let i = 0; i < memoryDepth; i++) {
		for (let j = 0; j < possibleInputs; j++) {
			combinedArray.push(userMemory[i][j]);
			combinedArray.push(computerMemory[i][j]);
		}
	}

	return tf.tensor3d(combinedArray, [1, memoryDepth, possibleInputs * 2]);
}

function getPredictionIndex(prediction) {
	let maxIndex = 0;
	for (let i = 1; i < prediction.length; i++) {
		if (prediction[i] > prediction[maxIndex]) {
			maxIndex = i;
		}
	}
	const sortedPrediction = prediction.slice().sort().reverse();
	// this absolute value isn't really necessary but let's be safe
	const maxDiff = Math.abs(sortedPrediction[0] - sortedPrediction[1]);
	console.log("diff: " + maxDiff);
	if (maxDiff < confidenceThreshold) {
		console.log("Making a guess");
		return Math.floor(Math.random() * prediction.length);
	}
	return maxIndex;
}

function getComputerOneHot(index) {
	const result = [];
	for (let i = 0; i < possibleInputs; i++) {
		result.push(i == index ? 1 : 0);
	}
	return result;
}

async function trainModel(inputTensor, prediction, predictionIndex, reward) {
	// backpropagate the prediction
	for (let i = 0; i < possibleInputs; i++) {
		if (i == predictionIndex) {
			prediction[i] += reward;
		}
	}

	console.log("xs:");
	inputTensor.print();
	const updatedPredictionTensor = tf.tensor2d(prediction, [1, 2]);
	console.log("ys:");
	updatedPredictionTensor.print();
	await model.fit(inputTensor, updatedPredictionTensor, {
		batchSize: 1,
		epochs,
		shuffle: false,
	});
}

function setupModel() {
	// fill the memory arrays with 0s
	while (userMemory.length < memoryDepth) {
		userMemory.push([0, 0]);
	}
	while (computerMemory.length < memoryDepth) {
		computerMemory.push([0, 0]);
	}

	// Create a sequential model
	model = tf.sequential({
		layers: [
			tf.layers.dense({ inputShape: [memoryDepth, possibleInputs * 2], units: possibleInputs * 4, activation: "relu" }),
			tf.layers.dense({ units: 10 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 20 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 10 * possibleInputs, activation: "relu" }),
			tf.layers.flatten(),
			tf.layers.dense({ units: possibleInputs, activation: "softmax" }),
		],
	});

	model.compile({
		optimizer: tf.train.adam(),
		loss: tf.losses.meanSquaredError,
		metrics: ["accuracy"],
	});
}

function disableButtons() {
	disabled = true;
	$(".letter-button").addClass("disabled");
}

function enableButtons() {
	disabled = false;
	$(".letter-button").removeClass("disabled");
}

$("#a-button").click(() => {
	if (!disabled) {
		chooseButton([1, 0], "A");
	}
});
$("#b-button").click(() => {
	if (!disabled) {
		chooseButton([0, 1], "B");
	}
});

$("document").ready(() => {
	setupModel();
});
