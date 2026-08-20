import type { Term } from "./types";

/**
 * Reference terms, organized by topic. Add new terms here — each just needs
 * a unique `id`, a `topic` (see topics.ts for valid ids), a `term`, and a
 * `definition`. Nothing else in the app needs to change.
 */
export const TERMS: Term[] = [
  // ---------- Boat nomenclature ----------
  { id: "bow", topic: "nomenclature", term: "Bow", definition: "The front of the boat." },
  { id: "stern", topic: "nomenclature", term: "Stern", definition: "The back of the boat." },
  { id: "port", topic: "nomenclature", term: "Port", definition: "The left side of the boat, facing forward." },
  { id: "starboard", topic: "nomenclature", term: "Starboard", definition: "The right side of the boat, facing forward." },
  { id: "deck", topic: "nomenclature", term: "Deck", definition: "The flat outer surface you stand/walk on." },
  { id: "cabin-trunk", topic: "nomenclature", term: "Cabin Trunk", definition: "The raised structure over the cabin that provides headroom below." },
  { id: "cockpit", topic: "nomenclature", term: "Cockpit", definition: "The recessed area where the crew sits and steers." },
  { id: "tiller", topic: "nomenclature", term: "Tiller", definition: "The stick attached to the rudder used to steer the boat." },
  { id: "rudder", topic: "nomenclature", term: "Rudder", definition: "The underwater blade at the stern that steers the boat." },
  { id: "keel", topic: "nomenclature", term: "Keel", definition: "The fixed fin under the hull that provides ballast and resists sideways slipping." },
  { id: "hull", topic: "nomenclature", term: "Hull", definition: "The main body of the boat." },
  { id: "transom", topic: "nomenclature", term: "Transom", definition: "The flat (or curved) surface forming the stern." },
  { id: "companionway", topic: "nomenclature", term: "Companionway", definition: "The entryway/steps leading from the cockpit down into the cabin." },

  // ---------- Rig parts ----------
  { id: "mainsail", topic: "rig", term: "Mainsail", definition: "The primary sail, set on the mast and boom." },
  { id: "jib", topic: "rig", term: "Jib", definition: "The smaller sail set forward of the mast, on the forestay." },
  { id: "mast", topic: "rig", term: "Mast", definition: "The vertical spar that holds up the sails." },
  { id: "boom", topic: "rig", term: "Boom", definition: "The horizontal spar attached to the bottom of the mainsail." },
  { id: "spreader", topic: "rig", term: "Spreader", definition: "A strut that holds the shrouds out from the mast for support." },
  { id: "forestay", topic: "rig", term: "Forestay", definition: "The wire running from the bow to the top of the mast, holding it up from the front; the jib is set on it." },
  { id: "backstay", topic: "rig", term: "Backstay", definition: "The wire running from the stern to the top of the mast, holding it up from behind." },
  { id: "shrouds", topic: "rig", term: "Shrouds", definition: "The wires running from the sides of the boat to the mast, holding it up sideways." },
  { id: "mainsheet", topic: "rig", term: "Mainsheet", definition: "The line used to trim (control the angle of) the mainsail." },
  { id: "jib-sheets", topic: "rig", term: "Jib Sheets", definition: "The pair of lines (one per side) used to trim the jib." },
  { id: "halyards", topic: "rig", term: "Halyards", definition: "The lines used to raise (hoist) the sails — one for the main, one for the jib." },
  { id: "outhaul", topic: "rig", term: "Outhaul", definition: "The line that controls tension along the foot of the mainsail by pulling it toward the end of the boom." },
  { id: "downhaul", topic: "rig", term: "Downhaul", definition: "The line that controls luff tension by pulling the sail down along the mast/boom." },
  { id: "winch", topic: "rig", term: "Winch", definition: "A geared drum used to gain mechanical advantage when pulling in a line under load." },
  { id: "cam-cleat", topic: "rig", term: "Cam Cleat", definition: "A spring-loaded cleat with two cams that grip a line automatically when pulled in." },
  { id: "telltales", topic: "rig", term: "Telltales", definition: "Short pieces of yarn/ribbon on the sails that show airflow, used to fine-tune trim." },

  // ---------- Points of sail ----------
  { id: "no-go-zone", topic: "pointsOfSail", term: "Irons (No-Go Zone)", definition: "The arc directly into the wind (roughly 45° either side) where sails can't generate power; a boat pointed here will stall or luff." },
  { id: "close-reach", topic: "pointsOfSail", term: "Close Reach", definition: "The closest point of sail to the wind that still sails efficiently — sails trimmed in fairly tight." },
  { id: "beam-reach", topic: "pointsOfSail", term: "Beam Reach", definition: "Wind hitting the boat roughly at a right angle (from the side)." },
  { id: "broad-reach", topic: "pointsOfSail", term: "Broad Reach", definition: "Wind coming from behind and to one side — between beam reach and a run." },
  { id: "run", topic: "pointsOfSail", term: "Run", definition: "Sailing with the wind directly (or nearly) behind you; sails eased way out." },

  // ---------- Tacking vs. jibing ----------
  { id: "tack-maneuver", topic: "tackingJibing", term: "Tack (maneuver)", definition: "Turning the bow through the wind (through irons) to change which side the wind hits." },
  { id: "jibe", topic: "tackingJibing", term: "Jibe", definition: "Turning the stern through the wind (while sailing downwind) to change which side the wind hits; the boom swings across." },
  { id: "port-tack", topic: "tackingJibing", term: "Port Tack", definition: "Sailing with the wind hitting the port (left) side of the boat — boom typically out to starboard." },
  { id: "starboard-tack", topic: "tackingJibing", term: "Starboard Tack", definition: "Sailing with the wind hitting the starboard (right) side of the boat — boom typically out to port." },
  { id: "heading-up", topic: "tackingJibing", term: "Heading Up", definition: "Turning the bow toward the wind. Push the tiller away from you (toward the sail) → bow turns toward the wind." },
  { id: "falling-off", topic: "tackingJibing", term: "Falling Off", definition: "Turning the bow away from the wind. Pull the tiller in toward you (toward windward) → bow turns away from the wind. Also called 'bearing away.'" },

  // ---------- Sail trim ----------
  { id: "sheeting-in", topic: "sailTrim", term: "Sheeting In", definition: "Pulling a sheet in to trim the sail tighter/closer to the centerline — used as you head up or sail closer to the wind." },
  { id: "sheeting-out", topic: "sailTrim", term: "Sheeting Out / Easing", definition: "Letting a sheet out so the sail swings farther from the centerline — used as you fall off or sail farther from the wind." },
  { id: "safety-position", topic: "sailTrim", term: "Safety Position", definition: "Close reach with the mainsheet eased — depowers the boat, slows it down, and is a good 'reset' position if things get out of control." },

  // ---------- Right of way ----------
  { id: "avoid-collision", topic: "rightOfWay", term: "Avoid Collision At All Cost", definition: "Regardless of who technically has the right of way, every vessel must act to avoid a collision." },
  { id: "sail-over-power", topic: "rightOfWay", term: "Sailboats Over Powerboats", definition: "Under sail, a sailboat generally has right of way over a powerboat — except commercial vessels, vessels towing, and vessels restricted in their ability to maneuver." },
  { id: "starboard-over-port", topic: "rightOfWay", term: "Starboard Tack Over Port Tack", definition: "Between two sailboats, the boat on starboard tack (wind on the right) has right of way over a boat on port tack." },
  { id: "leeward-over-windward", topic: "rightOfWay", term: "Leeward Over Windward", definition: "Between two sailboats on the same tack, the leeward (downwind) boat has right of way over the windward boat." },
  { id: "overtaking-gives-way", topic: "rightOfWay", term: "Overtaking Vessel Gives Way", definition: "A vessel overtaking another from behind must keep clear, regardless of sail/power or tack." },

  // ---------- Docking / mooring / crew overboard ----------
  { id: "leaving-dock", topic: "dockingCOB", term: "Leaving the Dock", definition: "Check wind direction relative to the dock, rig fenders/lines, and plan a departure that lets the wind help (not fight) you clear the dock." },
  { id: "mooring", topic: "dockingCOB", term: "Picking Up a Mooring", definition: "Approach the mooring ball from downwind heading into the wind (like landing head-to-wind), slowing to a stop right at the ball." },
  { id: "crew-overboard", topic: "dockingCOB", term: "Crew Overboard (COB)", definition: "Immediately shout 'Crew overboard!', point continuously at the person, and begin a recovery maneuver (quick turn or figure-8) to return to them." },
  { id: "quick-turn", topic: "dockingCOB", term: "Quick-Turn (COB Recovery)", definition: "A COB recovery method: immediately head up into a tack, then bear away and jibe back to approach the person from downwind on a close reach." },
  { id: "figure-8", topic: "dockingCOB", term: "Figure-8 (COB Recovery)", definition: "A COB recovery method: sail away on a reach, then jibe and come back around to approach the person from downwind, tracing a figure-8 shape." },

  // ---------- Three Key Questions ----------
  { id: "q1-wind", topic: "threeKeyQuestions", term: "Where is the wind coming from?", definition: "The first key question — establish wind direction before anything else." },
  { id: "q2-point-of-sail", topic: "threeKeyQuestions", term: "What is my point of sail?", definition: "The second key question — know your heading relative to the wind." },
  { id: "q3-trim", topic: "threeKeyQuestions", term: "Are my sails trimmed properly?", definition: "The third key question — check trim for your current point of sail." },
  { id: "q4-changed", topic: "threeKeyQuestions", term: "Has anything changed since I started asking?", definition: "The bonus follow-up — wind shifts, so keep re-asking the three key questions continuously." },
];
