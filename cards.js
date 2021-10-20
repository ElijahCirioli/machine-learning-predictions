const cardDisplayDuration = 3000;
const animationDuration = 1500;
const playerCardDuration = 300;
let animating = false;
let disabled = false;
let waitingThread;

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

function displayComputerCard(index, possibleInputs) {
	const outputDisplays = {
		2: {
			outputs: ["A", "B"],
			classes: ["red-text", "blue-text"],
		},
	};

	if (possibleInputs in outputDisplays) {
		const params = outputDisplays[possibleInputs];
		$("#computer-card-text").text(params.outputs[index]);
		for (const c in params.classes) {
			$("#computer-card-text").removeClass(params.classes[c]);
		}
		$("#computer-card-text").addClass(params.classes[index]);

		$(".flip-card").addClass("active-flipped");
		animating = true;
		waitingThread = setTimeout(startCardAnimation, cardDisplayDuration);
	} else {
		console.log(`No display parameters set for ${possibleInputs} inputs`);
	}
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

$("document").ready(() => {
	$("body").click((e) => {
		if (waitingThread && disabled && animating && !training) {
			console.log("skipping");
			clearTimeout(waitingThread);
			waitingThread = undefined;
			startCardAnimation();
		}
	});
});
