const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class FalloutAddPerk extends HandlebarsApplicationMixin(ApplicationV2) {

	actor = undefined;

	dragCleanupAttached = false;

	boundResetDragState = this.resetDragState.bind(this);

	actorSheetDropTarget = null;

	constructor(actor, options = {}) {
		super();

		this.actor = actor;
		this.filter = "available";
		this.sort = "alphabetical";
		this.transferPerk = null;
		this.transfering = false;
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		tag: "form",
		window: {
			contentClasses: [
				"standard-form",
				"perkFinder",
			],
			resizable: true,
		},
		position: {
			width: 750,
			height: "auto",
		},
		form: {
			closeOnSubmit: false,
			submitOnChange: true,
			handler: FalloutAddPerk.#onSubmit,
		},
		actions: {
		},
	};


	/** @override */
	static PARTS = {
		perkSelection: {
			template: "systems/fallout/templates/apps/perk-selector/perk-selection.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs",
		},
	};


	get title() {
		return `${game.i18n.localize("FALLOUT.APP.AddPerk.title")}: ${this.actor.name}`;
	}

	async _getPerkSelectionContextData(context) {
		context.availablePerks = await this.actor.perkManager.getAvailablePerks();
		context.allPerks = await this.actor.perkManager.perks;
		context.filter = this.filter;
		context.sort = this.sort;
		return context;
	}


	async _preparePartContext(partId, context) {
		switch (partId) {
			case "perkSelection":
				return this._getPerkSelectionContextData(context);
			default:
				return super._preparePartContext(partId, context);
		}
	}

	_onRender(context, options) {
		// document.addEventListener("drop", async (event, context) => {
		//	event.preventDefault();
		//	const item = await Item.implementation.fromDropData(JSON.parse(event.dataTransfer.getData("text/plain")));
		//	console.log(item);
		//	// Step 1: Traverse up to the closest .app container
		//	const appElement = event.target.closest(".app");

		//	if (!appElement) {
		//		console.warn("Drop did not occur in a recognized .app element");
		//		return;
		//	}

		//	// Step 2: Get the Application (sheet) instance from the DOM element
		//	const appId = appElement.dataset.appid;
		//	const app = ui.windows[appId];

		//	if (!app || !(app instanceof ActorSheet)) {
		//		console.warn("No ActorSheet found for drop");
		//		return;
		//	}

		//	// Step 3: Now you have access to the actor and sheet
		//	const actor = app.actor;
		//	console.log("Drop occurred on Actor:", actor.name);
		// });

		const actorId = this.actor.id;

		// Find the application ID from open windows
		const appId = Object.keys(ui.windows).find(id => {
			const app = ui.windows[id];
			return app.id === `FalloutPcSheet-Actor-${actorId}`;
		});

		const app = ui.windows[appId];

		if (app && app.rendered) {
			const html = app.element;
			html.off("drop.perkSelection");
			this.actorSheetDropTarget = html;

			html.on("drop.perkSelection", async event => {
				event.preventDefault();
				event.stopPropagation();

				const dropData = TextEditor.getDragEventData(event);
				console.debug("[FalloutAddPerk] Drop detected on actor sheet", {
					actorId: this.actor?.id,
					actorName: this.actor?.name,
					transfering: this.transfering,
					transferPerkName: this.transferPerk?.name,
					transferPerkUuid: this.transferPerk?.uuid,
					dropData,
					dropTarget: event.target,
				});

				await this.applyTransferredPerk(dropData);
				this.resetDragState();

			});

		}

		this.attachDragCleanupListeners();

		this.element.querySelectorAll(".perk").forEach(e => {
			e.addEventListener("dragstart", async event => {
				const perkUUID = event.currentTarget.closest("[data-item-id]").dataset.itemId;
				const perkDocument = await fromUuid(perkUUID);

				if (!perkDocument) {
					console.debug("[FalloutAddPerk] Drag start aborted, perk not found", {
						perkUUID,
					});
					return;
				}
				perkDocument.updateSource({ "system.rank.value": 1 });

				console.debug("[FalloutAddPerk] Drag start", {
					perkName: perkDocument.name,
					perkUuid: perkDocument.uuid,
					perkId: perkDocument.id,
					actorId: this.actor?.id,
					actorName: this.actor?.name,
				});

				const dragData = {
					type: "Item",
					uuid: perkDocument.uuid,
				};

				event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
				this.transferPerk = perkDocument;
				this.transfering = true;
				this.setDragging(event);
			});
			e.addEventListener("dragend", event => {
				console.debug("[FalloutAddPerk] Drag end", {
					transfering: this.transfering,
					transferPerkName: this.transferPerk?.name,
					transferPerkUuid: this.transferPerk?.uuid,
				});

				setTimeout(() => {
					this.resetDragState();
				}, 0);

			});

			e.addEventListener("click", async event => {
				const perkUUID = event.currentTarget.closest("[data-item-id]").dataset.itemId;
				const perkDocument = await fromUuid(perkUUID);
				perkDocument.sheet.render(true);
			});
		});

		super._onRender(context, options);
	}

	attachDragCleanupListeners() {
		if (this.dragCleanupAttached) {
			return;
		}

		document.addEventListener("dragend", this.boundResetDragState, true);
		document.addEventListener("drop", this.boundResetDragState, true);
		document.addEventListener("mouseup", this.boundResetDragState, true);
		window.addEventListener("blur", this.boundResetDragState);
		this.dragCleanupAttached = true;
	}

	detachDragCleanupListeners() {
		if (!this.dragCleanupAttached) {
			return;
		}

		document.removeEventListener("dragend", this.boundResetDragState, true);
		document.removeEventListener("drop", this.boundResetDragState, true);
		document.removeEventListener("mouseup", this.boundResetDragState, true);
		window.removeEventListener("blur", this.boundResetDragState);
		this.dragCleanupAttached = false;
	}


	setDragging(event) {
		// this.onDragStart?.(event);
		setTimeout(() => {
			this.element.classList.add("dragging");
		}, 1);
	}

	endDragging(event) {
		// this.onDragEnd?.(event);
		this.element.classList.remove("dragging");
		// document.querySelector("#spotlight").classList.remove("dragging");
	}

	resetDragState() {
		this.transferPerk = null;
		this.transfering = false;
		if (this.element) {
			this.endDragging();
		}
	}

	async applyTransferredPerk(dropData = {}) {
		console.debug("[FalloutAddPerk] applyTransferredPerk called", {
			actorId: this.actor?.id,
			actorName: this.actor?.name,
			transfering: this.transfering,
			transferPerkName: this.transferPerk?.name,
			transferPerkUuid: this.transferPerk?.uuid,
			dropData,
		});

		const transferredPerk = dropData?.uuid
			? await fromUuid(dropData.uuid)
			: this.transferPerk;

		if (!transferredPerk) {
			console.debug("[FalloutAddPerk] No transferred perk found, skipping drop application", {
				dropData,
			});
			return;
		}

		console.debug("[FalloutAddPerk] Resolved dropped perk", {
			perkName: transferredPerk.name,
			perkUuid: transferredPerk.uuid,
			perkType: transferredPerk.type,
		});

		const existingPerk = this.actor.items.find(item =>
			item.type === "perk"
			&& item.name.toLowerCase() === transferredPerk.name.toLowerCase()
		);

		if (existingPerk) {
			const currentRank = existingPerk.system.rank?.value ?? 0;
			const maxRank = existingPerk.system.rank?.max ?? currentRank + 1;
			const newRank = Math.min(currentRank + 1, maxRank);

			if (newRank !== currentRank) {
				console.debug("[FalloutAddPerk] Increasing existing perk rank", {
					actorName: this.actor?.name,
					perkName: existingPerk.name,
					currentRank,
					newRank,
					maxRank,
				});
				await existingPerk.update({ "system.rank.value": newRank });
			}
			else {
				console.debug("[FalloutAddPerk] Existing perk already at max rank", {
					actorName: this.actor?.name,
					perkName: existingPerk.name,
					currentRank,
					maxRank,
				});
			}

			return existingPerk;
		}

		const perkData = transferredPerk.toObject();
		delete perkData._id;
		perkData.system.rank.value = 1;

		console.debug("[FalloutAddPerk] Creating new perk on actor", {
			actorName: this.actor?.name,
			perkName: perkData.name,
			perkType: perkData.type,
			perkRank: perkData.system?.rank?.value,
		});

		const [createdPerk] = await this.actor.createEmbeddedDocuments("Item", [perkData]);
		console.debug("[FalloutAddPerk] Create result", {
			actorName: this.actor?.name,
			createdPerkName: createdPerk?.name,
			createdPerkId: createdPerk?.id,
		});
		return createdPerk;
	}

	async close(options) {
		this.actorSheetDropTarget?.off("drop.perkSelection");
		this.actorSheetDropTarget = null;
		this.detachDragCleanupListeners();
		this.resetDragState();
		return super.close(options);
	}

	async #onChange(event, form, formData) {
		this.filter = formData.object.filter;
		this.sort = formData.object.sort;
		this.render();
	}


	static async #onSubmit(event, form, formData) {
		if (event.type === "change") {
			return this.#onChange(event, form, formData);
		}

		// TODO Implement

		return this.close();
	}

	static async #onClose(event, form, formData) {
		if (event.type === "change") {
			return this.#onChange(event, form, formData);
		}

		// TODO Implement

		return this.close();
	}
}
