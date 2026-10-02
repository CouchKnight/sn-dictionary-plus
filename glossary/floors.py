# Floors of the World Dungeon — facts tagged by the book that first reveals
# them, summarised in our own words.
from model import E

FLOORS = [
E("First floor", "Floor 1", [
  (1, "The opening tutorial floor: a five-day countdown to find a staircase down before the level collapses."),
  (1, "Closed to live viewers, so view and follower counts stay at zero until the next floor."),
 ], aliases={1: ["1st floor"]}),
E("Second floor", "Floor 2", [
  (1, "Opens with just under 1.3 million crawlers and a six-day timer; viewers can now follow and favorite crawlers."),
 ], aliases={1: ["2nd floor"]}),
E("Third floor", "Floor 3", [
  (2, "Mordecai says the training levels are over and the real game begins. The floor is the Over City; crawlers choose their race and class here."),
 ], rel=[(2, "Over City.")], aliases={2: ["3rd floor"]}),
E("Fourth floor", "Floor 4", [
  (3, "The Iron Tangle, a huge train network; the trick is finding the stairwells."),
 ], rel=[(3, "Iron Tangle.")], aliases={3: ["4th floor"]}),
E("Fifth floor", "Floor 5", [
  (4, "Over a thousand self-contained bubbles, each split into Land, Sea, Air and Subterranean quadrants with a castle in each; capturing a castle's throne room opens its stairwell."),
 ], aliases={4: ["5th floor"]}),
E("Sixth floor", "Floor 6", [
  (5, "The Hunting Grounds, a Dungeon Crawler World tradition laid out like the 3rd floor, where off-world hunters stalk crawlers."),
 ], rel=[(5, "Hunting Grounds.")], aliases={5: ["6th floor"]}),
E("Seventh floor", "Floor 7", [
  (5, "A maze of tubes, hundreds of kilometers long, that pulls crawlers toward exit portals: no backtracking, branches marked by danger, pitstop saferooms at the nodes, and paths that close after use."),
 ], aliases={5: ["7th floor"]}),
E("Eighth floor", "Floor 8", [
  (6, "\"The Ghosts of Earth\": crawlers are spread over hundreds of regions, grouped into squads of up to five, and must fill their squads' spare slots within two weeks before phase two begins."),
 ], aliases={6: ["8th floor"]}),
E("Ninth floor", "Floor 9", [
  (7, "Faction Wars, fought over the city of Larracos."),
 ], rel=[(7, "Faction Wars; Larracos.")], aliases={7: ["9th floor"]}),
E("Tenth floor", "Floor 10", [
  (8, "A race run in heats: each crawler has a garage and a vehicle or creature that is repaired between heats and upgraded after each one. The level timer is suspended."),
 ], aliases={8: ["10th floor"]}),
E("Eleventh floor", "Floor 11", [
  (8, "Only 23 crawlers remain; the leaderboard and bounties are switched off, and the parade float staging area counts as a safe room."),
 ], aliases={8: ["11th floor"]}),
]
