const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class FalloutAddPerk extends HandlebarsApplicationMixin(ApplicationV2) {

	actor = undefined;

	constructor(actor, options={}) {
		super();

		this.actor = actor;
		this.filter = "available";
		this.sort = "alphabetical";
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		tag: "form",
		window: {
			contentClasses: [
				"standard-form",
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
		context.allPerks = await fallout.compendiums.perks();
		context.availablePerks = await this.actor.perkManager.getAvailablePerks();
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


	async #onChange(event, form, formData) {
		// TODO Implement
	}


	static async #onSubmit(event, form, formData) {
		if (event.type === "change") {
			return this.#onChange(event, form, formData);
		}

		// TODO Implement

		return this.close();
	}

}
