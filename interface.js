const minCardDisplayDuration = 500;
const maxCardDisplayDuration = 3000;
const animationDuration = 1500;
const playerCardDuration = 300;
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
	setTimeout(lowerPlayerCard, animationDuration - playerCardDuration);
}

function endCardAnimation() {
	$(".computer-card").removeClass("animated-card");
	animating = false;
}

function lowerPlayerCard() {
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

$("document").ready(() => {
	$("body").click((e) => {
		if (waitingThread && disabled && animating && !training) {
			console.log("skipping");
			clearTimeout(waitingThread);
			startCardAnimation();
		}
	});
});
