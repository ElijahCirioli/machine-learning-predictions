const minCardDisplayDuration = 500;
const maxCardDisplayDuration = 2500;
const reducedCardDisplayDuration = 1000;
const animationDuration = 1500;
let animating = false;
let disabled = false;
let reducedAnimations = false;
let waitingThread, eyeMoveThread, eyeReturnThread;

const outputDisplays = {
	2: {
		inputs: ["A", "B"],
		outputs: ["A", "B"],
		classes: ["red-text", "blue-text"],
		images: false,
	},
	3: {
		inputs: ["Scissors", "Rock", "Paper"],
		outputs: ["Rock", "Paper", "Scissors"],
		classes: ["rock-image", "paper-image", "scissors-image"],
		images: true,
	},
	10: {
		inputs: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
		outputs: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
		classes: [
			"red-text",
			"blue-text",
			"green-text",
			"orange-text",
			"purple-text",
			"red-text",
			"blue-text",
			"green-text",
			"orange-text",
			"purple-text",
		],
		images: false,
	},
};

let score = 0;
let roundNumber = 0;
let winStreak = 0;
let numCorrect = 0;

function clickCard(id) {
	const buttonLookup = {
		aCard: [1, 0],
		bCard: [0, 1],
		rockCard: [0, 1, 0],
		paperCard: [0, 0, 1],
		scissorsCard: [1, 0, 0],
	};
	for (let i = 0; i < 10; i++) {
		const cardName = i + "Card";
		buttonLookup[cardName] = [];
		for (let j = 0; j < 10; j++) {
			buttonLookup[cardName].push(i === j ? 1 : 0);
		}
	}

	disableButtons();
	if (id in buttonLookup) {
		chooseButton(buttonLookup[id]);
	}
}

function displayComputerCard(index) {
	const params = outputDisplays[possibleInputs];
	if (params.images) {
		for (const c in params.classes) {
			$("#computer-card-image").removeClass(params.classes[c]);
		}
		$("#computer-card-image").addClass(params.classes[index]);
		$("#computer-card-image").show();
		$("#computer-card-text").hide();
	} else {
		$("#computer-card-text").text(params.outputs[index]);
		for (const c in params.classes) {
			$("#computer-card-text").removeClass(params.classes[c]);
		}
		$("#computer-card-text").addClass(params.classes[index]);
		$("#computer-card-image").hide();
		$("#computer-card-text").show();
	}

	$(".flip-card").addClass("active-flipped");
	animating = true;
	setTimeout(allowAnimationSkip, minCardDisplayDuration);
}

function displayPlayerCards() {
	const allPossibleInputs = ["two", "three", "ten"];
	const classLookup = { 2: "two", 3: "three", 10: "ten" };

	for (const n of allPossibleInputs) {
		$(`.${n}-card`).hide();
	}
	$(`.${classLookup[possibleInputs]}-card`).show();
}

function allowAnimationSkip() {
	const waitDuration = reducedAnimations ? reducedCardDisplayDuration : maxCardDisplayDuration - minCardDisplayDuration;
	waitingThread = setTimeout(startCardAnimation, waitDuration);
}

function startCardAnimation() {
	waitingThread = undefined;
	$(".flip-card").removeClass("active-flipped");
	if (reducedAnimations) {
		endCardAnimation();
	} else {
		$(".computer-card").addClass("animated-card");
		setTimeout(endCardAnimation, animationDuration);
	}
}

function endCardAnimation() {
	$(".computer-card").removeClass("animated-card");
	animating = false;
	if (!training && disabled) {
		enableButtons();
	}
}

function disableButtons() {
	disabled = true;
	$(".player-card").removeClass("clickable-card");
}

function enableButtons() {
	disabled = false;
	$(".player-card").addClass("clickable-card");
	$(".player-card").removeClass("selected-card");
	$(".player-card").removeClass("unselected-card");
}

function setupButtonActions() {
	$(".clickable-card").click((e) => {
		if (disabled) {
			return;
		}
		clickCard(e.currentTarget.id);
		$(e.currentTarget).addClass("selected-card");
		$(".player-card").not(e.currentTarget).addClass("unselected-card");
	});

	$("#2-mode-button").click((e) => {
		if (!disabled) {
			$(".mode-button").removeClass("active-mode");
			$("#2-mode-button").addClass("active-mode");
			setupGame(2);
		}
	});

	$("#3-mode-button").click((e) => {
		if (!disabled) {
			$(".mode-button").removeClass("active-mode");
			$("#3-mode-button").addClass("active-mode");
			setupGame(3);
		}
	});

	$("#10-mode-button").click((e) => {
		if (!disabled) {
			$(".mode-button").removeClass("active-mode");
			$("#10-mode-button").addClass("active-mode");
			setupGame(10);
		}
	});

	$("#checkbox").click((e) => {
		reducedAnimations = $("#checkbox").is(":checked");
	});
}

function setupScore() {
	roundNumber = 0;
	score = 0;
	winStreak = 0;
	numCorrect = 0;
	updateScore(0);
	$("#previous-you-text").text("");
	$("#previous-computer-text").text("");
}

function updateScore(delta) {
	score += delta;
	roundNumber++;

	$("#score-text").text(score);
	$("#round-text").text(`Round ${roundNumber}`);
}

function updatePreviousRoundDisplay(playerIndex, computerIndex) {
	const params = outputDisplays[possibleInputs];
	$("#previous-you-text").text(`You: ${params.inputs[playerIndex]}`);
	$("#previous-computer-text").text(`Pyotr: ${params.outputs[computerIndex]}`);
}

function updateFacialExpression(correctPrediction) {
	if (correctPrediction) {
		winStreak = winStreak >= 0 ? winStreak + 1 : 0;
	} else {
		winStreak = winStreak <= 0 ? winStreak - 1 : 0;
	}

	let face = 4;
	if (winStreak <= -5) {
		face = 0;
	} else if (winStreak <= -2) {
		face = 1;
	} else if (winStreak <= 2) {
		face = 2;
	} else if (winStreak <= 5) {
		face = 3;
	}

	$(".pyotr-face").hide();
	$(`#face-${face}`).show();
}

function animateEyes() {
	const eyeHoldTime = 1500;
	const maxTimeToNextAnimation = 10000;
	const minTimeToNextAnimation = 1000;

	const width = $("#pyotr").width();
	const maxOffsetX = (9 * width) / 200;
	const maxOffsetY = (9 * width) / 200;
	const offsetX = Math.floor(Math.random() * (2 * maxOffsetX + 1)) - maxOffsetX;
	const offsetY = Math.floor(Math.random() * (2 * maxOffsetY + 1)) - maxOffsetY;

	// I originally did this with jquery .animate() but the performance wasn't great
	$("#pyotr-eyes-wrap").css("transform", `translate(${offsetX}px, ${offsetY}px)`);

	clearTimeout(eyeReturnThread);
	eyeReturnThread = setTimeout(() => {
		$("#pyotr-eyes-wrap").css("transform", "translate(0, 0)");

		const timeToNextAnimation = Math.floor(Math.random() * (maxTimeToNextAnimation - minTimeToNextAnimation)) + minTimeToNextAnimation;
		clearTimeout(eyeMoveThread);
		eyeMoveThread = setTimeout(animateEyes, timeToNextAnimation);
	}, eyeHoldTime);
}

$("document").ready(() => {
	$("body").click((e) => {
		if (waitingThread && disabled && animating && !training && !reducedAnimations) {
			clearTimeout(waitingThread);
			startCardAnimation();
		}
	});

	// start eye animation cycle
	eyeMoveThread = setTimeout(animateEyes, 5000);
});
