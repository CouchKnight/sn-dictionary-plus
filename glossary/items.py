# Signature items and gear — facts tagged by the book that first reveals them,
# summarised in our own words.
from model import E

ITEMS = [
# ---------------- Book 1 ----------------
E("Enchanted Nightgaunt Cloak of Stoutness", "Item – armor", [
  (1, "Carl's demon-wing cloak from his first gold apparel box: +4 Constitution, poison and ice resistance, and anti-piercing on all his worn armor."),
 ], aliases={1: ["Nightgaunt Cloak"]}),
E("Enchanted Trollskin Shirt of Pummeling", "Item – armor", [
  (1, "Carl's tanking undershirt: +7 to Regeneration, and it negates melee debuffs like Stun and Knockback."),
 ], aliases={1: ["Trollskin Shirt"]}),
E("Enchanted Toe Ring of the Splatter Skunk", "Item – ring", [
  (1, "Carl's first toe ring (he wanted shoes): +3 Strength and +3 to Powerful Strike."),
 ]),
E("Enchanted Crown of the Sepsis Whore", "Item – crown", [
  (1, "Donut's legendary tiara: +5 Intelligence, a better first impression, and a chance for any attack to inflict Sepsis. Wearing it puts her in the Blood Sultanate's line of succession for the 9th floor, permanently."),
 ]),
E("Enchanted Fae Scale Quadruped Crupper of the Fleet", "Item – armor", [
  (1, "Donut's first armor: light fae-steel scale, +2 Dexterity."),
 ]),
E("Enchanted War Gauntlet of the Exalted Grull", "Item – weapon", [
  (1, "Carl's right-handed bracer that becomes a spiked orcish war gauntlet when he makes a fist: strength and punching bonuses and a chance to stun. Hitting an adherent of Grull risks turning them into the god himself."),
 ], aliases={1: ["War Gauntlet"]}),
E("Enchanted Pedicure Kit of the Sylph", "Item – kit", [
  (1, "Nightly foot care in a safe room buffs Carl's bare-foot fighting for 30 hours, including unbreakable feet and a warning delay on footfall traps."),
 ]),
E("Enchanted BigBoi Boxers", "Item – armor", [
  (1, "Self-sizing boxers covered in hearts: +2 Constitution, and Carl can cast a level-15 Protective Shell once every 30 hours."),
 ], aliases={1: ["BigBoi Boxers"]}),
# ---------------- Book 2 ----------------
E("Sheol Glass Reaper Case", "Item", [
  (2, "A protective case forged on Sheol and sold by Reaper Spider Minions; opening it carries a small chance of being hit by Sheol Fire."),
 ]),
# ---------------- Book 3 ----------------
E("Enchanted Necklace of the Haute Bourgeoisie", "Item – necklace", [
  (3, "Carl's chain of leadership: each jewel is a settlement he controls, paying taxes every ten days and granting perks (his skyfowl town gives Talon Strike)."),
 ]),
E("Enchanted Tiara of Mana Genita", "Item – crown", [
  (3, "Donut's replacement tiara: +3 Intelligence, better mob detection on the map, and no automatic hostility from Mana Genita's worshippers."),
 ]),
E("Ring of Divine Suffering", "Item – ring", [
  (3, "The Enchanted Night Wyrm's Ring of Divine Suffering: Frank Q gives it to Carl as his \"revenge.\" +5% to all stats and the infamous Marked for Death skill."),
 ], aliases={3: ["Night Wyrm's Ring of Divine Suffering"]}),
E("Enchanted Repeating Crossbow of the Scavenger Mother of Mothers", "Item – weapon", [
  (3, "Katia's unique golden repeating crossbow, tied to the vulture goddess Nekhebit; it never runs out of basic bolts. It refuses male wielders."),
 ]),
E("Enchanted Wrestling Belt of the Great Gorgo", "Item", [
  (3, "Katia's champion belt: +5% Strength and Constitution, and Avalanche, which doubles the force of hitting something with her moving body."),
 ]),
E("Enchanted Shade Gnoll Riot Forces Crowd Control Shield", "Item – shield", [
  (3, "Katia's riot shield: upgrades her Rush ability to Crowd Blast."),
 ]),
E("The Left Fang of the Green Sultan", "Item – weapon", [
  (3, "Eva Sigrid's saber; magical only when paired with its twin, so useless alone."),
  (4, "Carl gives it to Katia to return to its owner."),
 ], aliases={3: ["Left Fang of the Green Sultan"]}),
E("The Bolt of Ophiotaurus", "Item – ammunition", [
  (3, "Katia's single crossbow bolt (1 of 100): shot into a deity's eye, it pauses the god's invulnerability for fifteen seconds."),
 ], aliases={3: ["Bolt of Ophiotaurus"]}),
# ---------------- Book 4 ----------------
E("Enchanted Toe Ring of the Leprous Bandit", "Item – ring", [
  (4, "Carl's toe ring with two benefits: Sticky Feet, and Super Spreader (pass his debuffs to a target once an hour)."),
 ]),
E("Celestial Grenade", "Item", [
  (4, "Summons the wielder's god for sixty seconds (a random god if they worship none). Maggie tries to use one against Carl."),
 ]),
E("Enchanted Anarchist's Battle Rattle", "Item – armor", [
  (4, "Carl's sleeveless jacket: weak on its own, but it holds as many upgrade patches as he can fit, and gains stats with each one; +50% range and accuracy for thrown explosives."),
 ], aliases={4: ["Battle Rattle"]}),
E("Upgrade Patch", "Item", [
  (4, "Sewn onto an eligible garment for a permanent bonus; removing one destroys it. Carl's first is a small Earth patch."),
 ]),
E("Drakea's Enchanted Kerchief of Disorder", "Item", [
  (4, "Named for the Cookbook author Drakea: +5 Detect Traps, a level-15 Tripper spell every five hours, and the Remote Detonator benefit."),
 ], aliases={4: ["Kerchief of Disorder"]}),
E("Rockard's Ring of Sniping", "Item – ring", [
  (4, "Named for an infamous kill-stealing orc crawler; its Ripe benefit marks every creature under half health on Carl's map."),
 ]),
E("Winding Box", "Item", [
  (4, "One of the three pieces of the Gate of the Feral Gods, with two pocket watches; together they open the gate."),
 ]),
# ---------------- Book 5 ----------------
E("Enchanted Collar Charm of the Effete Bourgeoisie", "Item – charm", [
  (5, "Donut's mid-size chain of leadership, worn on her collar: settlement jewels, taxes and town perks, like Carl's necklace."),
 ]),
E("Enchanted Obsidian Bracelet of the Raggle Rouser", "Item", [
  (5, "Donut's thrice-upgraded bracelet: +10 Constitution, +5 Dexterity, fire resistance, and a level-10 Fireball every twenty minutes."),
 ]),
# ---------------- Book 6 ----------------
E("Enchanted Right Back Atcha Personal Shield", "Item – shield", [
  (6, "Carl's auto-deploying buckler that can catch physical and magic bolt attacks and throw them back."),
 ]),
E("Enchanted Nipple Ring of the Defiler", "Item – ring", [
  (6, "Carl's ring for crawlers Marked for Death by a god: reveals religious affiliations, lets him destroy shrines safely, +25% damage against clerics, and Black Nimbus once an hour."),
 ]),
E("Enchanted Tiara of the Inebriated Dragonfly", "Item – crown", [
  (6, "Donut's citrine tiara: faster potion cooldowns, +10 Intelligence, and a level-10 Hover skill."),
 ]),
E("Enchanted Pauper's Ring of the Steadfast Emberus", "Item – ring", [
  (6, "A ring for Emberus worshippers that removes most disease and health-draining debuffs; on anyone else it becomes cursed."),
 ]),
E("The Filthy Little Crawler's Book of Voodoo", "Item", [
  (6, "An untradeable, indestructible blank book that always returns to its owner, named after convention message boards."),
 ], aliases={6: ["Book of Voodoo"]}),
# ---------------- Book 7 ----------------
E("The Tiara of a Thousand Lights", "Item – crown", [
  (7, "Made for Donut by her sponsor Long Haul Biological Waste Management Solutions; it holds 99 Absorption Jewels."),
 ], aliases={7: ["Tiara of a Thousand Lights"]}),
E("The Cloak of the Benevolent Champion", "Item – armor", [
  (7, "An early Celestial item Carl gives Donut: her lowest stat rises to match her highest, and four random spells jump to level 15."),
 ], aliases={7: ["Cloak of the Benevolent Champion"]}),
E("Enchanted Toe Ring of the Well-Balanced", "Item – ring", [
  (7, "Carl's left-pinky toe ring: Heart Balance stores an auto-trigger potion, and Mind Balance protects his mind."),
 ]),
E("Enchanted Spiked Knee Pads of the Munificent Goddess Kina", "Item – armor", [
  (7, "Katia's award, made of the sea goddess Kina's eyelashes: melee damage reflection, underwater breathing, swimming and more."),
  (8, "The pig Penelope wears them."),
 ], aliases={8: ["Enchanted Spiked Kneepads of the Munificent Goddess Kina"]}),
# ---------------- Book 8 ----------------
E("Enchanted Juvenile Macropus Dominus Skin", "Item – costume", [
  (8, "A 12-hour kangaroo-skin costume: protection from seeping acid and a level-10 Jump skill."),
 ]),
]
