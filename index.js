let userMemory = [];
let computerMemory = [];
const memoryDepth = 10;
const possibleInputs = 2;
let model;
let score = 0;
let disabled = false;

async function chooseButton(button, letter) {
	const inputTensor = constructMemoryTensor();
	const prediction = await model.predict(inputTensor).dataSync();

	console.log("pred: ", prediction);
	if (prediction[0] > prediction[1]) {
		predictionOutput = "A";
	} else {
		predictionOutput = "B";
	}
	if (predictionOutput === letter) {
		score--;
	} else {
		score++;
	}
	$("#score-text").text(`Score: ${score}`);
	$("#prediction-text").text(`Computer: ${predictionOutput} | You: ${letter}`);

	let buttonArray = [button];
	while (buttonArray.length < memoryDepth) {
		buttonArray.push([0, 0]);
	}
	const buttonTensor = tf.tensor2d(buttonArray, [memoryDepth, 2]);

	disableButtons();

	const batchSize = 64;
	const epochs = 100;
	await model.fit(inputTensor, buttonTensor, {
		batchSize,
		epochs,
	});

	enableButtons();

	// add to user memory
	userMemory.unshift(button);
	if (userMemory.length > memoryDepth) {
		userMemory.splice(memoryDepth);
	}

	// add to computer memory
}

function adjustScore() {}

function constructMemoryTensor() {
	const combinedArray = [];
	for (let i = 0; i < memoryDepth; i++) {
		for (let j = 0; j < possibleInputs; j++) {
			combinedArray.push(userMemory[j]);
			combinedArray.push(computerMemory[j]);
		}
	}

	return tf.tensor2d(combinedArray, [memoryDepth, possibleInputs * 2]);
}

function trainModel() {}

function setupModel() {
	// fill the memory arrays with 0s
	while (userMemory.length < memoryDepth) {
		userMemory.push([0, 0]);
	}
	while (computerMemory.length < memoryDepth) {
		computerMemory.push([0, 0]);
	}

	// Create a sequential model
	model = tf.sequential();

	// Add a single input layer
	model.add(tf.layers.dense({ inputShape: [4], units: memoryDepth, useBias: true }));

	// Add a single hidden layer
	model.add(tf.layers.dense({ units: 5, useBias: true }));

	// Add an output layer
	model.add(tf.layers.dense({ units: 2, useBias: true }));

	model.compile({
		optimizer: tf.train.adam(),
		loss: tf.losses.meanSquaredError,
		metrics: ["mse"],
		layers: [
			tf.layers.dense({ inputShape: [memoryDepth], units: 32, activation: "relu" }),
			tf.layers.dense({ units: 10, activation: "softmax" }),
		],
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
