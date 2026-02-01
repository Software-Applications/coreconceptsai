
# Advanced Topic Search in Core Concepts AI

## Summary

Enhance the search functionality to search across topic titles, descriptions, and transcripts with improved semantic matching. The "Request Topic" button will appear when no matches are found.

## Current Search Limitations

| Field | Currently Searched | Score Weight |
|-------|-------------------|--------------|
| Title | Yes | 100 (exact) / 50 (partial) |
| Description | Yes | 25 |
| Bullet Points | Yes | 15 |
| Transcript | **No** | - |
| Semantic synonyms | Partial | 5-8 |

## Proposed Search Enhancement

### 1. Add Transcript Searching

Add transcript content matching with appropriate scoring:

```text
Field             | Score Weight | Rationale
------------------|--------------|-----------------------------------
Title (exact)     | 100          | Most relevant - user knows topic name
Title (partial)   | 50           | Strong match
Description       | 25           | Good relevance signal
Transcript        | 15           | Content match (new)
Bullet Points     | 15           | Summary content
Semantic terms    | 5-8          | Related concepts
```

### 2. Expand Semantic Relations Map

Update the domain-specific synonym map to cover the new 30 topics:

**Biology additions:**
- "phosphorylation" -> ["ATP", "oxidative", "mitochondria", "electron transport", "respiration"]
- "signal" -> ["transduction", "receptor", "cascade", "pathway", "cell signaling"]
- "epigenetics" -> ["methylation", "histone", "gene expression", "chromatin", "heritable"]
- "calvin" -> ["cycle", "carbon fixation", "photosynthesis", "glucose", "rubisco"]
- "action potential" -> ["nerve", "neuron", "depolarization", "impulse", "axon"]
- "phylogenetics" -> ["evolution", "tree", "ancestry", "taxonomy", "clade"]
- "recombination" -> ["genetic", "crossing over", "chromosome", "allele", "meiosis"]
- "adaptive immunity" -> ["B cell", "T cell", "antibody", "antigen", "lymphocyte"]
- "homeostasis" -> ["feedback", "regulation", "balance", "equilibrium", "negative feedback"]
- "hardy-weinberg" -> ["equilibrium", "allele frequency", "population genetics", "evolution"]

**Chemistry additions:**
- "quantum" -> ["orbital", "electron", "wave", "probability", "Schrodinger"]
- "gibbs" -> ["free energy", "spontaneous", "thermodynamics", "enthalpy", "entropy"]
- "stereochemistry" -> ["isomer", "chiral", "enantiomer", "configuration", "3D structure"]
- "mechanism" -> ["reaction", "step", "intermediate", "arrow pushing", "pathway"]
- "equilibrium" -> ["reversible", "Le Chatelier", "Keq", "concentration", "dynamic"]
- "electrochemistry" -> ["redox", "galvanic", "electrolytic", "electrode", "voltage"]
- "titration" -> ["neutralization", "equivalence point", "indicator", "burette", "pH"]
- "molecular orbital" -> ["bonding", "antibonding", "HOMO", "LUMO", "hybridization"]
- "spectroscopy" -> ["absorption", "emission", "IR", "NMR", "UV-Vis", "spectrum"]
- "crystal field" -> ["ligand", "splitting", "d orbital", "transition metal", "complex"]

**Microbiology additions:**
- "horizontal" -> ["gene transfer", "transformation", "transduction", "conjugation", "plasmid"]
- "viral" -> ["replication", "lytic", "lysogenic", "capsid", "host"]
- "metabolism" -> ["fermentation", "respiration", "catabolism", "anabolism", "ATP"]
- "antibiotic" -> ["resistance", "efflux", "beta-lactamase", "mutation", "selection"]
- "complement" -> ["cascade", "MAC", "opsonization", "C3", "innate immunity"]
- "kinetics" -> ["growth curve", "lag phase", "log phase", "stationary", "death phase"]
- "endospore" -> ["dormant", "survival", "Bacillus", "Clostridium", "heat resistant"]
- "quorum" -> ["sensing", "biofilm", "autoinducer", "population density", "communication"]
- "nitrogen" -> ["fixation", "nitrogenase", "ammonia", "legume", "rhizobium"]
- "virulence" -> ["pathogen", "toxin", "adhesin", "invasion", "colonization"]

### 3. Improved Matching Logic

Add fuzzy matching for common typos and word stems:

```text
User types          | Matches
--------------------|----------------------------------
"oxidativ"          | "Oxidative Phosphorylation"
"photosyn"          | "The Calvin Cycle" (via semantic)
"gene transfer"     | "Horizontal Gene Transfer"
"ATP production"    | "Oxidative Phosphorylation"
```

### 4. Request Topic Flow

The existing request button will continue to appear when:
- Search query has 2+ characters
- No direct hits AND no related topics found
- User can submit their query to the `topic_requests` table

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/topicSearch.ts` | Add transcript searching, expand semantic map, add fuzzy matching |
| `src/components/topic-selection/TopicCard.tsx` | Optional: highlight transcript matches |

## Implementation Steps

1. **Update `scoreTopic()` function**
   - Add transcript field scoring (15 points for keyword match)
   - Only count unique matches (avoid double-scoring same keyword)

2. **Expand semantic relations map**
   - Add 30+ new term mappings for Biology, Chemistry, Microbiology
   - Include common abbreviations (ATP, DNA, RNA, etc.)

3. **Add fuzzy/prefix matching**
   - Match word prefixes (3+ chars) for partial typing
   - Handle common suffixes (-tion, -ing, -ity)

4. **Optimize for empty transcripts**
   - Skip transcript scoring when transcript is empty/null
   - New topics currently have no transcripts, so description/title matching is primary

---

## Technical Details

### Scoring Algorithm Update

```text
scoreTopic(topic, keywords):
  score = 0
  
  for each keyword:
    // Title matching (unchanged)
    if title.exactMatch(keyword): score += 100
    else if title.includes(keyword): score += 50
    
    // Description matching (unchanged)
    if description.includes(keyword): score += 25
    
    // NEW: Transcript matching
    if transcript.includes(keyword): score += 15
    
    // Bullet points (unchanged)
    for each bullet: if includes(keyword): score += 15
    
    // Semantic matching (expanded)
    for each relatedTerm of keyword:
      if title.includes(relatedTerm): score += 8
      if description.includes(relatedTerm): score += 5
      if transcript.includes(relatedTerm): score += 3  // NEW
      
  return { topic, score, matchType }
```

### New Semantic Map Structure

```text
// Group by domain for maintainability
const semanticRelations = {
  // Biology - Cellular
  "phosphorylation": [...],
  "respiration": [...],
  
  // Biology - Genetics
  "epigenetics": [...],
  "recombination": [...],
  
  // Chemistry - Physical
  "quantum": [...],
  "gibbs": [...],
  
  // Microbiology
  "horizontal": [...],
  "quorum": [...],
  ...
}
```
