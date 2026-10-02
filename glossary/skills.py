# Spells (and, later, skills and classes) — facts tagged by the book that first
# reveals them, summarised in our own words.
from model import E

SPELLS = [
# ---------------- Book 1 ----------------
E("Magic Missile", "Spell", [
  (1, "Donut's first attack spell, learned from a tome in her opening loot boxes; her signature ranged attack."),
 ]),
E("Torch", "Spell", [
  (1, "A light spell: a curl of light that follows the caster and gets stronger with use. Donut learns it early."),
 ]),
E("Wisp Armor", "Spell", [
  (1, "Self-only, 5-mana protection: tendrils of light that soak up most magic damage and guard against mind control, but do nothing against physical hits. Carl loots the tome."),
 ]),
E("Confusing Fog", "Spell", [
  (1, "Scroll spell that fills a room with a mist only the monsters can see. Carl relies on these scrolls in tight spots."),
 ]),
E("Heal", "Spell", [
  (1, "The basic healing spell every crawler starts with."),
 ]),
E("Heal Critter", "Spell", [
  (1, "A healing spell for pets. Carl's scroll of it fails on Donut: no valid target."),
  (2, "Donut has it in her spell list."),
 ]),
E("Puddle Jumper", "Spell", [
  (1, "Short-range teleport for the caster and up to three others to a spot in line of sight. Donut learns it."),
  (4, "Firas uses it as his escape spell."),
 ], aliases={3: ["Puddle Jump"]}),
E("Second Chance", "Spell", [
  (1, "Donut's 10-mana spell: raises a dead monster of lower level than her to fight for the party for a minute per spell level."),
 ]),
E("Minion Army", "Spell", [
  (1, "A 50-mana tome that makes hostile enemies fight for you; Donut gets it before she has the mana to read it."),
 ]),
E("Protective Shell", "Spell", [
  (1, "A rare protective sphere that stays where it is cast and keeps a mob's body and physical attacks out, but not magic. Carl's enchanted boxers let him cast a level-15 one every 30 hours."),
 ]),
E("Shield", "Spell", [
  (1, "A popular protection spell that, unlike Protective Shell, moves with the caster."),
  (7, "Donut gets a Shield spellbook."),
 ]),
E("Reverse Gravity", "Spell", [
  (1, "The rage elemental's spell that hurls its victims upward; surviving it earns an achievement."),
 ]),
# ---------------- Book 2 ----------------
E("Fear", "Spell", [
  (2, "Part of Carl's Compensated Anarchist class kit; it costs him 3 mana."),
 ]),
E("Clockwork Triplicate", "Spell", [
  (2, "Donut's spell that makes two clockwork copies of a pet or minion (it only works on those); she casts it on Mongo."),
 ]),
E("Meat Hooks", "Spell", [
  (2, "Pulls nearby carnivorous pets away from their owners. Donut takes the scroll from the city elf Vicente, who used it to lure Mongo."),
 ]),
E("Ink Marauder", "Spell", [
  (2, "Brings drawings to life through a blood sacrifice; some classes tattoo the creatures onto themselves so their own blood sustains them."),
  (5, "Signet's spell; it normally takes three people: the caster, a sacrifice and someone to kill the sacrifice."),
 ]),
# ---------------- Book 3 ----------------
E("Bang Bro", "Spell", [
  (3, "Carl's 5-mana enchantment that adds fire and electric damage to an equipped item for a few minutes."),
 ]),
E("Eviscerate", "Spell", [
  (3, "An instant-kill spell with a small chance to fire on each Talon Strike kick."),
 ]),
E("Hole", "Spell", [
  (3, "Donut's utility spell that opens a temporary hole in a surface; nearly useless until levelled."),
 ]),
E("You're Not Done Yet", "Spell", [
  (3, "A War Mage spell: a fallen soldier's skin is torn away and becomes a minion called a Flesher."),
  (7, "Donut gets the spellbook; Mordecai calls it a nastier cousin of Second Chance."),
 ]),
E("Boned", "Spell", [
  (3, "The only spell a Flesher knows: it animates the skeleton of the victim it has smothered."),
 ]),
E("Glass Prison", "Spell", [
  (3, "Sadie's spell, which gets Brynhild's Daughters past the Kravyad."),
 ]),
E("Dirt Clod", "Spell", [
  (3, "Zhang's spell that pelts enemies with rocks."),
 ]),
E("Laundry Day", "Spell", [
  (3, "Named as a spell that can strip biological armor."),
  (5, "Donut gets it from her spellbook-of-the-floor club: it knocks a piece of an opponent's armor to the ground, bigger pieces at higher levels."),
  (6, "Paired with Legionnaires of the Damned in Donut's \"Phantasm\" move."),
 ]),
# ---------------- Book 4 ----------------
E("Wall of Fire", "Spell", [
  (4, "Donut's 15-mana escape spell: a wall of flame about ten meters wide."),
  (4, "Fire spreads: casting it against flying gerbils turns them into fireballs."),
 ]),
E("Graupel", "Spell", [
  (4, "Elle's 50-mana ice-storm war spell, from her deity box."),
 ]),
E("Astral Paw", "Spell", [
  (4, "Donut's utility spell: a force paw, like Astral Hand without the thumb but hitting harder; it can grow claws at level five."),
 ]),
E("Cloud of Exhaust", "Spell", [
  (4, "Louis's spell, which lets his group skip fights; ten-minute cooldown."),
 ]),
E("Water Breathing", "Spell", [
  (4, "Scroll spell that lets you breathe underwater for a time based on your intelligence."),
 ]),
E("Ping", "Spell", [
  (4, "Carl's 5-mana hunting and artillery-spotting spell, standard issue for the Dream's elven gunners."),
 ]),
# ---------------- Book 5 ----------------
E("Zerzura", "Spell", [
  (5, "The Sledge's teleportation-type spell, which Quasar has Carl ask for after telling him the story of Remex the Grand; Borant is eager to grant it."),
  (7, "The Sledge casts it to move all of Larracos and Shanty Town to the 12th floor."),
 ]),
E("Teleport to Stairwell", "Spell", [
  (5, "Bomo's level-15 spell from Carl's mercenary deal: teleport to any stairwell on the floor, with a very long cooldown."),
 ]),
E("Standing Ovation", "Spell", [
  (5, "One of Donut's sung party spells: raises everyone's Dexterity and strengthens their spells. Its power depends on how well she sings."),
 ]),
E("Entourage", "Spell", [
  (5, "One of Donut's sung party spells: creates illusory copies of each party member."),
 ]),
E("Encore", "Spell", [
  (5, "One of Donut's sung party spells: a party heal that can also clear several debuffs."),
 ]),
E("Transfiguration", "Spell", [
  (5, "Queen Imogen's spell. It failed on Scolopendra, and was among the spells reflected in her nine-tier attack."),
 ]),
E("Bamboozeled", "Spell", [
  (5, "Grows poisonous bamboo stalks used to build siege engines."),
 ]),
E("Community Pool", "Spell", [
  (5, "Prepotente's scroll spell: touching two people, he moves an infection from one to the other. It backfired against Viscount Fog."),
 ]),
# ---------------- Book 6 ----------------
E("Legionnaires of the Damned", "Spell", [
  (6, "Donut's summoning tome, cast on recently unequipped armor or weapons; it releases a horde of shrieking ghosts."),
 ]),
E("Mute", "Spell", [
  (6, "Donut's spell for stopping monsters from casting spells."),
 ]),
E("Build Trench", "Spell", [
  (6, "Scroll spell that digs a permanent trench."),
  (6, "Late in the floor the game showers crawlers with these scrolls."),
 ]),
# ---------------- Book 7 ----------------
E("Flak", "Spell", [
  (7, "Donut's anti-air spell, from her Spellbook of the Floor prize."),
 ]),
E("Sentry", "Spell", [
  (7, "A war protection spell from one of Donut's spellbooks."),
 ]),
E("Summon Ally", "Spell", [
  (7, "Commander Stockade uses his level-15 Summon Ally spell to send Carl an invitation as part of a scheme."),
 ]),
E("Edifice Shield", "Spell", [
  (7, "A building shield meant for outposts, not great palaces; on a finished tower it doubles the structure's strength."),
 ]),
E("Travel the Path", "Spell", [
  (7, "Granted by gods of light: the adherent briefly becomes light and follows a path, which the system does not count as teleporting."),
 ]),
E("Run, Little Günter, Run", "Spell", [
  (7, "Carl's Special Edition summoning spell: Little Günter has one hit point, stores whatever attack hits him, then runs off."),
  (7, "It came from the Legendary 1914 box, earned for killing D'Nadia."),
 ], aliases={7: ["Little Günter"]}),
E("War Crime", "Spell", [
  (7, "Donut's Atrocity-class spell; Carl hopes they never need it."),
  (7, "It came from the Legendary 1914 box, like Run, Little Günter, Run."),
 ]),
E("Raise Forest", "Spell", [
  (7, "A druid-like spell Donut gets with her new class: makes trees and plants sprout over a huge area."),
 ]),
E("Gather Ye, Vermin", "Spell", [
  (7, "Another spell from Donut's new class: draws small mammals from kilometers around to her."),
  (8, "Donut uses it as a finisher to pull every rodent in the area to her."),
 ], aliases={8: ["Summon Ye, Vermin"]}),
E("Subterfuge", "Spell", [
  (7, "Elle's concealment spell; a search for her location can cancel it."),
 ]),
E("Paint the Target", "Spell", [
  (7, "Marks a target for long-range fire; it has a distance limit, not just line of sight."),
 ]),
E("Bear Witness", "Spell", [
  (7, "The goddess Eris's floor-wide spell: everyone outdoors freezes, eyes white. Carl's Mind Balance negates it."),
 ]),
E("Bring Forth the Witnesses", "Spell", [
  (7, "Eris's follow-up spell; at level 20 it blocks long-range teleports across the floor for an hour."),
 ]),
E("Bounce House", "Spell", [
  (7, "A spell Britney's team plans to use to catch falling crawlers."),
 ]),
# ---------------- Book 8 ----------------
E("Oozy Form", "Spell", [
  (8, "Carl learns it from a slimy, wriggling spellbook: it turns the caster into a slime."),
 ]),
E("Ice Slick", "Spell", [
  (8, "An Elle-style ice spell Donut gets: coats a wide area of ground in ice."),
 ]),
E("Split Personality", "Spell", [
  (8, "Cuts its target in half down the middle; a fleshmancer can join the halves again."),
 ]),
E("Confuzzled", "Spell", [
  (8, "Imani's spell that stuns a room full of enemies."),
 ]),
E("Gatekeeper", "Spell", [
  (8, "Donut's Advance Reader Copy tome, \"street date\" 12th floor; 75 mana, and it can target opponents, NPCs, deities and \"OI entities.\""),
 ]),
]

# Classes (and a few crawler races not covered in races.py), by character.
CLASSES = [
# ---------------- Carl ----------------
E("Compensated Anarchist", "Class", [
  (2, "Carl's 3rd-floor class, an Earth class built around traps and bombs: the Fear spell, trap- and bomb-making skills, and access to the Desperado Club and the Naughty Boys Employment Agency."),
 ]),
E("Agent Provocateur", "Class", [
  (5, "The specialty Carl picks for Compensated Anarchist on the 6th floor: the ultimate saboteur, focused on mass-casualty bombs, with extra intelligence and an advanced Bomb Maker's Workshop."),
 ]),
E("Bomb Squad Tech", "Class", [
  (2, "An exclusive explosives class offered to Carl (it needs the Boom! achievement); he picks Compensated Anarchist instead."),
 ]),
# ---------------- Donut ----------------
E("Former Child Actor", "Class", [
  (2, "Donut's rare 3rd-floor class, an offshoot of Character Actor for crawlers with the \"Cut!\" achievement and a trillion views; a Charisma and chance-based comeback class."),
 ]),
E("Artist Alley Mogul", "Class", [
  (2, "A merchant class offered to Donut; she later takes it as her 3rd-floor specialty, though she misses out on most of its usable benefits."),
 ]),
E("Glass Cannon", "Class", [
  (4, "A class Donut picks on the 5th floor: a big base Constitution bonus, cheaper spells and faster spell training, but no Constitution from level-ups."),
 ]),
E("Viper Queen", "Class", [
  (5, "The class Donut grabs at the very end of the 6th floor without reading it."),
  (6, "She was only a Viper Queen for a few minutes before the floor was skipped."),
 ]),
E("Gurkha", "Class", [
  (8, "Elite Gurkha Warrior: a melee warrior class with a Perpetual Tank subclass and upgrades for pets and mercenaries; Mordecai suggests it for Donut."),
 ], aliases={8: ["Elite Gurkha Warrior"]}),
# ---------------- Party and friends ----------------
E("Monster Truck Driver", "Class", [
  (2, "Katia's class."),
  (5, "The 6th floor adds an \"endorsement\" without changing the class name."),
 ]),
E("Blizzardmancer", "Class", [
  (2, "Elle McGib's ice-caster class."),
 ]),
E("Tundra Princess", "Class", [
  (5, "Elle's class after Blizzardmancer: earth combined with ice."),
 ]),
E("Fire Spiritualist", "Class", [
  (3, "Imani's class."),
 ]),
E("Swashbuckler", "Class", [
  (2, "Bautista's class."),
 ]),
E("Street Monk", "Class", [
  (2, "Li Jun's class."),
 ]),
E("Pest Exterminator", "Class", [
  (4, "Louis's class."),
 ]),
E("Hammersmith", "Class", [
  (4, "Firas's class."),
 ]),
E("Boring Ol' Fighter", "Class", [
  (4, "Gwendolyn Duet's class; it trades all magic for fighting skills."),
 ]),
E("D-Bag Geek", "Class", [
  (4, "Low Thi's class."),
 ]),
# ---------------- Top-ten crawlers and rivals ----------------
E("Black Inquisitor General", "Class", [
  (2, "Lucia Mar's class; she tops the first bounty board."),
 ]),
E("Shieldmaiden", "Class", [
  (2, "Hekla's class."),
 ]),
E("Forsaken Aerialist", "Class", [
  (2, "Prepotente's class."),
 ]),
E("Profane Vitiate", "Class", [
  (5, "Prepotente's class after Forsaken Aerialist."),
 ]),
E("Shepherd", "Class", [
  (2, "Miriam Dom's class."),
 ]),
E("Shotgun Messenger", "Class", [
  (2, "Florin's class."),
 ]),
E("Physicker", "Class", [
  (2, "Ifechi's class."),
 ]),
E("Imperial Security Trooper", "Class", [
  (3, "Quan Ch's class."),
 ]),
E("Sergeant-at-Arms", "Class", [
  (5, "Quan Ch's class after Imperial Security Trooper; Donut jokes that, one-armed, it should be \"Sergeant-at-Arm.\""),
 ], aliases={5: ["Sergeant at Arms"]}),
E("Illusionist", "Class", [
  (4, "Dmitri Popov's class (his brother Maxim is a Bogatyr)."),
 ]),
E("Visionary", "Class", [
  (5, "Dmitri Popov's class after Illusionist."),
 ]),
E("Bogatyr", "Class", [
  (4, "Maxim Popov's class."),
 ]),
E("Legatus", "Class", [
  (4, "Bogdon Ro's class."),
 ]),
E("Sacred Paladin", "Class", [
  (4, "Chirag Ali's class."),
 ]),
E("Nimblefoot Enforcer", "Class", [
  (3, "Eva Sigrid's class."),
 ]),
E("Blood Assassin", "Class", [
  (3, "Frank Q's class."),
 ]),
E("Zulu Warrior", "Class", [
  (4, "Chris Andrews's class."),
 ]),
E("Santero", "Class", [
  (6, "Paz Lo's class."),
 ]),
E("Poet Laureate", "Class", [
  (6, "Sister Ines Quiteria's class."),
 ]),
# ---------------- Races missing from races.py ----------------
E("Obsidian Butterfly", "Race", [
  (3, "Imani's race."),
 ]),
E("Night Elf", "Race", [
  (3, "Frank Q's race."),
 ]),
E("Igneous", "Race", [
  (4, "Chris Andrews's race."),
 ]),
E("Half Elf", "Race", [
  (3, "Quan Ch's race."),
 ]),
E("Cat Girl", "Race", [
  (2, "Mentioned as a race some crawlers pick."),
  (6, "Sister Ines Quiteria's race."),
 ], aliases={2: ["cat girls"]}),
]
