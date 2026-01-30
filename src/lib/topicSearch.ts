import type { DailyDownloadTopic } from '@/hooks/useTopics';

// Domain-specific semantic relations map
const semanticRelations: Record<string, string[]> = {
  // Microbiology
  "bacteria": ["bacterial", "microbial", "microbe", "cell", "gram", "pathogen", "prokaryote"],
  "virus": ["viral", "pathogen", "infection", "prion", "bacteriophage"],
  "cell": ["cellular", "membrane", "nucleus", "structure", "organelle", "cytoplasm"],
  "growth": ["growth phases", "reproduction", "division", "metabolism", "lag", "log", "exponential"],
  "microbe": ["microbial", "bacteria", "virus", "fungi", "pathogen"],
  "infection": ["infectious", "pathogen", "disease", "immune", "virus", "bacteria"],
  
  // Chemistry  
  "atom": ["atomic", "electron", "proton", "neutron", "nucleus", "ion", "orbital"],
  "molecule": ["molecular", "compound", "bond", "covalent", "ionic", "structure"],
  "reaction": ["reactions", "aqueous", "acid", "base", "oxidation", "reduction", "chemical"],
  "acid": ["acidic", "base", "pH", "buffer", "proton", "hydrogen"],
  "bond": ["bonding", "covalent", "ionic", "hydrogen", "molecular"],
  
  // Biology
  "protein": ["amino acid", "macromolecule", "enzyme", "structure", "polypeptide"],
  "respiration": ["cellular", "ATP", "metabolism", "energy", "glucose", "mitochondria"],
  "membrane": ["transport", "osmosis", "diffusion", "cell", "lipid", "bilayer"],
  "DNA": ["genetic", "nucleic acid", "gene", "chromosome", "replication", "RNA"],
  "enzyme": ["catalyst", "substrate", "protein", "reaction", "active site"],
  "photosynthesis": ["chlorophyll", "light", "glucose", "carbon", "plant"],
  
  // Physics
  "energy": ["work", "power", "kinetic", "potential", "conservation"],
  "force": ["newton", "acceleration", "mass", "momentum", "friction"],
  "wave": ["frequency", "wavelength", "amplitude", "sound", "light"],
  "electric": ["current", "voltage", "resistance", "circuit", "charge"],
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
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length >= 2); // Minimum 2 chars
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
  const bulletPoints = topic.flashSummary?.bulletPoints || [];
  
  keywords.forEach(keyword => {
    // Title exact match (whole word)
    const titleWordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (titleWordRegex.test(topic.title)) {
      score += 100;
      matchReasons.push(`Title contains "${keyword}"`);
    }
    // Title partial match
    else if (titleLower.includes(keyword)) {
      score += 50;
      matchReasons.push(`Title includes "${keyword}"`);
    }
    
    // Description keyword match
    if (descLower.includes(keyword)) {
      score += 25;
      matchReasons.push(`Description contains "${keyword}"`);
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
      if (titleLower.includes(term) && !titleLower.includes(keyword)) {
        score += 8;
        matchReasons.push(`Title has related term "${term}"`);
      }
      if (descLower.includes(term) && !descLower.includes(keyword)) {
        score += 5;
        matchReasons.push(`Description has related term "${term}"`);
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
