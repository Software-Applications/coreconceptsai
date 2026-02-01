
# Replace Core Concepts Topics

## Summary

Delete all 24 existing topics and their associated flash summaries, then insert 30 new topics (10 per subject) with your provided titles and descriptions. No transcripts or audio will be generated.

## Current State

| Data | Count | Action |
|------|-------|--------|
| Topics | 24 | Delete all |
| Flash Summaries | 24 | Delete all (foreign key to topics) |
| User Progress | 0 | Nothing to delete |
| Pinned Cards | 0 | Nothing to delete |

## New Topics Distribution

Since there are 10 topics per subject and 8 chapters per subject, I'll distribute topics across the first few chapters (roughly 1-2 topics per chapter).

### Biology (Subject ID: 33333333-3333-3333-3333-333333333333)

| Topic | Chapter Assignment |
|-------|-------------------|
| Oxidative Phosphorylation | Ch. 7 - Cellular Respiration |
| Signal Transduction | Ch. 5 - Cell Membranes |
| Epigenetics | Ch. 3 - Biological Macromolecules |
| The Calvin Cycle | Ch. 8 - Photosynthesis |
| Action Potentials | Ch. 5 - Cell Membranes |
| Phylogenetics | Ch. 1 - The Study of Life |
| Genetic Recombination | Ch. 3 - Biological Macromolecules |
| Adaptive Immunity | Ch. 4 - Cell Structure |
| Homeostatic Feedback | Ch. 6 - Metabolism |
| Hardy-Weinberg Equilibrium | Ch. 1 - The Study of Life |

### Chemistry (Subject ID: 22222222-2222-2222-2222-222222222222)

| Topic | Chapter Assignment |
|-------|-------------------|
| Quantum Mechanical Model | Ch. 6 - Electronic Structure of Atoms |
| Gibbs Free Energy | Ch. 5 - Thermochemistry |
| Stereochemistry | Ch. 2 - Atoms, Molecules, and Ions |
| Reaction Mechanisms | Ch. 4 - Reactions in Aqueous Solution |
| Chemical Equilibrium | Ch. 4 - Reactions in Aqueous Solution |
| Electrochemistry | Ch. 4 - Reactions in Aqueous Solution |
| Acid-Base Titrations | Ch. 3 - Stoichiometry |
| Molecular Orbital Theory | Ch. 6 - Electronic Structure of Atoms |
| Spectroscopy | Ch. 1 - Matter and Measurements |
| Crystal Field Theory | Ch. 7 - Periodic Properties |

### Microbiology (Subject ID: 11111111-1111-1111-1111-111111111111)

| Topic | Chapter Assignment |
|-------|-------------------|
| Horizontal Gene Transfer | Ch. 3 - Bacterial Genetics |
| Viral Replication Cycles | Ch. 6 - Viruses and Prions |
| Microbial Metabolism | Ch. 4 - Microbial Metabolism |
| Antibiotic Resistance Mechanisms | Ch. 8 - Antimicrobial Drugs |
| The Complement System | Ch. 7 - Control of Microbial Growth |
| Bacterial Growth Kinetics | Ch. 5 - Microbial Growth |
| Endospore Formation | Ch. 2 - Cell Structure and Function |
| Quorum Sensing | Ch. 5 - Microbial Growth |
| Nitrogen Fixation | Ch. 4 - Microbial Metabolism |
| Virulence Factors | Ch. 1 - Introduction to Microbiology |

## Implementation Steps

1. **Delete flash_summaries** - Must delete first due to foreign key reference to topics
2. **Delete all topics** - Remove all 24 existing topics
3. **Insert new topics** - Add 30 new topics with titles and descriptions (no transcript, no audio_url)

---

## Technical Details

### SQL Execution Order

```text
Step 1: DELETE FROM flash_summaries
        (removes all 24 flash summary records)

Step 2: DELETE FROM topics
        (removes all 24 topic records)

Step 3: INSERT INTO topics (id, title, description, chapter_id)
        VALUES (...)
        (inserts 30 new topic records)
```

### Topic Record Structure

Each new topic will have:
- `id`: Auto-generated UUID
- `title`: Your provided topic name
- `description`: Your provided description
- `chapter_id`: Assigned based on topic relevance
- `transcript`: NULL (not generated yet)
- `audio_url`: NULL (not generated yet)
- `generated_audio_url`: NULL (not generated yet)
- `duration`: NULL (not generated yet)
