// neural network constants
const memoryDepth = 10;
const confidenceThreshold = 0.05;
const epochs = 30;

// neural network variables
let userMemory = [];
let computerMemory = [];
let model, prediction, training, possibleInputs;

async function chooseButton(button) {
	// make sure we're ready to do this
	if (!prediction) {
		return;
	}

	// get the indices for the player and computer choices
	const predictionIndex = getPredictionIndex(prediction);
	const buttonIndex = getButtonIndex(button);
	const correctPrediction = predictionIndex === buttonIndex;

	// indicate that training has begun
	training = true;
	$("#pyotr").addClass("shake");

	// update the interface
	displayComputerCard(predictionIndex);
	updatePreviousRoundDisplay(buttonIndex, predictionIndex);
	updateFacialExpression(correctPrediction);

	// adjust the score
	if (possibleInputs === 3) {
		// rock paper scissors can have ties
		if (correctPrediction) {
			updateScore(-1);
		} else {
			updateScore((buttonIndex + 1) % 3 === predictionIndex ? 1 : 0);
		}
	} else {
		// otherwise the player wins if they chose different things
		updateScore(correctPrediction ? -1 : 1);
	}
	updateGraphs(prediction[predictionIndex], correctPrediction);

	// update neural network stuff
	tf.engine().startScope();

	// train model based on the results of this round
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

	// make the prediction for the next round
	inputTensor = constructMemoryTensor();
	predictionTensor = await model.predict(inputTensor);
	predictionTensor.print();
	prediction = predictionTensor.dataSync();

	tf.engine().endScope();

	// indicate that we're done training
	training = false;
	$("#pyotr").removeClass("shake");
	if (!animating && disabled) {
		enableButtons();
	}
}

// create a tensor from the user and the computer's previous choices
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

// get the index with the highest probability
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
	// if Pyotr isn't that sure then he should just guess
	if (maxDiff < confidenceThreshold) {
		return Math.floor(Math.random() * prediction.length);
	}
	return maxIndex;
}

// get the index of the button that the player chose
function getButtonIndex(button) {
	for (let i = 0; i < button.length; i++) {
		if (button[i] === 1) {
			return i;
		}
	}
	return -1;
}

// create a one hot array from the computer's choice in one round
function getComputerOneHot(index) {
	const result = [];
	for (let i = 0; i < possibleInputs; i++) {
		result.push(i === index ? 1 : 0);
	}
	return result;
}

// train the model based on waht they should have chosen
async function trainModel(inputTensor, button) {
	const correctResult = tf.tensor2d(button, [1, possibleInputs]);

	await model.fit(inputTensor, correctResult, {
		batchSize: 1,
		epochs,
		shuffle: false,
	});
}

async function setupModel() {
	// stop the user from doing stuff while we set this up
	disableButtons();
	training = false;

	tf.engine().startScope();

	// create the model
	model = tf.sequential({
		layers: [
			tf.layers.lstm({ inputShape: [memoryDepth, possibleInputs * 2], units: 2 * memoryDepth * possibleInputs, returnSequences: false }),
			tf.layers.dense({ units: 20 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 20 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: 10 * possibleInputs, activation: "relu" }),
			tf.layers.dense({ units: possibleInputs, activation: "softmax" }),
		],
	});

	// compile it
	await model.compile({
		optimizer: tf.train.adam(),
		loss: tf.losses.meanSquaredError,
	});

	// make the initial prediction
	zeroMemory();
	const inputTensor = constructMemoryTensor();
	prediction = await model.predict(inputTensor).dataSync();

	tf.engine().endScope();

	// enable all the stuff again
	enableButtons();
	setupButtonActions();
}

// zero out the memory so we can start a new round
function zeroMemory() {
	userMemory = [];
	computerMemory = [];

	zeroRound = [];
	for (let i = 0; i < possibleInputs; i++) {
		zeroRound.push(0);
	}
	// fill the memory arrays with 0s
	while (userMemory.length < memoryDepth) {
		userMemory.push(zeroRound);
	}
	while (computerMemory.length < memoryDepth) {
		computerMemory.push(zeroRound);
	}
}

// setup the game in a different mode
function setupGame(mode) {
	possibleInputs = mode;
	displayPlayerCards();
	setupScore();
	//create the graphs
	scoreGraph = new ScoreTimeGraph();
	confidenceGraph = new ConfidenceTimeGraph();
	accuracyGraph = new AccuracyTimeGraph();
	// remove old tensors
	if (model) {
		tf.dispose(model);
		tf.disposeVariables();
	}
	setupModel();
}

$("document").ready(() => {
	setupGame(3);
});
