export interface FlashSummary {
  id: string;
  topicId: string;
  visualType: 'diagram' | 'formula' | 'analogy';
  visualContent: string;
  bulletPoints: [string, string, string];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
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
  transcript?: TranscriptSegment[];
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
  // Microbiology topics (subjectId: 1) - chapters 1-8
  {
    id: 'micro-intro',
    subjectId: 1,
    chapterId: 1,
    title: "Introduction to Microbiology",
    description: "Explore the microscopic world and learn about different types of microorganisms.",
    duration: "10:32",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-micro-intro',
      topicId: 'micro-intro',
      visualType: 'diagram',
      visualContent: '🔬 Bacteria, Viruses, Fungi, Protozoa',
      bulletPoints: [
        "Microorganisms are everywhere - in soil, water, air, and inside our bodies",
        "Bacteria are single-celled organisms with no nucleus (prokaryotes)",
        "Viruses are not truly alive - they need host cells to reproduce"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'micro-history',
    subjectId: 1,
    chapterId: 1,
    title: "History of Microbiology",
    description: "From Leeuwenhoek to modern genetics - the journey of discovery.",
    duration: "9:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-micro-history',
      topicId: 'micro-history',
      visualType: 'analogy',
      visualContent: '📜 Germ Theory Revolution',
      bulletPoints: [
        "Leeuwenhoek first observed 'animalcules' with his handmade microscopes",
        "Pasteur disproved spontaneous generation and developed pasteurization",
        "Koch's postulates established how to prove a microbe causes disease"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'micro-cell-structure',
    subjectId: 1,
    chapterId: 2,
    title: "Bacterial Cell Structure",
    description: "Learn the key components that make up bacterial cells.",
    duration: "11:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-cell-struct',
      topicId: 'micro-cell-structure',
      visualType: 'diagram',
      visualContent: '🦠 Cell Wall → Membrane → Cytoplasm',
      bulletPoints: [
        "The cell wall provides shape and protection - differs between gram+ and gram-",
        "Flagella enable movement; pili help attach to surfaces and transfer DNA",
        "Ribosomes are smaller (70S) than eukaryotic ones - key for antibiotic targeting"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'micro-gram-staining',
    subjectId: 1,
    chapterId: 2,
    title: "Gram Staining Technique",
    description: "Master the essential lab technique for classifying bacteria.",
    duration: "8:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-gram-stain',
      topicId: 'micro-gram-staining',
      visualType: 'diagram',
      visualContent: '🟣 Gram+ Purple | 🔴 Gram- Pink',
      bulletPoints: [
        "Crystal violet stains all cells purple initially",
        "Alcohol decolorizes thin-walled Gram-negative cells",
        "Safranin counterstain makes Gram-negative cells appear pink"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'micro-genetics',
    subjectId: 1,
    chapterId: 3,
    title: "Bacterial Genetics",
    description: "How bacteria replicate, mutate, and share genetic information.",
    duration: "12:20",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-bac-genetics',
      topicId: 'micro-genetics',
      visualType: 'diagram',
      visualContent: '🧬 Chromosome + Plasmids',
      bulletPoints: [
        "Bacteria have a single circular chromosome plus extra plasmids",
        "Horizontal gene transfer spreads antibiotic resistance rapidly",
        "Transformation, transduction, and conjugation are three ways bacteria share DNA"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'micro-metabolism',
    subjectId: 1,
    chapterId: 4,
    title: "Microbial Metabolism",
    description: "How microbes obtain energy and build cellular components.",
    duration: "13:10",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-metabolism',
      topicId: 'micro-metabolism',
      visualType: 'formula',
      visualContent: 'ATP = Cellular Energy Currency',
      bulletPoints: [
        "Autotrophs make their own food; heterotrophs consume organic compounds",
        "Aerobic respiration yields ~38 ATP; fermentation yields only 2 ATP",
        "Some bacteria use unique pathways like chemolithotrophy"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'micro-growth',
    subjectId: 1,
    chapterId: 5,
    title: "Bacterial Growth Phases",
    description: "Understand the four phases of bacterial population growth.",
    duration: "9:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-growth',
      topicId: 'micro-growth',
      visualType: 'diagram',
      visualContent: '📈 Lag → Log → Stationary → Death',
      bulletPoints: [
        "Lag phase: bacteria adapt to new environment, no division yet",
        "Log phase: exponential growth with constant generation time",
        "Stationary phase: nutrients deplete, growth equals death rate"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'micro-growth-factors',
    subjectId: 1,
    chapterId: 5,
    title: "Growth Requirements",
    description: "What bacteria need to survive and multiply.",
    duration: "10:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-growth-req',
      topicId: 'micro-growth-factors',
      visualType: 'diagram',
      visualContent: '🌡️ Temperature + pH + Oxygen',
      bulletPoints: [
        "Most pathogens are mesophiles (grow at 20-40°C body temperature)",
        "pH affects enzyme function - most bacteria prefer neutral pH",
        "Aerobes need O₂; anaerobes are killed by it; facultatives can use both"
      ],
      difficulty: 'medium'
    }
  },

  // Chemistry topics (subjectId: 2) - chapters 9-15
  {
    id: 'chem-matter',
    subjectId: 2,
    chapterId: 9,
    title: "Matter and Measurements",
    description: "Foundations of chemistry - what matter is and how we measure it.",
    duration: "10:05",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-matter',
      topicId: 'chem-matter',
      visualType: 'diagram',
      visualContent: '⚗️ Solid ↔ Liquid ↔ Gas',
      bulletPoints: [
        "Matter is anything with mass and volume - exists in three main states",
        "Physical changes don't alter chemical composition; chemical changes do",
        "SI units provide a universal measurement system for science"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'chem-sig-figs',
    subjectId: 2,
    chapterId: 9,
    title: "Significant Figures",
    description: "How to express precision in scientific measurements.",
    duration: "8:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-sig-figs',
      topicId: 'chem-sig-figs',
      visualType: 'formula',
      visualContent: '0.00340 = 3 sig figs',
      bulletPoints: [
        "Leading zeros are never significant; trailing zeros after decimal are",
        "In multiplication/division, answer has fewest sig figs of inputs",
        "In addition/subtraction, answer matches fewest decimal places"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-atomic-structure',
    subjectId: 2,
    chapterId: 10,
    title: "Atomic Structure",
    description: "Protons, neutrons, electrons - the building blocks of atoms.",
    duration: "11:20",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-atomic',
      topicId: 'chem-atomic-structure',
      visualType: 'diagram',
      visualContent: '⚛️ Nucleus: p⁺ + n⁰ | Shell: e⁻',
      bulletPoints: [
        "Protons determine element identity; electrons determine chemistry",
        "Isotopes have same protons but different neutrons",
        "Atomic mass is weighted average of all natural isotopes"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-ions',
    subjectId: 2,
    chapterId: 10,
    title: "Ions and Ionic Compounds",
    description: "How atoms gain or lose electrons to form charged particles.",
    duration: "10:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-ions',
      topicId: 'chem-ions',
      visualType: 'analogy',
      visualContent: '🔋 Cations (+) give | Anions (-) take',
      bulletPoints: [
        "Metals lose electrons to form positive cations",
        "Nonmetals gain electrons to form negative anions",
        "Ionic compounds are neutral - charges must balance"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'chem-stoichiometry',
    subjectId: 2,
    chapterId: 11,
    title: "Stoichiometry Basics",
    description: "Calculate quantities in chemical reactions using mole ratios.",
    duration: "13:15",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-stoich',
      topicId: 'chem-stoichiometry',
      visualType: 'formula',
      visualContent: 'mol ratio = coefficient ratio',
      bulletPoints: [
        "Coefficients in balanced equations give mole ratios",
        "Convert grams → moles → use ratio → convert back",
        "Limiting reagent determines maximum product yield"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'chem-moles',
    subjectId: 2,
    chapterId: 11,
    title: "The Mole Concept",
    description: "Avogadro's number and counting atoms by weighing.",
    duration: "10:50",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-moles',
      topicId: 'chem-moles',
      visualType: 'formula',
      visualContent: '1 mol = 6.022 × 10²³ particles',
      bulletPoints: [
        "A mole is a counting unit - 6.022 × 10²³ of anything",
        "Molar mass equals atomic mass in grams per mole",
        "Moles bridge the gap between atoms and grams"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-reactions',
    subjectId: 2,
    chapterId: 12,
    title: "Reactions in Solution",
    description: "How reactions occur when substances dissolve in water.",
    duration: "11:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-reactions',
      topicId: 'chem-reactions',
      visualType: 'diagram',
      visualContent: '💧 Precipitation, Acid-Base, Redox',
      bulletPoints: [
        "Soluble compounds dissociate into ions in water",
        "Precipitation occurs when insoluble products form",
        "Net ionic equations show only species that react"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'chem-acids-bases',
    subjectId: 2,
    chapterId: 12,
    title: "Acids and Bases",
    description: "Understanding pH and acid-base reactions.",
    duration: "12:05",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-acids',
      topicId: 'chem-acids-bases',
      visualType: 'diagram',
      visualContent: 'pH 0 ←→ 7 ←→ 14',
      bulletPoints: [
        "Acids donate H⁺; bases accept H⁺ (Brønsted-Lowry)",
        "pH = -log[H⁺]; each unit is 10× difference",
        "Neutralization: acid + base → salt + water"
      ],
      difficulty: 'medium'
    }
  },

  // Biology topics (subjectId: 3) - chapters 16-23
  {
    id: 'bio-study-of-life',
    subjectId: 3,
    chapterId: 16,
    title: "The Study of Life",
    description: "What defines life and how biologists study living things.",
    duration: "9:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-life',
      topicId: 'bio-study-of-life',
      visualType: 'diagram',
      visualContent: '🌱 7 Characteristics of Life',
      bulletPoints: [
        "Living things: grow, reproduce, respond, use energy, maintain homeostasis",
        "Biology uses scientific method: observe, hypothesize, experiment, conclude",
        "Life is organized in levels: atoms → cells → organisms → ecosystems"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'bio-scientific-method',
    subjectId: 3,
    chapterId: 16,
    title: "Scientific Method",
    description: "How biologists design experiments and test hypotheses.",
    duration: "8:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-sci-method',
      topicId: 'bio-scientific-method',
      visualType: 'diagram',
      visualContent: '🔬 Question → Hypothesis → Experiment → Analyze',
      bulletPoints: [
        "A hypothesis is a testable prediction based on observation",
        "Control groups eliminate variables except the one being tested",
        "Theories are well-supported explanations; laws describe patterns"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'bio-chemistry',
    subjectId: 3,
    chapterId: 17,
    title: "Chemistry of Life",
    description: "Water, carbon, and the chemical basis of living systems.",
    duration: "11:20",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-bio-chem',
      topicId: 'bio-chemistry',
      visualType: 'analogy',
      visualContent: '💧 Water = Universal Solvent',
      bulletPoints: [
        "Water's polarity makes it excellent for dissolving ionic compounds",
        "Hydrogen bonds give water high specific heat and surface tension",
        "Carbon's 4 bonds allow complex organic molecule construction"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'bio-macromolecules',
    subjectId: 3,
    chapterId: 18,
    title: "Biological Macromolecules",
    description: "Carbohydrates, lipids, proteins, and nucleic acids.",
    duration: "13:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-macro',
      topicId: 'bio-macromolecules',
      visualType: 'diagram',
      visualContent: '🧬 Carbs, Lipids, Proteins, Nucleic Acids',
      bulletPoints: [
        "Carbohydrates store energy (starch) and provide structure (cellulose)",
        "Proteins are polymers of amino acids; shape determines function",
        "Nucleic acids (DNA/RNA) store and transmit genetic information"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'bio-proteins',
    subjectId: 3,
    chapterId: 18,
    title: "Protein Structure",
    description: "From amino acids to functional 3D proteins.",
    duration: "12:10",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-proteins',
      topicId: 'bio-proteins',
      visualType: 'diagram',
      visualContent: '🔗 Primary → Secondary → Tertiary → Quaternary',
      bulletPoints: [
        "Primary structure is the amino acid sequence",
        "Secondary structures (α-helix, β-sheet) form from hydrogen bonds",
        "Tertiary structure is the final 3D folded shape"
      ],
      difficulty: 'hard'
    }
  },
  {
    id: 'bio-cell-structure',
    subjectId: 3,
    chapterId: 19,
    title: "Cell Structure",
    description: "Organelles and their functions in eukaryotic cells.",
    duration: "11:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-cell',
      topicId: 'bio-cell-structure',
      visualType: 'analogy',
      visualContent: '🏭 Cell = Microscopic Factory',
      bulletPoints: [
        "Nucleus houses DNA; ribosomes build proteins",
        "Mitochondria are powerhouses producing ATP",
        "ER and Golgi process and ship proteins"
      ],
      difficulty: 'easy'
    }
  },
  {
    id: 'bio-cell-membrane',
    subjectId: 3,
    chapterId: 20,
    title: "Cell Membrane Transport",
    description: "How substances move in and out of cells.",
    duration: "10:45",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-membrane',
      topicId: 'bio-cell-membrane',
      visualType: 'diagram',
      visualContent: '🚪 Passive vs Active Transport',
      bulletPoints: [
        "Passive transport requires no energy - diffusion and osmosis",
        "Active transport uses ATP to move against concentration gradient",
        "Endocytosis brings large particles in; exocytosis pushes them out"
      ],
      difficulty: 'medium'
    }
  },
  {
    id: 'bio-respiration',
    subjectId: 3,
    chapterId: 22,
    title: "Cellular Respiration",
    description: "How cells extract energy from glucose.",
    duration: "12:30",
    audioUrl: "/mock-audio.mp3",
    flashSummary: {
      id: 'fs-respiration',
      topicId: 'bio-respiration',
      visualType: 'formula',
      visualContent: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP',
      bulletPoints: [
        "Glycolysis in cytoplasm yields 2 ATP and pyruvate",
        "Krebs cycle in mitochondria produces electron carriers",
        "Electron transport chain generates most ATP (~34)"
      ],
      difficulty: 'hard'
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

// Generate mock transcript for a topic based on its content
export const generateMockTranscript = (topic: DailyDownloadTopic): TranscriptSegment[] => {
  const durationParts = topic.duration.split(':');
  const totalSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
  
  // Create transcript segments based on topic content
  const segments: TranscriptSegment[] = [];
  const segmentDuration = 15; // Each segment is about 15 seconds
  const numSegments = Math.ceil(totalSeconds / segmentDuration);
  
  // Introduction
  segments.push({
    id: `${topic.id}-0`,
    startTime: 0,
    endTime: 15,
    text: `Welcome to today's Daily Download. We're going to explore ${topic.title}. ${topic.description}`
  });
  
  // Content based on flash summary bullet points
  const bulletPoints = topic.flashSummary.bulletPoints;
  bulletPoints.forEach((point, index) => {
    const startTime = 15 + (index * segmentDuration * 3);
    segments.push({
      id: `${topic.id}-${index + 1}a`,
      startTime,
      endTime: startTime + segmentDuration,
      text: `Let's talk about our ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'} key concept. ${point}`
    });
    segments.push({
      id: `${topic.id}-${index + 1}b`,
      startTime: startTime + segmentDuration,
      endTime: startTime + segmentDuration * 2,
      text: `This is really important to understand because it forms the foundation of how we approach this topic in practice.`
    });
    segments.push({
      id: `${topic.id}-${index + 1}c`,
      startTime: startTime + segmentDuration * 2,
      endTime: startTime + segmentDuration * 3,
      text: `Take a moment to think about how this concept connects to what you already know about the subject.`
    });
  });
  
  // Add some filler content
  const midPoint = Math.floor(numSegments / 2) * segmentDuration;
  segments.push({
    id: `${topic.id}-mid`,
    startTime: midPoint,
    endTime: midPoint + segmentDuration,
    text: `Now that we've covered the basics, let's dive deeper into the practical applications and real-world examples.`
  });
  
  // Conclusion
  segments.push({
    id: `${topic.id}-end`,
    startTime: totalSeconds - 30,
    endTime: totalSeconds - 15,
    text: `To summarize what we've learned: ${topic.flashSummary.bulletPoints[0].split(' - ')[0]}, and the key principles we discussed.`
  });
  
  segments.push({
    id: `${topic.id}-outro`,
    startTime: totalSeconds - 15,
    endTime: totalSeconds,
    text: `That's all for today's Daily Download on ${topic.title}. Great job! Don't forget to review the flash card summary.`
  });
  
  // Sort by start time and remove duplicates
  return segments
    .sort((a, b) => a.startTime - b.startTime)
    .filter((seg, index, arr) => 
      index === 0 || seg.startTime !== arr[index - 1].startTime
    );
};
