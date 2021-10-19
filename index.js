let userMemory = [];
let computerMemory = [];
const memoryDepth = 15;
const possibleInputs = 2;
const rewardMagnitude = 100;
const epochs = 10;
const confidenceThreshold = 0.1;
let model;
let score = 0;

async function chooseButton(button) {
	const inputTensor = constructMemoryTensor();

	const prediction = await model.predict(inputTensor).dataSync();

	const predictionIndex = getPredictionIndex(prediction);
	const buttonIndex = getButtonIndex(button);

	let reward = 0;

	if (predictionIndex === buttonIndex) {
		score--;
		reward = rewardMagnitude;
	} else {
		score++;
		reward = -rewardMagnitude;
	}

	displayComputerCard(predictionIndex, possibleInputs);

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
	if (maxDiff < confidenceThreshold) {
		return Math.floor(Math.random() * prediction.length);
	}
	return maxIndex;
}

function getButtonIndex(button) {
	for (let i = 0; i < button.length; i++) {
		if (button[i] === 1) {
			return i;
		}
	}
	return -1;
}

function getComputerOneHot(index) {
	const result = [];
	for (let i = 0; i < possibleInputs; i++) {
		result.push(i === index ? 1 : 0);
	}
	return result;
}

async function trainModel(inputTensor, prediction, predictionIndex, reward) {
	// backpropagate the prediction
	for (let i = 0; i < possibleInputs; i++) {
		if (i === predictionIndex) {
			prediction[i] += reward;
		}
	}

	const updatedPredictionTensor = tf.tensor2d(prediction, [1, 2]);
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
			tf.layers.dense({ units: 15 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 30 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 30 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 15 * possibleInputs, activation: "relu" }),
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

$("document").ready(() => {
	setupModel();
});
