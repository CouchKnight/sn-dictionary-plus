# Game mechanics of the crawl — facts tagged by the book that first reveals
# them, summarised in our own words.
from model import E

MECHANICS = [
E("Safe room", "Mechanic", [
  (1, "Safe areas that always show on the map, even under fog of war, with restrooms and sleeping cubicles and sometimes food and healing fountains. There is no time limit, but the level still collapses. Loot boxes can only be opened in safe areas."),
 ], aliases={1: ["saferoom", "safe rooms", "saferooms"]}),
E("Level collapse", "Mechanic", [
  (1, "Every floor has a countdown; when it runs out the level collapses, so crawlers must keep descending to survive."),
 ]),
E("Tutorial guild", "Mechanic", [
  (1, "Guild halls seeded through floors 1–3 where game guides coach crawlers; all guildhalls are safe areas."),
 ], aliases={1: ["tutorial guilds"]}),
E("Personal space", "Mechanic", [
  (1, "Private quarters a crawler can buy, available from the 4th floor."),
 ], aliases={1: ["personal spaces"]}),
E("Achievement", "Mechanic", [
  (1, "Snarky awards from the System AI for milestones, often with a loot box; Carl's first is Crazy Cat Lady."),
 ], aliases={1: ["achievements"]}),
E("Loot box", "Mechanic", [
  (1, "Prize boxes from achievements and sponsors: dozens of types, each in six tiers (Bronze, Silver, Gold, Platinum, Legendary, Celestial)."),
 ], aliases={1: ["loot boxes"]}),
E("Benefactor box", "Mechanic", [
  (1, "Boxes only patrons can send; they hold the rarest items, even technology from the patron's home world."),
 ], aliases={1: ["Benefactor Box", "benefactor boxes"]}),
E("Fan box", "Mechanic", [
  (2, "A box whose contents are voted on by a crawler's followers; it can't be opened for thirty hours while they vote."),
 ], aliases={2: ["Fan Box", "fan boxes"]}),
E("Sponsor", "Mechanic", [
  (1, "Viewers follow and favorite crawlers; lots of favorites attract patrons, usually organizations, who sponsor crawlers by buying them boxes."),
  (1, "From this season each crawler gets at most three patrons, with the slots auctioned as the 4th, 5th and 6th floors open."),
 ], aliases={1: ["Patron", "patrons", "sponsors"]}),
E("Boss", "Mechanic", [
  (1, "Six main kinds: Neighborhood, Borough, City, Province, Country and Floor bosses. Elites are another category."),
 ], aliases={1: ["Neighborhood Boss", "Borough Boss", "City Boss", "Province Boss", "Country Boss", "Floor boss"]}),
E("Recap show", "Mechanic", [
  (1, "The crawl is broadcast as an immersive VR show; the recap episode replays the day's highlights."),
 ], aliases={1: ["recap episode"]}),
E("Leaderboard", "Mechanic", [
  (1, "The top-ten list of crawlers, which starts showing once the third level collapses."),
 ], aliases={2: ["top ten list"]}),
E("Bounty", "Mechanic", [
  (2, "The gold another crawler gets for killing someone on the top-ten list."),
  (8, "The bounty system is switched off on the 11th floor."),
 ]),
E("Soul Armor", "Mechanic", [
  (3, "A note in the Cookbook says the gods are Soul Armor: alien drivers wear them like clothes, so armor-stripping spells could in theory pull the drivers out."),
 ]),
E("Zero zone", "Mechanic", [
  (5, "An area with no enhancements at all; Carl feels weaker and his gauntlet won't form."),
 ]),
E("Exit deal", "Mechanic", [
  (5, "A negotiated way out of the crawl; Remex the Grand's is studied in law school."),
  (7, "After the 9th floor Quasar negotiates exit deals with Carl and other crawlers."),
 ], aliases={5: ["exit deals"]}),
]
