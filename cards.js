const cardDisplayTime = 3000;
const animationDuration = 1500;

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
		setTimeout(startCardAnimation, cardDisplayTime);
	} else {
		console.log(`No display parameters set for ${possibleInputs} inputs`);
	}
}

function startCardAnimation() {
	$(".flip-card").removeClass("active-flipped");
	$(".computer-card").addClass("animated-card");
	setTimeout(endCardAnimation, animationDuration);
}

function endCardAnimation() {
	$(".computer-card").removeClass("animated-card");
	enableButtons();
}

$("document").ready(() => {
	enableButtons();
	$(".clickable-card").click((e) => {
		clickCard(e.currentTarget.id);
		$(e.currentTarget).addClass("selected-card");
	});
});

function disableButtons() {
	$(".player-card").removeClass("clickable-card");
}

function enableButtons() {
	$(".player-card").addClass("clickable-card");
	$(".player-card").removeClass("selected-card");
}
