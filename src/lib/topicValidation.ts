/**
 * Topic request validation utilities
 * Validates topic requests for clarity and subject relevance
 */

// Common gibberish patterns to reject
const GIBBERISH_PATTERNS = [
  /^[asdfjkl;]+$/i,
  /^[qwerty]+$/i,
  /^[zxcvbnm]+$/i,
  /^test+$/i,
  /^[0-9]+$/,
  /^[^a-z]*$/i, // No letters at all
  /^(.)\1+$/i, // Repeated single character
];

// Valid scientific abbreviations (always allowed)
const VALID_ABBREVIATIONS = new Set([
  'dna', 'rna', 'atp', 'adp', 'amp', 'gtp', 'gdp', 'nad', 'nadp', 'fad',
  'pcr', 'ph', 'co2', 'h2o', 'o2', 'n2', 'nacl', 'hcl', 'naoh',
  'mrna', 'trna', 'rrna', 'snp', 'crispr', 'cas9',
]);

// Subject-specific keywords for relevance checking
const SUBJECT_KEYWORDS: Record<string, Set<string>> = {
  biology: new Set([
    'cell', 'cells', 'gene', 'genes', 'genetic', 'dna', 'rna', 'protein', 'proteins',
    'evolution', 'organism', 'organisms', 'tissue', 'tissues', 'organ', 'organs',
    'species', 'mitosis', 'meiosis', 'chromosome', 'chromosomes', 'nucleus',
    'membrane', 'cytoplasm', 'mitochondria', 'chloroplast', 'photosynthesis',
    'respiration', 'metabolism', 'enzyme', 'enzymes', 'hormone', 'hormones',
    'neuron', 'neurons', 'synapse', 'ecosystem', 'biodiversity', 'adaptation',
    'mutation', 'heredity', 'inheritance', 'allele', 'genotype', 'phenotype',
    'dominant', 'recessive', 'biology', 'biological', 'life', 'living',
    'plant', 'plants', 'animal', 'animals', 'fungi', 'bacteria', 'virus',
    'blood', 'heart', 'brain', 'muscle', 'bone', 'skin', 'immune', 'digestion',
  ]),
  chemistry: new Set([
    'atom', 'atoms', 'molecule', 'molecules', 'reaction', 'reactions', 'bond', 'bonds',
    'acid', 'acids', 'base', 'bases', 'electron', 'electrons', 'proton', 'protons',
    'neutron', 'neutrons', 'ion', 'ions', 'ionic', 'covalent', 'compound', 'compounds',
    'element', 'elements', 'periodic', 'table', 'metal', 'metals', 'nonmetal',
    'oxidation', 'reduction', 'redox', 'catalyst', 'catalysis', 'equilibrium',
    'solution', 'solvent', 'solute', 'concentration', 'molar', 'molarity',
    'organic', 'inorganic', 'polymer', 'polymers', 'hydrocarbon', 'functional',
    'isomer', 'isomers', 'stereochemistry', 'thermodynamics', 'enthalpy', 'entropy',
    'kinetics', 'rate', 'activation', 'energy', 'exothermic', 'endothermic',
    'chemistry', 'chemical', 'ph', 'buffer', 'titration', 'stoichiometry',
  ]),
  microbiology: new Set([
    'bacteria', 'bacterium', 'virus', 'viruses', 'viral', 'pathogen', 'pathogens',
    'culture', 'cultures', 'antibiotic', 'antibiotics', 'infection', 'infections',
    'microbe', 'microbes', 'microbial', 'microorganism', 'microorganisms',
    'colony', 'colonies', 'gram', 'stain', 'staining', 'agar', 'petri', 'incubation',
    'fermentation', 'sterilization', 'contamination', 'aseptic', 'sterile',
    'probiotic', 'probiotics', 'flora', 'microbiome', 'biofilm', 'spore', 'spores',
    'toxin', 'toxins', 'antigen', 'antigens', 'antibody', 'antibodies', 'immune',
    'vaccine', 'vaccines', 'vaccination', 'immunity', 'resistance', 'susceptibility',
    'plasmid', 'plasmids', 'transduction', 'conjugation', 'transformation',
    'microbiology', 'microscopy', 'microscope', 'cell', 'cells', 'membrane',
  ]),
};

// General science terms (valid for any subject)
const GENERAL_SCIENCE_TERMS = new Set([
  'cell', 'cells', 'energy', 'structure', 'function', 'process', 'system', 'systems',
  'theory', 'hypothesis', 'experiment', 'analysis', 'synthesis', 'mechanism',
  'cycle', 'cycles', 'regulation', 'transport', 'growth', 'development',
  'interaction', 'interactions', 'pathway', 'pathways', 'signal', 'signaling',
  'receptor', 'receptors', 'substrate', 'product', 'products', 'membrane',
  'nucleus', 'molecular', 'cellular', 'genetic', 'biochemistry', 'biophysics',
]);

/**
 * Checks if a query is clear and not gibberish
 */
export function isQueryClear(query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  
  // Check minimum length
  if (trimmed.length < 3) return false;
  
  // Count meaningful letters
  const letterCount = (trimmed.match(/[a-z]/gi) || []).length;
  if (letterCount < 3) return false;
  
  // Check for at least one word with 3+ letters
  const words = trimmed.split(/\s+/);
  const hasValidWord = words.some(word => {
    const cleanWord = word.replace(/[^a-z]/gi, '');
    return cleanWord.length >= 3;
  });
  if (!hasValidWord) return false;
  
  // Check for gibberish patterns
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(trimmed.replace(/\s+/g, ''))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if a query is relevant to the given subject
 */
export function isQueryRelevant(query: string, subjectName?: string): boolean {
  const trimmed = query.trim().toLowerCase();
  const words = trimmed.split(/\s+/);
  
  // Check if it's a valid abbreviation
  if (words.length === 1 && VALID_ABBREVIATIONS.has(trimmed)) {
    return true;
  }
  
  // Check for general science terms
  for (const word of words) {
    if (GENERAL_SCIENCE_TERMS.has(word)) {
      return true;
    }
  }
  
  // If no subject specified, be lenient with multi-word queries
  if (!subjectName) {
    // Multi-word queries get benefit of the doubt
    return words.length >= 2;
  }
  
  // Normalize subject name
  const normalizedSubject = subjectName.toLowerCase().replace(/\s+/g, '');
  
  // Get subject-specific keywords
  let subjectKeywords = SUBJECT_KEYWORDS[normalizedSubject];
  
  // If subject not found, try partial match
  if (!subjectKeywords) {
    for (const [key, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      if (normalizedSubject.includes(key) || key.includes(normalizedSubject)) {
        subjectKeywords = keywords;
        break;
      }
    }
  }
  
  // Check if any word matches subject keywords
  if (subjectKeywords) {
    for (const word of words) {
      if (subjectKeywords.has(word)) {
        return true;
      }
    }
  }
  
  // Also check all subject keywords as a fallback
  for (const keywords of Object.values(SUBJECT_KEYWORDS)) {
    for (const word of words) {
      if (keywords.has(word)) {
        return true; // Cross-subject scientific terms are OK
      }
    }
  }
  
  // Multi-word queries that are clear get benefit of the doubt
  if (words.length >= 2 && isQueryClear(query)) {
    return true;
  }
  
  return false;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates a topic request for both clarity and relevance
 */
export function validateTopicRequest(query: string, subjectName?: string): ValidationResult {
  const trimmed = query.trim();
  
  // First check clarity
  if (!isQueryClear(trimmed)) {
    return {
      valid: false,
      message: "Please enter a clear topic name",
    };
  }
  
  // Then check relevance
  if (!isQueryRelevant(trimmed, subjectName)) {
    const subjectDisplay = subjectName || "this subject";
    return {
      valid: false,
      message: `Please enter a topic related to ${subjectDisplay}`,
    };
  }
  
  return { valid: true };
}
