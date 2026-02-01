import type { DailyDownloadTopic } from '@/hooks/useTopics';

// Domain-specific semantic relations map - organized by subject area
const semanticRelations: Record<string, string[]> = {
  // ===== BIOLOGY =====
  // Cellular Processes
  "phosphorylation": ["ATP", "oxidative", "mitochondria", "electron transport", "respiration", "energy"],
  "respiration": ["cellular", "ATP", "metabolism", "energy", "glucose", "mitochondria", "oxidative"],
  "photosynthesis": ["chlorophyll", "light", "glucose", "carbon", "plant", "calvin", "chloroplast"],
  "calvin": ["cycle", "carbon fixation", "photosynthesis", "glucose", "rubisco", "CO2"],
  
  // Signal & Neural
  "signal": ["transduction", "receptor", "cascade", "pathway", "cell signaling", "response"],
  "transduction": ["signal", "receptor", "cascade", "kinase", "pathway"],
  "action": ["potential", "nerve", "neuron", "depolarization", "impulse", "axon", "membrane"],
  "potential": ["action", "nerve", "neuron", "voltage", "membrane", "resting"],
  "neuron": ["nerve", "axon", "dendrite", "synapse", "action potential", "impulse"],
  
  // Genetics & Evolution
  "epigenetics": ["methylation", "histone", "gene expression", "chromatin", "heritable", "DNA"],
  "recombination": ["genetic", "crossing over", "chromosome", "allele", "meiosis", "exchange"],
  "phylogenetics": ["evolution", "tree", "ancestry", "taxonomy", "clade", "species"],
  "hardy": ["weinberg", "equilibrium", "allele frequency", "population genetics", "evolution"],
  "weinberg": ["hardy", "equilibrium", "allele", "population", "genetics"],
  
  // Immunity
  "adaptive": ["immunity", "B cell", "T cell", "antibody", "antigen", "lymphocyte", "specific"],
  "immunity": ["immune", "antibody", "antigen", "pathogen", "defense", "adaptive", "innate"],
  "antibody": ["antigen", "B cell", "immunoglobulin", "immune", "adaptive"],
  
  // Homeostasis
  "homeostasis": ["feedback", "regulation", "balance", "equilibrium", "negative feedback", "stable"],
  "homeostatic": ["feedback", "regulation", "balance", "equilibrium", "control"],
  "feedback": ["negative", "positive", "loop", "regulation", "homeostasis", "control"],
  
  // ===== CHEMISTRY =====
  // Quantum & Atomic
  "quantum": ["orbital", "electron", "wave", "probability", "Schrodinger", "mechanical", "model"],
  "orbital": ["electron", "quantum", "shell", "subshell", "s", "p", "d", "f"],
  "electron": ["orbital", "shell", "valence", "configuration", "quantum", "bond"],
  
  // Thermodynamics
  "gibbs": ["free energy", "spontaneous", "thermodynamics", "enthalpy", "entropy", "delta G"],
  "thermodynamics": ["enthalpy", "entropy", "gibbs", "heat", "energy", "spontaneous"],
  "spontaneous": ["gibbs", "free energy", "entropy", "thermodynamics", "favorable"],
  
  // Structure & Bonding
  "stereochemistry": ["isomer", "chiral", "enantiomer", "configuration", "3D", "spatial", "optical"],
  "isomer": ["stereochemistry", "structural", "geometric", "optical", "chiral"],
  "molecular": ["orbital", "bonding", "antibonding", "HOMO", "LUMO", "hybridization", "MO"],
  "hybridization": ["sp", "sp2", "sp3", "orbital", "geometry", "bonding"],
  
  // Reactions
  "mechanism": ["reaction", "step", "intermediate", "arrow", "pathway", "elementary"],
  "equilibrium": ["reversible", "Le Chatelier", "Keq", "concentration", "dynamic", "constant"],
  "electrochemistry": ["redox", "galvanic", "electrolytic", "electrode", "voltage", "cell"],
  "redox": ["oxidation", "reduction", "electron transfer", "electrochemistry", "half reaction"],
  "titration": ["neutralization", "equivalence point", "indicator", "burette", "pH", "acid", "base"],
  
  // Spectroscopy
  "spectroscopy": ["absorption", "emission", "IR", "NMR", "UV", "Vis", "spectrum", "wavelength"],
  "spectrum": ["spectroscopy", "absorption", "emission", "wavelength", "frequency"],
  
  // Coordination Chemistry
  "crystal": ["field", "ligand", "splitting", "d orbital", "transition metal", "complex"],
  "ligand": ["crystal field", "coordination", "complex", "chelate", "donor"],
  
  // ===== MICROBIOLOGY =====
  // Genetics & Transfer
  "horizontal": ["gene transfer", "transformation", "transduction", "conjugation", "plasmid", "HGT"],
  "transformation": ["horizontal", "DNA uptake", "competence", "gene transfer"],
  "conjugation": ["plasmid", "pilus", "horizontal", "F factor", "gene transfer"],
  "phage": ["bacteriophage", "transduction", "horizontal", "gene transfer", "viral", "lytic"],
  
  // Viruses
  "viral": ["replication", "lytic", "lysogenic", "capsid", "host", "infection", "virus"],
  "lytic": ["lysogenic", "viral", "cycle", "burst", "phage", "replication"],
  "lysogenic": ["lytic", "prophage", "integration", "viral", "latent"],
  
  // Metabolism
  "microbial": ["metabolism", "fermentation", "respiration", "catabolism", "anabolism", "growth"],
  "fermentation": ["anaerobic", "lactic acid", "alcohol", "metabolism", "glycolysis"],
  
  // Resistance & Drugs
  "antibiotic": ["resistance", "efflux", "beta-lactamase", "mutation", "selection", "drug"],
  "resistance": ["antibiotic", "efflux pump", "enzyme", "mutation", "plasmid", "mechanism"],
  
  // Immune & Complement
  "complement": ["cascade", "MAC", "opsonization", "C3", "innate immunity", "lysis"],
  "opsonization": ["complement", "phagocytosis", "antibody", "coating"],
  
  // Growth
  "kinetics": ["growth curve", "lag phase", "log phase", "stationary", "death phase", "rate"],
  "growth": ["lag", "log", "exponential", "stationary", "death", "curve", "phase", "bacterial"],
  "lag": ["phase", "growth", "adaptation", "log", "exponential"],
  "exponential": ["log", "phase", "growth", "doubling", "generation"],
  
  // Survival & Spores
  "endospore": ["dormant", "survival", "Bacillus", "Clostridium", "heat resistant", "spore"],
  "spore": ["endospore", "dormant", "resistant", "germination", "survival"],
  
  // Communication
  "quorum": ["sensing", "biofilm", "autoinducer", "population density", "communication", "signaling"],
  "biofilm": ["quorum sensing", "matrix", "attachment", "community", "surface"],
  
  // Nitrogen & Metabolism
  "nitrogen": ["fixation", "nitrogenase", "ammonia", "legume", "rhizobium", "N2"],
  "fixation": ["nitrogen", "nitrogenase", "ammonia", "diazotroph", "nodule"],
  
  // Pathogenesis
  "virulence": ["pathogen", "toxin", "adhesin", "invasion", "colonization", "factor"],
  "pathogen": ["virulence", "disease", "infection", "host", "microbe", "bacteria", "virus"],
  "toxin": ["virulence", "exotoxin", "endotoxin", "poison", "pathogen"],
  
  // ===== GENERAL SCIENCE =====
  "ATP": ["energy", "adenosine triphosphate", "phosphorylation", "respiration", "metabolism"],
  "DNA": ["genetic", "nucleic acid", "gene", "chromosome", "replication", "RNA", "double helix"],
  "RNA": ["DNA", "transcription", "mRNA", "tRNA", "rRNA", "translation"],
  "protein": ["amino acid", "macromolecule", "enzyme", "structure", "polypeptide", "folding"],
  "enzyme": ["catalyst", "substrate", "protein", "reaction", "active site", "kinetics"],
  "cell": ["cellular", "membrane", "nucleus", "structure", "organelle", "cytoplasm"],
  "membrane": ["transport", "osmosis", "diffusion", "cell", "lipid", "bilayer", "phospholipid"],
  "energy": ["ATP", "work", "power", "kinetic", "potential", "metabolism"],
};

// Score thresholds
const DIRECT_HIT_THRESHOLD = 25;
const RELATED_THRESHOLD = 5;
const MAX_RELATED_RESULTS = 8;

export interface ScoredTopic {
  topic: DailyDownloadTopic;
  score: number;
  matchType: 'direct' | 'related';
  matchReasons: string[];
}

export interface SearchResults {
  directHits: ScoredTopic[];
  relatedTopics: ScoredTopic[];
  query: string;
}

/**
 * Normalize and extract keywords from a query
 */
function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
    .split(/\s+/)
    .filter(word => word.length >= 2); // Minimum 2 chars
}

/**
 * Check if a word matches as a prefix (for partial typing)
 */
function matchesPrefix(text: string, prefix: string): boolean {
  if (prefix.length < 3) return false; // Require 3+ chars for prefix matching
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => word.startsWith(prefix));
}

/**
 * Get semantically related terms for a keyword
 */
function getRelatedTerms(keyword: string): string[] {
  const related: Set<string> = new Set();
  const lowerKeyword = keyword.toLowerCase();
  
  // Direct lookup
  if (semanticRelations[lowerKeyword]) {
    semanticRelations[lowerKeyword].forEach(term => related.add(term.toLowerCase()));
  }
  
  // Reverse lookup - find keywords that have this term in their relations
  Object.entries(semanticRelations).forEach(([key, values]) => {
    if (values.some(v => v.toLowerCase().includes(lowerKeyword) || lowerKeyword.includes(v.toLowerCase()))) {
      related.add(key.toLowerCase());
    }
  });
  
  return Array.from(related);
}

/**
 * Calculate match score for a topic against a query
 */
function scoreTopic(
  topic: DailyDownloadTopic,
  keywords: string[],
  allTopics: DailyDownloadTopic[],
  directHitChapterIds: Set<string>
): ScoredTopic {
  let score = 0;
  const matchReasons: string[] = [];
  const titleLower = topic.title.toLowerCase();
  const descLower = topic.description.toLowerCase();
  const transcriptLower = topic.transcript?.toLowerCase() || '';
  const bulletPoints = topic.flashSummary?.bulletPoints || [];
  
  // Track matched keywords to avoid double-scoring
  const matchedInTitle = new Set<string>();
  const matchedInDesc = new Set<string>();
  const matchedInTranscript = new Set<string>();
  
  keywords.forEach(keyword => {
    // Title exact match (whole word)
    const titleWordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (titleWordRegex.test(topic.title)) {
      score += 100;
      matchReasons.push(`Title contains "${keyword}"`);
      matchedInTitle.add(keyword);
    }
    // Title partial match
    else if (titleLower.includes(keyword)) {
      score += 50;
      matchReasons.push(`Title includes "${keyword}"`);
      matchedInTitle.add(keyword);
    }
    // Title prefix match (for partial typing like "oxidativ")
    else if (matchesPrefix(titleLower, keyword)) {
      score += 40;
      matchReasons.push(`Title starts with "${keyword}"`);
      matchedInTitle.add(keyword);
    }
    
    // Description keyword match
    if (descLower.includes(keyword)) {
      score += 25;
      matchReasons.push(`Description contains "${keyword}"`);
      matchedInDesc.add(keyword);
    }
    // Description prefix match
    else if (matchesPrefix(descLower, keyword)) {
      score += 15;
      matchReasons.push(`Description word starts with "${keyword}"`);
      matchedInDesc.add(keyword);
    }
    
    // Transcript matching (new)
    if (transcriptLower && transcriptLower.includes(keyword)) {
      score += 15;
      matchReasons.push(`Transcript contains "${keyword}"`);
      matchedInTranscript.add(keyword);
    }
    
    // Bullet point matches
    bulletPoints.forEach((bullet, idx) => {
      if (bullet.toLowerCase().includes(keyword)) {
        score += 15;
        matchReasons.push(`Bullet ${idx + 1} mentions "${keyword}"`);
      }
    });
    
    // Semantic/synonym matches
    const relatedTerms = getRelatedTerms(keyword);
    relatedTerms.forEach(term => {
      // Only add semantic score if not already matched directly
      if (titleLower.includes(term) && !matchedInTitle.has(keyword)) {
        score += 8;
        matchReasons.push(`Title has related term "${term}"`);
      }
      if (descLower.includes(term) && !matchedInDesc.has(keyword)) {
        score += 5;
        matchReasons.push(`Description has related term "${term}"`);
      }
      if (transcriptLower && transcriptLower.includes(term) && !matchedInTranscript.has(keyword)) {
        score += 3;
        matchReasons.push(`Transcript has related term "${term}"`);
      }
    });
  });
  
  // Same chapter as a direct hit (semantic boost)
  if (directHitChapterIds.has(topic.chapterId) && score < DIRECT_HIT_THRESHOLD) {
    score += 10;
    matchReasons.push('Same chapter as direct hit');
  }
  
  const matchType: 'direct' | 'related' = score >= DIRECT_HIT_THRESHOLD ? 'direct' : 'related';
  
  return { topic, score, matchType, matchReasons };
}

/**
 * Main search function - returns categorized results
 */
export function searchTopics(
  query: string,
  topics: DailyDownloadTopic[]
): SearchResults {
  const trimmedQuery = query.trim();
  
  // Require minimum 2 characters
  if (trimmedQuery.length < 2) {
    return { directHits: [], relatedTopics: [], query: trimmedQuery };
  }
  
  const keywords = extractKeywords(trimmedQuery);
  
  if (keywords.length === 0) {
    return { directHits: [], relatedTopics: [], query: trimmedQuery };
  }
  
  // First pass: identify direct hits to get their chapter IDs
  const directHitChapterIds = new Set<string>();
  const initialScores: ScoredTopic[] = topics.map(topic => 
    scoreTopic(topic, keywords, topics, new Set())
  );
  
  initialScores
    .filter(s => s.score >= DIRECT_HIT_THRESHOLD)
    .forEach(s => directHitChapterIds.add(s.topic.chapterId));
  
  // Second pass: score all topics with chapter context
  const scoredTopics: ScoredTopic[] = topics.map(topic =>
    scoreTopic(topic, keywords, topics, directHitChapterIds)
  );
  
  // Categorize results
  const directHits = scoredTopics
    .filter(s => s.score >= DIRECT_HIT_THRESHOLD)
    .sort((a, b) => b.score - a.score);
  
  const directHitIds = new Set(directHits.map(s => s.topic.id));
  
  const relatedTopics = scoredTopics
    .filter(s => s.score >= RELATED_THRESHOLD && s.score < DIRECT_HIT_THRESHOLD)
    .filter(s => !directHitIds.has(s.topic.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RELATED_RESULTS);
  
  return { directHits, relatedTopics, query: trimmedQuery };
}

/**
 * Check if there are any results
 */
export function hasResults(results: SearchResults): boolean {
  return results.directHits.length > 0 || results.relatedTopics.length > 0;
}

/**
 * Get total result count
 */
export function getTotalResults(results: SearchResults): number {
  return results.directHits.length + results.relatedTopics.length;
}
