// Metaphor & Imagery Synthesizer 2.0.
//
// Maps song topics and attitudes into concrete sensory domains:
//   - Tactile textures (cold coffee, wet pavement, vintage leather, velvet curtains)
//   - Visual/Atmospheric settings (neon shadows, fogged glass, stadium floodlights, midnight rain)
//   - Cultural & Street metaphors (Desi Hip-Hop, Kannada urban imagery, luxury vs struggle)
//   - Double-entendre wordplay blueprints

export type MetaphorBlueprint = {
  sensoryDomains: {
    tactile: string[];
    visual: string[];
    atmospheric: string[];
    cultural: string[];
  };
  wordplayConcepts: string[];
  promptInstructions: string;
};

const SENSORY_BANKS: Record<string, MetaphorBlueprint["sensoryDomains"]> = {
  heartbreak: {
    tactile: ["cold brass filter coffee tumbler", "shattered glass on marble", "frozen steering wheel", "torn notebook margins"],
    visual: ["headlights fading in rain", "silent phone notification", "empty backseat", "shadows on blinds"],
    atmospheric: ["3 AM monsoon fog", "echoing stairwell", "static on the monitor", "breath turning to steam"],
    cultural: ["jaam mein zeher", "dard-e-jaan", "kettodhga dhoolu", "shamo-sehar lamhe", "rootha naseeb"],
  },
  ambition: {
    tactile: ["fresh leather seat", "heavy brass keys", "sweat on silver curb chain", "crisp bank slips"],
    visual: ["penthouse skyline view", "stadium floodlights", "scratched Neumann mic", "backend royalty check"],
    atmospheric: ["smoky studio booth", "engine rumble at midnight", "pre-show roar", "city hum at 4 AM"],
    cultural: ["gully se penthouse", "haq se claim", "bisi oota scene-u", "malum hai na", "bantai ki public"],
  },
  paranoid: {
    tactile: ["tinted glass", "cold metallic barrel", "sweaty palms on steering", "locked deadbolt"],
    visual: ["flashing rear-view mirrors", "hoodie pulled low", "surveillance feed", "dark alleyway shadows"],
    atmospheric: ["heavy silence", "sudden siren in distance", "flickering streetlamp", "ticking taxi meter"],
    cultural: ["zeher tera gehra", "gothilla scene-u", "back against wall", "public pe nazar", "shana banke"],
  },
  reflective: {
    tactile: ["vintage cassette tape", "worn out sneakers", "pencil smudges", "old Polaroid edge"],
    visual: ["sunset over Bengaluru / Mumbai", "dim studio lamp", "raindrops sliding on glass", "faded ink lines"],
    atmospheric: ["late night quiet", "hum of the tape deck", "cool autumn breeze", "scent of fresh monsoon rain"],
    cultural: ["neendein dhuaan", "rootha naseeb", "paata kaltivi", "lafzon ki heera-pheri", "kastoori dharani"],
  },
};

const KANGLISH_SENSORY: MetaphorBlueprint["sensoryDomains"] = {
  tactile: [
    "cold brass filter coffee tumbler",
    "grease on green auto steering wheel",
    "heavy Mysore silk bomber jacket",
    "raindrops on helmet visor",
    "rough granite temple steps"
  ],
  visual: [
    "Majestic bus terminal neon signs",
    "morning mist rolling over Nandi hills",
    "flickering fluorescent tube in VV Puram food street",
    "graffiti murals on Church Street walls",
    "rain-soaked yellow gulmohar petals"
  ],
  atmospheric: [
    "petrichor of Western Ghats monsoon",
    "roar of modified two-stroke auto exhausts",
    "temple bell echo vibrating through 808 sub-bass",
    "quiet midnight chill near Vidhana Soudha"
  ],
  cultural: [
    "bisi oota scene-u",
    "kastoori gandha",
    "paata kaltivi illi",
    "kettodhga dhoolu",
    "macha kottu pacha",
    "namma bengaluru vibe"
  ],
};

const HINGLISH_SENSORY: MetaphorBlueprint["sensoryDomains"] = {
  tactile: [
    "cold steel handrail of Mumbai local train",
    "frayed acoustic booth foam",
    "sweat under silver curb link chain",
    "cutting chai in thick ribbed glass",
    "wet asphalt under worn sneakers"
  ],
  visual: [
    "Kurla/Dharavi neon reflections in midnight puddles",
    "winter smog enveloping Delhi Connaught Place colonnades",
    "scratched analog VU meter needles",
    "red tail-lights gridlocked under flyovers",
    "smoke rings drifting past terrace parapets"
  ],
  atmospheric: [
    "clattering rhythm of local train tracks at 2 AM",
    "distant siren echoing down narrow gully",
    "hiss of tea stall boiler at dawn",
    "dense smoke lingering in cramped basement studio"
  ],
  cultural: [
    "gully se penthouse",
    "haq se claim",
    "zeher tera gehra",
    "lafzon ki heera-pheri",
    "bantai ki public",
    "wajood ki dastaan"
  ],
};

export function synthesizeMetaphors(
  topic?: string,
  attitude?: string[],
  region?: string,
): MetaphorBlueprint {
  const primaryAttitude = (attitude && attitude[0]) ? attitude[0].toLowerCase() : "reflective";
  const base = SENSORY_BANKS[primaryAttitude] || SENSORY_BANKS["reflective"];

  const reg = (region || "").toLowerCase();
  const isKanglish = reg.includes("kanglish") || reg.includes("kannada");
  const isHinglish = reg.includes("hinglish") || reg.includes("hindi");
  const isBlended = (isKanglish && isHinglish) || reg.includes("blend");

  let tactile = [...base.tactile];
  let visual = [...base.visual];
  let atmospheric = [...base.atmospheric];
  let cultural = [...base.cultural];
  let regionDirective = "METAPHORS: use concrete tactile details over abstract poetic fluff.";

  if (isBlended) {
    tactile = [...KANGLISH_SENSORY.tactile.slice(0, 2), ...HINGLISH_SENSORY.tactile.slice(0, 2)];
    visual = [...KANGLISH_SENSORY.visual.slice(0, 2), ...HINGLISH_SENSORY.visual.slice(0, 2)];
    atmospheric = [...KANGLISH_SENSORY.atmospheric.slice(0, 2), ...HINGLISH_SENSORY.atmospheric.slice(0, 2)];
    cultural = [...KANGLISH_SENSORY.cultural.slice(0, 3), ...HINGLISH_SENSORY.cultural.slice(0, 3)];
    regionDirective = "BILINGUAL CODE-SWITCH METAPHORS: blend Bengaluru streetscapes (Majestic, filter coffee, bisi oota) with DHH Gully grit (Mumbai local, cutting chai, haq se).";
  } else if (isKanglish) {
    tactile = [...KANGLISH_SENSORY.tactile.slice(0, 3), base.tactile[0]];
    visual = [...KANGLISH_SENSORY.visual.slice(0, 3), base.visual[0]];
    atmospheric = [...KANGLISH_SENSORY.atmospheric.slice(0, 3), base.atmospheric[0]];
    cultural = [...KANGLISH_SENSORY.cultural];
    regionDirective = "KANNADA RAP METAPHORS: blend Bengaluru street realism (Majestic, filter coffee, macha, scene-u, paata) with modern trap cadence. Zero diacritics.";
  } else if (isHinglish) {
    tactile = [...HINGLISH_SENSORY.tactile.slice(0, 3), base.tactile[0]];
    visual = [...HINGLISH_SENSORY.visual.slice(0, 3), base.visual[0]];
    atmospheric = [...HINGLISH_SENSORY.atmospheric.slice(0, 3), base.atmospheric[0]];
    cultural = [...HINGLISH_SENSORY.cultural];
    regionDirective = "DESI HIP-HOP METAPHORS: blend poetic Urdu/Hinglish depth (naseeb, zeher, wajood, rooh) with raw DHH street grit (gully, bantai, haq se). Zero diacritics.";
  }

  const wordplayConcepts = [
    `Double reading on '${topic || "the grind"}': physical distance vs emotional disconnect`,
    "Wordplay on 'pocket': rhythm pocket vs counting cash in pockets",
    "Contrast between street roots and studio elevation",
  ];

  const promptInstructions = `
ARTISTIC METAPHOR & SENSORY BLUEPRINT:
- TACTILE IMAGERY: ${tactile.slice(0, 3).join(" · ")}
- VISUAL & ATMOSPHERIC: ${visual.slice(0, 2).join(" · ")} | ${atmospheric.slice(0, 2).join(" · ")}
- CULTURAL METAPHORS: ${cultural.slice(0, 4).join(" · ")}
- ${regionDirective}
- NO GENERIC AI POETRY (no "tapestry of life", "echoes of time", "demons inside"). Use concrete items and real places.`;

  return {
    sensoryDomains: { tactile, visual, atmospheric, cultural },
    wordplayConcepts,
    promptInstructions,
  };
}
