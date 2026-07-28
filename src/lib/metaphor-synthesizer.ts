// Metaphor & Imagery Synthesizer.
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
    tactile: ["cold coffee in paper cups", "shattered glass on marble", "frozen steering wheel", "torn notebook margins"],
    visual: ["headlights fading in rain", "silent iPhone notification", "empty backseat", "shadows on blinds"],
    atmospheric: ["3 AM fog", "echoing stairwell", "static on the radio", "breath turning to steam"],
    cultural: ["jaam mein zeher", "dard-e-jaan", "kettodhga dhoolu", "shamo-sehar lamhe"],
  },
  ambition: {
    tactile: ["fresh leather seat", "heavy brass keys", "sweat on gold chain", "crisp paper notes"],
    visual: ["penthouse skyline view", "stadium floodlights", "scratched Studio mic", "backend stack"],
    atmospheric: ["smoky studio booth", "engine rumble at midnight", "pre-show roar", "city hum at 4 AM"],
    cultural: ["gully se penthouse", "haq se claim", "bisi oota scene-u", "malum hai na"],
  },
  paranoid: {
    tactile: ["tinted glass", "cold metallic barrel", "sweaty palms", "locked deadbolt"],
    visual: ["flashing rear-view mirrors", "hoodie pulled low", "surveillance feed", "dark alleyway"],
    atmospheric: ["heavy silence", "sudden siren in distance", "flickering streetlamp", "ticking clock"],
    cultural: ["zeher tera gehra", "gothilla scene-u", "back against wall", "public pe nazar"],
  },
  reflective: {
    tactile: ["vintage cassette tape", "worn out sneakers", "pencil smudges", "old Polaroid edge"],
    visual: ["sunset over Brooklyn / Bengaluru", "dim studio lamp", "raindrops sliding on glass", "faded ink"],
    atmospheric: ["late night quiet", "hum of the tape deck", "cool autumn breeze", "scent of fresh rain"],
    cultural: ["neendein dhuaan", "rootha naseeb", "paata kaltivi", "lafzon ki heera-pheri"],
  },
};

export function synthesizeMetaphors(
  topic?: string,
  attitude?: string[],
  region?: string,
): MetaphorBlueprint {
  const primaryAttitude = (attitude && attitude[0]) ? attitude[0].toLowerCase() : "reflective";
  const bank = SENSORY_BANKS[primaryAttitude] || SENSORY_BANKS["reflective"];

  const wordplayConcepts = [
    `Double reading on '${topic || "the grind"}': physical distance vs emotional disconnect`,
    "Wordplay on 'pocket': rhythm pocket vs counting backend in pockets",
    "Contrast between outer luxury and inner tension",
  ];

  const regionNote = region?.includes("hinglish")
    ? "DESI HIP-HOP METAPHORS: blend poetic Hinglish (naseeb, zeher, raabta, aks) with street grit."
    : region?.includes("kanglish")
    ? "KANNADA RAP METAPHORS: blend street Kannada (macha, sariyaagi, scene-u, paata) with modern trap flex."
    : "METAPHORS: use concrete tactile details over abstract poetic fluff.";

  const promptInstructions = `
ARTISTIC METAPHOR & SENSORY BLUEPRINT:
- TACTILE IMAGERY: ${bank.tactile.slice(0, 3).join(" · ")}
- VISUAL & ATMOSPHERIC: ${bank.visual.slice(0, 2).join(" · ")} | ${bank.atmospheric.slice(0, 2).join(" · ")}
- CULTURAL METAPHORS: ${bank.cultural.join(" · ")}
- ${regionNote}
- NO GENERIC AI POETRY (no "tapestry of life", "echoes of time", "demons inside"). Use concrete items and real places.`;

  return {
    sensoryDomains: bank,
    wordplayConcepts,
    promptInstructions,
  };
}
