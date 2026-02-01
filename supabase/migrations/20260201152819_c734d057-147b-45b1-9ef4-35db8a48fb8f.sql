
-- Update all topic descriptions with complete, accurate content
UPDATE topics SET description = CASE title
  -- Biology
  WHEN 'Oxidative Phosphorylation' THEN 'The metabolic pathway in mitochondria that uses an electron transport chain to produce ATP.'
  WHEN 'Signal Transduction' THEN 'The process by which a chemical or physical signal is transmitted through a cell as a series of molecular events.'
  WHEN 'Epigenetics' THEN 'The study of heritable changes in gene expression that do not involve alterations to the underlying DNA sequence.'
  WHEN 'The Calvin Cycle' THEN 'A set of chemical reactions in chloroplasts that fix carbon dioxide into glucose during photosynthesis.'
  WHEN 'Action Potentials' THEN 'The rapid change in electrical potential associated with the passage of an impulse along a nerve cell.'
  WHEN 'Phylogenetics' THEN 'The study of evolutionary relationships among biological entities, often using DNA data to build trees.'
  WHEN 'Genetic Recombination' THEN 'The exchange of genetic material between different organisms or chromosomes which leads to production of offspring with combinations of traits.'
  WHEN 'Adaptive Immunity' THEN 'A specialized immune response involving B and T cells that recognizes and remembers specific pathogens.'
  WHEN 'Homeostatic Feedback' THEN 'Mechanisms like negative feedback loops that the body uses to maintain a stable internal environment.'
  WHEN 'Hardy-Weinberg Equilibrium' THEN 'A principle stating that allele frequencies in a population remain constant in the absence of evolutionary influences.'
  -- Chemistry
  WHEN 'Quantum Mechanical Model' THEN 'The modern atomic theory that describes electrons as waves in specific orbitals rather than fixed orbits.'
  WHEN 'Gibbs Free Energy' THEN 'A thermodynamic potential used to predict whether a chemical reaction will occur spontaneously.'
  WHEN 'Stereochemistry' THEN 'The branch of chemistry involving the study of the spatial arrangement of atoms in molecules.'
  WHEN 'Reaction Mechanisms' THEN 'The step-by-step sequence of elementary reactions by which overall chemical change occurs.'
  WHEN 'Chemical Equilibrium' THEN 'The state in which both reactants and products are present in concentrations which have no further tendency to change with time.'
  WHEN 'Electrochemistry' THEN 'The study of chemical processes that cause electrons to move, creating electricity in galvanic or electrolytic cells.'
  WHEN 'Acid-Base Titrations' THEN 'Analytical methods used to determine the concentration of an unknown acid or base using neutralization math.'
  WHEN 'Molecular Orbital Theory' THEN 'A method for describing the electronic structure of molecules using quantum mechanics to show bonding and antibonding.'
  WHEN 'Spectroscopy' THEN 'The study of the interaction between matter and electromagnetic radiation to determine molecular structure.'
  WHEN 'Crystal Field Theory' THEN 'A model that describes the breaking of degeneracies of electron orbital states in transition metal complexes.'
  -- Microbiology
  WHEN 'Horizontal Gene Transfer' THEN 'The movement of genetic material between unicellular organisms through transformation, transduction, or conjugation.'
  WHEN 'Viral Replication Cycles' THEN 'The process by which viruses infect host cells to produce new virions via lytic or lysogenic pathways.'
  WHEN 'Microbial Metabolism' THEN 'The diverse chemical means by which microorganisms obtain energy, including lithotrophy and fermentation.'
  WHEN 'Antibiotic Resistance Mechanisms' THEN 'The various ways bacteria evolve to survive exposure to antimicrobial drugs, such as efflux pumps or enzyme inactivation.'
  WHEN 'The Complement System' THEN 'A complex cascade of plasma proteins that enhances the ability of antibodies to clear damaged cells and pathogens.'
  WHEN 'Bacterial Growth Kinetics' THEN 'The mathematical study of the population growth of bacteria through lag, log, stationary, and death phases.'
  WHEN 'Endospore Formation' THEN 'A complex survival mechanism where certain bacteria produce a dormant, highly resistant structure to survive extreme conditions.'
  WHEN 'Quorum Sensing' THEN 'A system of stimulus and response correlated to population density used by bacteria to coordinate gene expression.'
  WHEN 'Nitrogen Fixation' THEN 'The biological process of converting atmospheric nitrogen into ammonia, driven by the nitrogenase enzyme complex.'
  WHEN 'Virulence Factors' THEN 'Specific molecules or strategies used by pathogens to colonize hosts, evade immune responses, and cause disease.'
  ELSE description
END
WHERE title IN (
  'Oxidative Phosphorylation', 'Signal Transduction', 'Epigenetics', 'The Calvin Cycle', 'Action Potentials',
  'Phylogenetics', 'Genetic Recombination', 'Adaptive Immunity', 'Homeostatic Feedback', 'Hardy-Weinberg Equilibrium',
  'Quantum Mechanical Model', 'Gibbs Free Energy', 'Stereochemistry', 'Reaction Mechanisms', 'Chemical Equilibrium',
  'Electrochemistry', 'Acid-Base Titrations', 'Molecular Orbital Theory', 'Spectroscopy', 'Crystal Field Theory',
  'Horizontal Gene Transfer', 'Viral Replication Cycles', 'Microbial Metabolism', 'Antibiotic Resistance Mechanisms',
  'The Complement System', 'Bacterial Growth Kinetics', 'Endospore Formation', 'Quorum Sensing', 'Nitrogen Fixation', 'Virulence Factors'
);
