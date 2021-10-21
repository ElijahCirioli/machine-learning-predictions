// neural network constants
const memoryDepth = 10;
const possibleInputs = 2;
const confidenceThreshold = 0.1;
const epochs = 40;

// neural network variables
let userMemory = [];
let computerMemory = [];
let model, prediction;
let training = false;

async function chooseButton(button) {
	if (!prediction) {
		return;
	}

	const predictionIndex = getPredictionIndex(prediction);
	const buttonIndex = getButtonIndex(button);
	const correctPrediction = predictionIndex === buttonIndex;

	training = true;
	displayComputerCard(predictionIndex);
	updatePreviousRoundDisplay(buttonIndex, predictionIndex);
	updateFacialExpression(correctPrediction);

	updateScore(correctPrediction ? -1 : 1);

	let inputTensor = constructMemoryTensor();
	await trainModel(inputTensor, button);

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

	inputTensor = constructMemoryTensor();
	prediction = await model.predict(inputTensor);
	prediction.print();
	prediction = prediction.dataSync();

	training = false;
	if (!animating && disabled) {
		enableButtons();
	}
}

function constructMemoryTensor() {
	const combinedArray = [];
	for (let i = 0; i < memoryDepth; i++) {
		for (let j = 0; j < possibleInputs; j++) {
			combinedArray.push(userMemory[i][j]);
			combinedArray.push(computerMemory[i][j]);
		}
	}

	return tf.tensor3d(combinedArray, [1, memoryDepth, possibleInputs * 2]).reverse([1, 0]);
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
		console.log("guessing");
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

async function trainModel(inputTensor, button) {
	const correctResult = tf.tensor2d(button, [1, possibleInputs]);

	await model.fit(inputTensor, correctResult, {
		batchSize: 1,
		epochs,
		shuffle: false,
	});
}

async function setupModel() {
	disableButtons();

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
			tf.layers.lstm({ inputShape: [memoryDepth, possibleInputs * 2], units: 2 * memoryDepth * possibleInputs, returnSequences: false }),
			tf.layers.dense({ units: 30 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 20 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 10 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: possibleInputs, activation: "softmax" }),
		],
	});

	await model.compile({
		optimizer: tf.train.adam(),
		loss: tf.losses.meanSquaredError,
	});

	const inputTensor = constructMemoryTensor();
	prediction = await model.predict(inputTensor).dataSync();

	enableButtons();
	setupButtonActions();
}

$("document").ready(() => {
	updateScore(0);
	setupModel();
});
