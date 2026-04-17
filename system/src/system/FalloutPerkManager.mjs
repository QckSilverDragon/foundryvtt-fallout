export default class FalloutPerkManager {
	constructor(actor, options = {}) {
		this.actor = actor;
		this.actorOwnedPerksLut = {};
		this.actorAttributes = [];
		this.actorReadMagazines = [];
		this.perks = [];
	}

	async getAvailablePerks(nextLevel = true) {
		this.actorAttributes = foundry.utils.duplicate(
			this.actor.system.attributes
		);

		this.actorReadMagazines = foundry.utils.duplicate(
			this.actor.system.readMagazines
		);

		await this.getKnownPerks();

		const availablePerks = new Collection();
		this.perks = new Collection();

		const allPerks = await fallout.compendiums.perks();
		for (const perk of allPerks) {
			perk.system.multiRank = perk.system.rank.max > 1;
			perk.system.perkIdentifier = perk.name.slugify();

			// Make sure we meet the requirements
			const meetsRequirements = await this._meetsRequirements(perk, nextLevel);

			let rank = 1;

			if (Object.hasOwn(
				this.actorOwnedPerksLut, perk.system.perkIdentifier
			)) {
				const current = this.actorOwnedPerksLut[
					perk.system.perkIdentifier
				];

				rank = current + 1;
			}

			if (meetsRequirements) {
				availablePerks.set(perk._id, {
					item: perk,
					rank,
					meetsRequirements,
				});
			}

			this.perks.set(perk._id, {
				item: perk,
				rank,
				meetsRequirements,
			});
		}

		return availablePerks;
	}

	async getKnownPerks() {
		this.actorOwnedPerksLut = {};

		for (const item of this.actor.items) {
			if (item.type === "perk") {
				this.actorOwnedPerksLut[item.name.slugify()] = item.system.rank.value;
			}
		}
	}

	async setActorAttributes(attributes) {
		this.actorAttributes = attributes;
	}

	async setActorReadMagazines(readMagazines) {
		this.actorReadMagazines = readMagazines;
	}

	async setKnownPerks(perks) {
		this.actorOwnedPerksLut = {};

		for (const perk of perks) {
			this.actorOwnedPerksLut[perk.identifier] = perk.rank;
		}
	}

	async _meetsRequirements(perk, nextLevel) {
		let requirementsMet = true;

		const requirements = perk.system.requirementsEx;

		// First make sure that if the character already knows the perk that
		// they have not maxed it out
		const knownPerk = this.actorOwnedPerksLut[
			perk.system.perkIdentifier
		];

		if (knownPerk) {
			if (knownPerk >= perk.system.rank.max) {
				requirementsMet = false;
			}
		}

		// Are we the correct level for the next rank of the perk?
		//
		const currentLevel = this.actor.system.level.value;
		const playerLevel = nextLevel ? currentLevel + 1 : currentLevel;

		if (perk.system.multiRank) {
			const nextPerkRank = (knownPerk ?? 0) + 1;

			const startLevel = requirements.level ?? 1;
			const rankLevelStep = requirements.levelIncrease ?? 1;

			const levelRequired = startLevel + ((nextPerkRank - 1) * rankLevelStep);

			if (playerLevel < levelRequired) {
				requirementsMet = false;
			}
		}
		else if (playerLevel < requirements.level ?? 1) {
			requirementsMet = false;
		}


		// Do we meet the attribute requirements?
		//
		for (const attribute in requirements.attributes) {
			const actorValue = this.actorAttributes[attribute].value ?? 0;
			const perkValue = requirements.attributes[attribute].value ?? 0;

			if (actorValue < perkValue) {
				requirementsMet = false;
				break;
			}
		}

		// Have we read any required magazines?
		for (const uuid of requirements.magazineUuids ?? []) {
			if (!this.actorReadMagazines.includes(uuid)) {
				requirementsMet = false;
				break;
			}
		}

		return requirementsMet;
	}
}
