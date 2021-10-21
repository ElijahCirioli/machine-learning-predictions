const minCardDisplayDuration = 500;
const maxCardDisplayDuration = 2500;
const animationDuration = 1500;
let animating = false;
let disabled = false;
let waitingThread;

const outputDisplays = {
	2: {
		outputs: ["A", "B"],
		classes: ["red-text", "blue-text"],
	},
};

let score = 0;
let roundNumber = 0;
let winStreak = 0;

function clickCard(id) {
	const buttonLookup = {
		aCard: [1, 0],
		bCard: [0, 1],
	};
	disableButtons();
	if (id in buttonLookup) {
		chooseButton(buttonLookup[id]);
	}
}

function displayComputerCard(index) {
	const params = outputDisplays[possibleInputs];
	$("#computer-card-text").text(params.outputs[index]);
	for (const c in params.classes) {
		$("#computer-card-text").removeClass(params.classes[c]);
	}
	$("#computer-card-text").addClass(params.classes[index]);

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
	$("#previous-you-text").text(`You: ${params.outputs[playerIndex]}`);
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

$("document").ready(() => {
	$("body").click((e) => {
		if (waitingThread && disabled && animating && !training) {
			console.log("skipping");
			clearTimeout(waitingThread);
			startCardAnimation();
		}
	});
});
