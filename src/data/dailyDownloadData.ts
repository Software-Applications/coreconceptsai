export interface FlashSummary {
  id: string;
  topicId: string;
  visualType: 'diagram' | 'formula' | 'analogy';
  visualContent: string;
  bulletPoints: [string, string, string];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyDownloadTopic {
  id: string;
  subjectId: number;
  chapterId: number;
  title: string;
  description: string;
  duration: string;
  audioUrl: string;
  flashSummary: FlashSummary;
}

export interface PinnedCard {
  id: string;
  flashSummary: FlashSummary;
  pinnedAt: string;
  topicTitle: string;
  subjectName: string;
}

export interface ActivePrompt {
  timestamp: number; // seconds into audio
  question: string;
  pauseDuration: number; // seconds to pause
}

// Mock audio topics organized by subject
export const dailyDownloadTopics: DailyDownloadTopic[] = [
  // Physics topics (subjectId: 1)
  {
    id: 'physics-newton-laws',
    subjectId: 1,
    chapterId: 1,
    title: "Newton's Three Laws of Motion",
    description: "Master the fundamental principles that govern how objects move and interact with forces.",
    duration: "10:32",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-newton-laws',
      topicId: 'physics-newton-laws',
      visualType: 'formula',
      visualContent: 'F = ma',
      bulletPoints: [
        "Objects stay still or keep moving unless a force acts on them (inertia)",
        "The harder you push something, the faster it accelerates - but heavier things need more push",
        "Every action has an equal and opposite reaction - like how rockets push gas down to go up"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'physics-energy-conservation',
    subjectId: 1,
    chapterId: 2,
    title: "Conservation of Energy",
    description: "Understand how energy transforms but never disappears in closed systems.",
    duration: "11:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-energy',
      topicId: 'physics-energy-conservation',
      visualType: 'diagram',
      visualContent: '⚡ KE + PE = Constant',
      bulletPoints: [
        "Energy can't be created or destroyed - only converted from one form to another",
        "A roller coaster trades height (potential energy) for speed (kinetic energy) as it drops",
        "In real life, some energy always converts to heat due to friction"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'physics-waves',
    subjectId: 1,
    chapterId: 3,
    title: "Wave Properties & Behavior",
    description: "Learn how waves carry energy through space and interact with matter.",
    duration: "9:48",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-waves',
      topicId: 'physics-waves',
      visualType: 'analogy',
      visualContent: '🌊 Waves = Energy Messengers',
      bulletPoints: [
        "Waves transfer energy without moving matter - like a stadium wave where people stay seated",
        "Wavelength is the distance between peaks; frequency is how many peaks pass per second",
        "When waves meet, they can add up (constructive) or cancel out (destructive)"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'physics-momentum',
    subjectId: 1,
    chapterId: 1,
    title: "Momentum & Collisions",
    description: "Explore how mass and velocity combine to create momentum in moving objects.",
    duration: "8:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-momentum',
      topicId: 'physics-momentum',
      visualType: 'formula',
      visualContent: 'p = mv',
      bulletPoints: [
        "Momentum is mass times velocity - a truck moving slowly can have more momentum than a fast bicycle",
        "In collisions, total momentum before equals total momentum after",
        "Elastic collisions conserve kinetic energy; inelastic collisions don't"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'physics-gravity',
    subjectId: 1,
    chapterId: 2,
    title: "Gravity & Free Fall",
    description: "Understand the universal force that keeps planets in orbit and objects grounded.",
    duration: "9:20",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-gravity',
      topicId: 'physics-gravity',
      visualType: 'formula',
      visualContent: 'g = 9.8 m/s²',
      bulletPoints: [
        "All objects fall at the same rate regardless of mass (ignoring air resistance)",
        "Gravity gets weaker with distance - it follows an inverse square law",
        "Weight is the force of gravity on mass: W = mg"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'physics-electricity',
    subjectId: 1,
    chapterId: 3,
    title: "Electric Circuits Basics",
    description: "Learn how current, voltage, and resistance work together in circuits.",
    duration: "11:50",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-electricity',
      topicId: 'physics-electricity',
      visualType: 'formula',
      visualContent: 'V = IR (Ohm\'s Law)',
      bulletPoints: [
        "Voltage is the push, current is the flow, resistance is the opposition",
        "Series circuits have one path; parallel circuits have multiple paths",
        "Power consumed = voltage × current (P = VI)"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'physics-waves',
    subjectId: 1,
    chapterId: 3,
    title: "Wave Properties & Behavior",
    description: "Learn how waves carry energy through space and interact with matter.",
    duration: "9:48",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-waves',
      topicId: 'physics-waves',
      visualType: 'analogy',
      visualContent: '🌊 Waves = Energy Messengers',
      bulletPoints: [
        "Waves transfer energy without moving matter - like a stadium wave where people stay seated",
        "Wavelength is the distance between peaks; frequency is how many peaks pass per second",
        "When waves meet, they can add up (constructive) or cancel out (destructive)"
      ],
      difficulty: 'easy'
    }
  },

  // Chemistry topics (subjectId: 2)
  {
    id: 'chem-periodic-trends',
    subjectId: 2,
    chapterId: 4,
    title: "Periodic Table Trends",
    description: "Discover the patterns that make the periodic table predictable and powerful.",
    duration: "12:05",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-periodic',
      topicId: 'chem-periodic-trends',
      visualType: 'diagram',
      visualContent: '📊 ← Electronegativity increases →',
      bulletPoints: [
        "Moving right across a period: atoms get smaller and hold electrons tighter",
        "Moving down a group: atoms get bigger and lose electrons more easily",
        "These trends explain why metals are on the left and nonmetals on the right"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-bonding',
    subjectId: 2,
    chapterId: 5,
    title: "Chemical Bonding Basics",
    description: "Understand why atoms stick together and how different bonds form.",
    duration: "10:55",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-bonding',
      topicId: 'chem-bonding',
      visualType: 'analogy',
      visualContent: '🤝 Bonds = Atomic Relationships',
      bulletPoints: [
        "Ionic bonds: one atom gives electrons to another (like a gift) - happens between metals and nonmetals",
        "Covalent bonds: atoms share electrons equally (like roommates) - happens between nonmetals",
        "The type of bond determines if a substance conducts electricity and its melting point"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'chem-reactions',
    subjectId: 2,
    chapterId: 6,
    title: "Balancing Chemical Reactions",
    description: "Master the art of balancing equations and understanding reaction types.",
    duration: "11:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-reactions',
      topicId: 'chem-reactions',
      visualType: 'formula',
      visualContent: 'Reactants → Products (atoms balanced)',
      bulletPoints: [
        "Atoms are never created or destroyed in a reaction - what goes in must come out",
        "Balance equations by adjusting coefficients, never subscripts",
        "Start with the most complex molecule, then balance elements that appear only once"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'chem-acids-bases',
    subjectId: 2,
    chapterId: 4,
    title: "Acids, Bases & pH Scale",
    description: "Learn how to measure and understand acidic and basic solutions.",
    duration: "9:40",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-acids',
      topicId: 'chem-acids-bases',
      visualType: 'diagram',
      visualContent: 'pH 0 ←→ 7 ←→ 14',
      bulletPoints: [
        "Acids donate H+ ions; bases accept H+ ions (or donate OH-)",
        "pH below 7 is acidic, above 7 is basic, exactly 7 is neutral",
        "Each pH unit represents a 10x difference in H+ concentration"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'chem-moles',
    subjectId: 2,
    chapterId: 5,
    title: "The Mole Concept",
    description: "Understand how chemists count atoms using Avogadro's number.",
    duration: "10:25",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-moles',
      topicId: 'chem-moles',
      visualType: 'formula',
      visualContent: '1 mol = 6.022 × 10²³',
      bulletPoints: [
        "A mole is just a counting unit - like a dozen, but for atoms (6.022 × 10²³)",
        "Molar mass = mass of one mole of a substance in grams",
        "Use moles to convert between mass, particles, and volume of gases"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-stoichiometry',
    subjectId: 2,
    chapterId: 6,
    title: "Stoichiometry Calculations",
    description: "Calculate reactant and product quantities in chemical reactions.",
    duration: "13:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-stoich',
      topicId: 'chem-stoichiometry',
      visualType: 'formula',
      visualContent: 'mol ratio = coefficient ratio',
      bulletPoints: [
        "Coefficients in balanced equations give mole ratios between substances",
        "Convert grams → moles → use ratio → convert back to grams",
        "Limiting reagent runs out first and determines max product"
      ],
      difficulty: 'hard'
    }
  },

  // Biology topics (subjectId: 3)
  {
    id: 'bio-cell-structure',
    subjectId: 3,
    chapterId: 7,
    title: "Cell Structure & Organelles",
    description: "Explore the tiny factories inside every living cell.",
    duration: "11:20",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-cell',
      topicId: 'bio-cell-structure',
      visualType: 'analogy',
      visualContent: '🏭 Cell = A Tiny Factory',
      bulletPoints: [
        "The nucleus is the control center (CEO's office) containing DNA instructions",
        "Mitochondria are power plants converting food into energy (ATP)",
        "The membrane is security - controlling what enters and leaves the cell"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'bio-dna-replication',
    subjectId: 3,
    chapterId: 8,
    title: "DNA Replication Process",
    description: "Learn how cells copy their genetic blueprint with incredible accuracy.",
    duration: "12:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-dna',
      topicId: 'bio-dna-replication',
      visualType: 'diagram',
      visualContent: '🧬 A-T, G-C Base Pairing',
      bulletPoints: [
        "DNA unzips like a zipper, with each strand serving as a template for a new copy",
        "Base pairing rules (A with T, G with C) ensure accuracy",
        "Enzymes like helicase unwind and DNA polymerase builds the new strand"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'bio-photosynthesis',
    subjectId: 3,
    chapterId: 9,
    title: "Photosynthesis Explained",
    description: "Understand how plants convert sunlight into food and oxygen.",
    duration: "10:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-photo',
      topicId: 'bio-photosynthesis',
      visualType: 'formula',
      visualContent: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂',
      bulletPoints: [
        "Plants capture sunlight energy and store it as sugar (glucose)",
        "Light reactions happen in thylakoids: water splits, oxygen releases, ATP forms",
        "Dark reactions (Calvin cycle) in stroma: CO₂ becomes glucose using ATP"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'bio-mitosis',
    subjectId: 3,
    chapterId: 7,
    title: "Mitosis & Cell Division",
    description: "Discover how cells divide to create identical copies of themselves.",
    duration: "10:50",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-mitosis',
      topicId: 'bio-mitosis',
      visualType: 'diagram',
      visualContent: '🔄 PMAT: Prophase → Metaphase → Anaphase → Telophase',
      bulletPoints: [
        "Mitosis creates two identical daughter cells for growth and repair",
        "Chromosomes line up in the middle, then get pulled apart to opposite ends",
        "Cytokinesis splits the cytoplasm after the nucleus divides"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'bio-respiration',
    subjectId: 3,
    chapterId: 8,
    title: "Cellular Respiration",
    description: "Learn how cells break down glucose to release usable energy.",
    duration: "11:35",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-respiration',
      topicId: 'bio-respiration',
      visualType: 'formula',
      visualContent: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP',
      bulletPoints: [
        "Respiration is the reverse of photosynthesis - breaks glucose to release energy",
        "Glycolysis happens in cytoplasm; Krebs cycle and ETC in mitochondria",
        "One glucose molecule can produce up to 36-38 ATP molecules"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'bio-genetics',
    subjectId: 3,
    chapterId: 9,
    title: "Mendelian Genetics",
    description: "Understand how traits are inherited from parents to offspring.",
    duration: "12:10",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-genetics',
      topicId: 'bio-genetics',
      visualType: 'diagram',
      visualContent: '🧬 Punnett Square',
      bulletPoints: [
        "Dominant alleles (capital letters) mask recessive alleles (lowercase)",
        "Genotype is the genetic makeup; phenotype is the physical expression",
        "Use Punnett squares to predict offspring ratios"
      ],
      difficulty: 'medium'
    }
  }
];

// Get topics by subject
export const getTopicsBySubject = (subjectId: number): DailyDownloadTopic[] => {
  return dailyDownloadTopics.filter(topic => topic.subjectId === subjectId);
};

// Get topic by ID
export const getTopicById = (topicId: string): DailyDownloadTopic | undefined => {
  return dailyDownloadTopics.find(topic => topic.id === topicId);
};
