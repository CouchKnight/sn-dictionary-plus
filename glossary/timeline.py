# Per-book event summaries ("Book N events") and "who is whose" family tables.
# Every line is our own summary of an already-verified glossary fact and
# unlocks at the same passage as that fact.
from model import E

TIMELINE = [
E('Book 1 events', "Timeline", [
  (1, "Borant, the kua-tin company given regency over Earth's system, turns the planet into the 18-level World Dungeon."),
  (1, "Carl follows his ex-girlfriend Bea's cat Donut into the dungeon; Mordecai becomes their game guide."),
  (1, "They meet the Meadow Lark group: Imani, Yolanda, Brandon and Chris."),
  (1, "Carl wins the War Gauntlet of the Exalted Grull."),
  (1, "Yolanda dies protecting the group from the Rage Elemental."),
  (1, "Frank Q and his wife Maggie attack Carl's group."),
  (1, "Carl humiliates Prince Maestro on his own show."),
  (1, "Donut's pet Mongo hatches."),
 ]),
E('Book 2 events', "Timeline", [
  (2, "On the 3rd floor Donut becomes a Former Child Actor."),
  (2, "Carl becomes a Primal Compensated Anarchist."),
  (2, "Tsarina Signet's circus storyline begins."),
  (2, "Carl learns how Scolopendra's attack cursed the Over City."),
  (2, "Prince Maestro is disowned and reported dead."),
  (2, "Carl meets Katia, a Doppelganger."),
  (2, "Hekla's Brynhild's Daughters are near the top of the bounty board."),
 ]),
E('Book 3 events', "Timeline", [
  (3, "The 4th floor is the Iron Tangle train network."),
  (3, "The Valtay Corporation sponsors Carl."),
  (3, "Carl learns Maggie killed her own daughter Yvette."),
  (3, "Frank Q gives Carl the Ring of Divine Suffering and is killed."),
  (3, "Katia accidentally kills Hekla on the train and joins Carl and Donut."),
  (3, "Carl summons Grull; Prince Maestro returns as the god's driver."),
 ]),
E('Book 4 events', "Timeline", [
  (4, "The 5th floor is a sheet of bubble worlds, each with four castles."),
  (4, "Lucia Mar kills Ifechi."),
  (4, "Maggie, an Infiltrator, is revealed inside Chris; she made him kill Frank Q."),
  (4, "Miriam Dom is turned into a vampire."),
  (4, "Carl becomes an adherent of Emberus."),
  (4, "Gods come through the Gate of the Feral Gods, including Ysalte."),
  (4, "An interlude shows Bea alive outside the dungeon."),
 ]),
E('Book 5 events', "Timeline", [
  (5, "The 6th floor is the Hunting Grounds."),
  (5, "Carl learns Odette saved Bea."),
  (5, "A court ruling hands the Valtay 51% of the Borant Corporation."),
  (5, "Imani becomes guildmaster of Safehome Yolanda."),
  (5, "Miriam Dom dies; Prepotente keeps her ashes."),
  (5, "Queen Imogen is killed at the Butcher's Masquerade; Signet dies in the final battle."),
  (5, "Carl becomes an Agent Provocateur; he and Donut are co-warlords of the Princess Posse."),
 ]),
E('Book 6 events', "Timeline", [
  (6, "Katia hunts down and kills Eva Sigrid."),
  (6, "The 8th floor, \"The Ghosts of Earth,\" splits crawlers into squads."),
  (6, "Carl and Donut buy their Faction Wars team."),
  (6, "Carl and Katia assassinate Astrid."),
  (6, "Odette's part in the death of Mordecai's brother Uzzi comes out."),
  (6, "Paz Lo, as a card, kills the goddess Ysalte."),
 ]),
E('Book 7 events', "Timeline", [
  (7, "Faction Wars begins: nine attacking teams against the NPC defenders."),
  (7, "Juice Box leads Team Retribution and marries Louis."),
  (7, "Carl's pet Rend saves Mongo from Gustavo."),
  (7, "Donut is named Champion of Nekhebit."),
  (7, "The Sledge casts Zerzura, sending Larracos to the 12th floor."),
 ]),
E('Book 8 events', "Timeline", [
  (8, "War mages beat Elle and steal the Gate of the Feral Gods."),
  (8, "The 10th floor is a race run in heats."),
  (8, "The rogue AI blows up Valtay facilities; a Valtay fleet arrives with a system-busting bomb."),
  (8, "Lucia Mar is revealed to carry thousands of trapped children in her head."),
  (8, "The 11th floor opens with only 23 crawlers left."),
  (8, "The pig Penelope joins Carl's party."),
 ]),
]

FAMILIES = [
E('Skull Empire royal family', "Family", [
  (1, "Prince Maestro and Prince Stalwart are brothers."),
  (3, "Their father is Rust."),
  (5, "Their mother is Queen Consort Ugloo."),
  (6, "Ugloo is a half-sister of Victory."),
 ]),
E('High Elf royal family', "Family", [
  (2, "King Finian is Signet's father; her mother was a naiad."),
  (5, "Queen Imogen is Finian's daughter and Signet's half-sister."),
 ]),
E("Circe Took's family", "Family", [
  (5, "Circe Took of the Dark Hive is Vrah's mother."),
 ]),
E("Frank Q's family", "Family", [
  (1, "Maggie My is Frank Q's wife."),
  (1, "Their daughter is Yvette."),
 ]),
E("Juice Box's family", "Family", [
  (4, "Juice Box and Henrik are sister and brother."),
  (7, "Juice Box marries Louis."),
 ]),
E("Mordecai's family", "Family", [
  (6, "Uzzi was Mordecai's brother."),
 ]),
E('Li family', "Family", [
  (1, "Li Jun and Li Na are brother and sister."),
 ]),
E("Miriam Dom's household", "Family", [
  (3, "Miriam is the \"mother\" of her goat Prepotente."),
  (5, "Her familiar is the hellspawn goat Bianca."),
  (6, "After Miriam, Bianca stays with Prepotente."),
 ]),
E("Donut's family", "Family", [
  (1, "Donut's owner is Bea, Carl's ex."),
  (2, "Her grandmother, Princess Chonkalot, is tattooed on Bea's lower back."),
  (5, "Kiwi becomes Donut's minion."),
 ]),
]
