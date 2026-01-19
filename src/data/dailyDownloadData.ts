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
