const cardDisplayTime = 3000;

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
			$("#computer-card-text").removeClass(c);
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
	setTimeout(endCardAnimation, 2000);
}

function endCardAnimation() {
	$(".computer-card").removeClass("animated-card");
}
