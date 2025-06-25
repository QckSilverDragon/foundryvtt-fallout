export function diceSoNiceReadyHook(dice3d) {
	fallout.debug("Running diceSoNiceReady hook");

	dice3d.addSystem({ id: "fallout", name: "Fallout 2d20" }, true);

	dice3d.addColorset({
		name: "fallout",
		description: "Fallout 2d20",
		category: "Colors",
		foreground: "#fcef71",
		background: "#008cd1",
		outline: "gray",
		texture: "none",
	});

	dice3d.addDicePreset({
		type: "dc",
		labels: [
			"systems/falloutV12/assets/dice/d1.webp",
			"systems/falloutV12/assets/dice/d2.webp",
			"systems/falloutV12/assets/dice/d3.webp",
			"systems/falloutV12/assets/dice/d4.webp",
			"systems/falloutV12/assets/dice/d5.webp",
			"systems/falloutV12/assets/dice/d6.webp",
		],
		system: "fallout",

	});

	dice3d.addDicePreset({
		type: "dh",
		fontScale: 0.9,
		labels: [
			"systems/falloutV12/assets/dice-locations/head.webp",
			"systems/falloutV12/assets/dice-locations/head.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/body.webp",
			"systems/falloutV12/assets/dice-locations/arm-l.webp",
			"systems/falloutV12/assets/dice-locations/arm-l.webp",
			"systems/falloutV12/assets/dice-locations/arm-l.webp",
			"systems/falloutV12/assets/dice-locations/arm-r.webp",
			"systems/falloutV12/assets/dice-locations/arm-r.webp",
			"systems/falloutV12/assets/dice-locations/arm-r.webp",
			"systems/falloutV12/assets/dice-locations/leg-l.webp",
			"systems/falloutV12/assets/dice-locations/leg-l.webp",
			"systems/falloutV12/assets/dice-locations/leg-l.webp",
			"systems/falloutV12/assets/dice-locations/leg-r.webp",
			"systems/falloutV12/assets/dice-locations/leg-r.webp",
			"systems/falloutV12/assets/dice-locations/leg-r.webp",
		],
		system: "fallout",
		colorset: "fallout",
	});

}
