const minCardDisplayDuration = 500;
const maxCardDisplayDuration = 2500;
const animationDuration = 1500;
let animating = false;
let disabled = false;
let waitingThread;

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
};

let score = 0;
let roundNumber = 0;
let winStreak = 0;

function clickCard(id) {
	const buttonLookup = {
		aCard: [1, 0],
		bCard: [0, 1],
		rockCard: [0, 1, 0],
		paperCard: [0, 0, 1],
		scissorsCard: [1, 0, 0],
	};
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

function allowAnimationSkip() {
	waitingThread = setTimeout(startCardAnimation, maxCardDisplayDuration - minCardDisplayDuration);
}

function startCardAnimation() {
	waitingThread = undefined;
	$(".flip-card").removeClass("active-flipped");
	$(".computer-card").addClass("animated-card");
	setTimeout(endCardAnimation, animationDuration);
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
		winStreak = winStreak >= 0 ? winStreak + 1 : -1;
	} else {
		winStreak = winStreak <= 0 ? winStreak - 1 : 1;
	}

	let face = 4;
	if (winStreak <= -6) {
		face = 0;
	} else if (winStreak <= -3) {
		face = 1;
	} else if (winStreak <= 3) {
		face = 2;
	} else if (winStreak <= 6) {
		face = 3;
	}

	$(".pyotr-face").hide();
	$(`#face-${face}`).show();
}

$("document").ready(() => {
	$("body").click((e) => {
		if (waitingThread && disabled && animating && !training) {
			console.log("skipping");
			clearTimeout(waitingThread);
			startCardAnimation();
		}
	});
});
