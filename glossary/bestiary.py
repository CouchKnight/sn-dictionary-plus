# Bestiary: monster types — facts tagged by the book that first reveals them,
# summarised in our own words (never the in-book description text).
from model import E

BEASTS = [
# ---------------- Book 1 ----------------
E("Goblin Engineer", "Monster", [
  (1, "One of the first monsters Carl meets: a lonely, extra-angry goblin that goes for female party members first."),
 ]),
E("Bad Llama", "Monster", [
  (1, "A delinquent llama that spits lava; some will trade if you have good stuff."),
 ]),
E("Scatterer Brood Guardian", "Monster", [
  (1, "A giant, rage-filled cockroach, much more dangerous than the small scatterers."),
 ]),
E("Goblin Bomb Bard", "Monster", [
  (1, "A goblin explosives expert with ranged blast attacks; the more fingers it still has, the more dangerous it is."),
 ]),
E("Goblin Shamanka", "Monster", [
  (1, "A female goblin shaman, leader class of the goblin clans; she casts Anguish Magic, which amplifies other damage."),
 ]),
E("Troglodyte Pygmy", "Monster", [
  (1, "A tiny, stupid, very fast and venomous tunnel monster."),
 ]),
E("Tuskling Knight", "Monster", [
  (1, "A washed-up orc noble; Tusklings are only dangerous when they gang up into a Ball of Swine."),
 ]),
E("Brindle Grub", "Monster", [
  (1, "The 2nd floor's corpse-eating cleanup crew: they grow with every kill nearby, and once you see pupae it's time to leave."),
  (1, "The Cow-Tailed Brindle Grub is the last stage before the pupa, and can finally fight back a little."),
 ], aliases={1: ["Cow-Tailed Brindle Grub"]}),
E("Danger Dingo", "Monster", [
  (1, "Mastiff-sized, metal-loving dingoes, usually ridden by kobolds."),
 ]),
E("Kobold Rider", "Monster", [
  (1, "Small, yappy, fearless and clever kobolds who ride Danger Dingoes into battle."),
 ], aliases={1: ["Kobold"]}),
E("Clurichaun", "Monster", [
  (1, "Hillbilly cousins of leprechauns. The unvaccinated Rev-Up Consultants push the Rev-Up scheme and count as fairy-class, so they hit Carl harder because of his goblin pass."),
 ], aliases={1: ["Unvaccinated Clurichaun Rev-Up Consultant"]}),
E("Laminak", "Monster", [
  (1, "Managers of the Rev-Up operation; years of drinking their own product make them resist most health-draining attacks."),
 ]),
# ---------------- Book 2 ----------------
E("Village Guard Swordsman", "Monster", [
  (2, "Silent, armored guards protecting the 3rd floor's towns from the Over City's monsters, but only by day. Crossing them means death."),
 ]),
E("Former Circus Lemur", "Monster", [
  (2, "Feral descendants of Grimaldi's juggling lemurs; they wear their victims' remains as armor."),
 ]),
E("Terror the Clown", "Monster", [
  (2, "An eleven-foot stilt clown from Grimaldi's circus, turned into an eyeless killer with butcher knives."),
 ]),
E("Mold Lion", "Monster", [
  (2, "Once Madam Kiki's dancing lions, turned green and murderous by Scolopendra's spores."),
 ]),
E("Clammy the Clown", "Monster", [
  (2, "Resurrected copies of a fat, jolly circus clown who now eats people."),
 ]),
E("Street Urchin", "Monster", [
  (2, "Spiky, nocturnal cleaner creatures, once pets of the Over City's rich; now they clean up corpses in the ruins."),
 ]),
E("Krasue", "Monster", [
  (2, "A flying vampire head trailing its organs; it isn't truly dead until you destroy the rest of its body. Ghost-class, so only magic hurts it."),
 ]),
E("Shambling Berserker", "Monster", [
  (2, "An undead assassin made from leftover dungeon parts; it relentlessly hunts whoever it is sent after."),
 ]),
# ---------------- Book 3 ----------------
E("Drek", "Monster", [
  (3, "Demonic, ravenous babies that hunt in packs of fifty or more."),
 ]),
E("Jikininki", "Monster", [
  (3, "The most common ghoul in the Iron Tangle: a janitor that leaves you alone unless you bleed, litter or crowd it."),
 ]),
E("Cave Mudge", "Monster", [
  (3, "A war-like race that fell from the stars back to the stone age; the Bonker is their fast-moving fighter."),
 ], aliases={3: ["Cave Mudge Bonker"]}),
E("Pollyslog", "Monster", [
  (3, "A big, dim monster from kua-tin myth that secretes acid from its fingers."),
 ]),
E("Literal Fire Ants", "Monster", [
  (3, "A trap monster: a flood of ants that are literally on fire."),
 ]),
E("Red Cornet", "Monster", [
  (3, "A blind, skinless, cave-dwelling relative of the Lepus that attacks with echolocation."),
 ]),
E("DTs", "Monster lore", [
  (3, "Withdrawal from the Rev-Up vitamin shot: a fatal three-stage condition. Stage two doubles a mob's strength and takes away its reason; stage three twists it into a tentacled shape."),
 ]),
E("Babababoon", "Monster", [
  (3, "A baboon crossed with a jail drunk tank: pure idiotic chaos."),
 ]),
E("Festering Ghoul", "Monster", [
  (3, "What Rev-Up addicts become once the DTs set in."),
 ]),
E("Blister Ghoul", "Monster", [
  (3, "Spawned by soul-crystal ghoul generators: one for every non-undead mob that dies on the floor."),
 ]),
E("Razor Fox", "Monster", [
  (3, "Normally a ninja-star-throwing fox; the ones Carl meets have mutated in the last stage of the DTs."),
 ]),
E("Krakaren Crotch Dumpling", "Monster", [
  (3, "Wriggling parasite clones of Krakaren, the by-product of her long attempt to create a child of her own."),
 ]),
E("Jabbering Jibber-Jabber", "Monster", [
  (3, "A minion of the Mimic Rex: a reanimated, ever-hungry mouth in constant pain."),
 ]),
# ---------------- Book 4 ----------------
E("Thorny Devil", "Monster", [
  (4, "Big, fast, spiky desert lizards; the males guard a queen. Lizard-class, so Carl's Extinction Sigil makes them hit him harder."),
 ], aliases={4: ["Male Thorny Devil"]}),
E("Frenzied Gerbil", "Monster", [
  (4, "Gerbils packed into balls and fired at targets as living ammunition."),
 ]),
E("Concierge Shark", "Monster", [
  (4, "A fast shark that eats anything and is drawn to blood: the usual killer of water-themed dungeons."),
 ]),
E("Big Boy Blue", "Monster", [
  (4, "The largest jellyfish: harmless unless you touch it."),
 ]),
E("Octo-Shark", "Monster", [
  (4, "Lusca's brood: thousands of pups live in her mouth and eat each other until one or two survive."),
 ], aliases={4: ["Juvenile Octo-Shark"]}),
# ---------------- Book 5 ----------------
E("Funeral Bell", "Monster", [
  (5, "Humorless mushroom guards who protect the 6th floor's small settlements day and night."),
 ]),
E("Night Weasel", "Monster", [
  (5, "Invisible pack hunters, about twenty to a gang; only a hunter with huge charisma can control them."),
 ]),
# ---------------- Book 6 ----------------
E("Monk Seal", "Monster", [
  (6, "Kung-fu monk seals sworn to guard the coast and hunting grounds against the Red Maníseros Land Crabs."),
 ]),
E("Squonk", "Monster", [
  (6, "A legendary creature of the eastern United States: so ugly and miserable it cries until it dissolves into water. It never fights."),
 ]),
E("Ghommid", "Monster", [
  (6, "Ghostly, unsettled spirits of a town's former residents; they come in every shape and size."),
 ], aliases={6: ["Unsettled Ghommid"]}),
E("Pox Slug", "Monster", [
  (6, "Tiny angry slugs that burst from boils, each a level higher than the last."),
 ]),
# ---------------- Book 7 ----------------
E("Rolling Battle Formation Ball", "Monster", [
  (7, "A bigger, nastier version of the Ball of Swine."),
 ]),
E("Skank Skunk", "Monster", [
  (7, "Peaceful skunk folk kept in line by their leaders, with a foul aerosol attack."),
 ], aliases={7: ["Skank Skunk Warrior"]}),
E("Reaver Cyborg Drop Trooper", "Monster", [
  (7, "Cybernetic soldiers of the Reavers. The System AI apologizes for letting sci-fi creep into the crawl."),
 ]),
E("Flesher", "Monster", [
  (3, "A corpse's skin, torn off by the War Mage spell You're Not Done Yet and animated to hunt for a new body."),
  (7, "Carl runs into one made from a dead human's skin."),
 ]),
E("Ursensus", "Monster", [
  (7, "A new legendary creature: part raptor, part bear, part Scolopendra magic, born to Mongo's line. Too intelligent to be a pet."),
 ]),
# ---------------- Book 8 ----------------
E("Screeching Death Manatee", "Monster", [
  (8, "A special guest creature for the 10th and 11th floors, descended from ordinary manatees left on an abandoned terraforming world."),
 ]),
E("Sugar Hermit", "Monster", [
  (8, "Fast, agile creatures that eat brains and bones and wear skulls like shells; females migrate to the giant kaiju skull."),
 ]),
E("Reverse Tooth Fairy", "Monster", [
  (8, "Jacobus: a Danish tooth-fairy legend, once a legendary card summon, now permanently loose because of Carl."),
 ]),
E("Toot-Toot Doll", "Monster", [
  (8, "Dolls accidentally infused with the knockers' elemental magic; infused elementals can pass through things."),
 ]),
E("Sacred Feaster Scarab Beetle", "Monster", [
  (8, "Invulnerable bugs the System AI took from Khepri's feast table."),
 ]),
E("Shadow Mimic", "Monster", [
  (8, "A special kind of mimic, enforcers for a redacted group and the sworn enemies of changeling principals."),
 ]),
]
