-- Step 1: Delete flash_summaries first (foreign key constraint)
DELETE FROM flash_summaries;

-- Step 2: Delete all topics
DELETE FROM topics;

-- Step 3: Insert 30 new topics (10 per subject)
-- Biology topics (Subject: 33333333-3333-3333-3333-333333333333)
INSERT INTO topics (title, description, chapter_id) VALUES
('Oxidative Phosphorylation', 'The metabolic pathway in mitochondria that uses an electron transport chain to produce ATP.', 'c3333333-0022-4000-a000-000000000022'),
('Signal Transduction', 'The process by which a chemical or physical signal is transmitted through a cell as a series of molecular events.', 'c3333333-0020-4000-a000-000000000020'),
('Epigenetics', 'The study of heritable changes in gene expression that do not involve alterations to the underlying DNA sequence.', 'c3333333-0018-4000-a000-000000000018'),
('The Calvin Cycle', 'A set of chemical reactions in chloroplasts that fix carbon dioxide into glucose during photosynthesis.', 'c3333333-0023-4000-a000-000000000023'),
('Action Potentials', 'The rapid change in electrical potential associated with the passage of an impulse along a nerve cell.', 'c3333333-0020-4000-a000-000000000020'),
('Phylogenetics', 'The study of evolutionary relationships among biological entities, often using DNA data to build trees.', 'c3333333-0016-4000-a000-000000000016'),
('Genetic Recombination', 'The exchange of genetic material between different organisms or chromosomes which leads to production of offspring with combinations of traits.', 'c3333333-0018-4000-a000-000000000018'),
('Adaptive Immunity', 'A specialized immune response involving B and T cells that recognizes and remembers specific pathogens.', 'c3333333-0019-4000-a000-000000000019'),
('Homeostatic Feedback', 'Mechanisms like negative feedback loops that the body uses to maintain a stable internal environment.', 'c3333333-0021-4000-a000-000000000021'),
('Hardy-Weinberg Equilibrium', 'A principle stating that allele frequencies in a population remain constant in the absence of evolutionary influences.', 'c3333333-0016-4000-a000-000000000016'),

-- Chemistry topics (Subject: 22222222-2222-2222-2222-222222222222)
('Quantum Mechanical Model', 'The modern atomic theory that describes electrons as waves in specific orbitals rather than fixed orbits.', 'c2222222-0014-4000-a000-000000000014'),
('Gibbs Free Energy', 'A thermodynamic potential used to predict whether a chemical reaction will occur spontaneously.', 'c2222222-0013-4000-a000-000000000013'),
('Stereochemistry', 'The branch of chemistry involving the study of the spatial arrangement of atoms in molecules.', 'c2222222-0010-4000-a000-000000000010'),
('Reaction Mechanisms', 'The step-by-step sequence of elementary reactions by which overall chemical change occurs.', 'c2222222-0012-4000-a000-000000000012'),
('Chemical Equilibrium', 'The state in which both reactants and products are present in concentrations which have no further tendency to change with time.', 'c2222222-0012-4000-a000-000000000012'),
('Electrochemistry', 'The study of chemical processes that cause electrons to move, creating electricity in galvanic or electrolytic cells.', 'c2222222-0012-4000-a000-000000000012'),
('Acid-Base Titrations', 'Analytical methods used to determine the concentration of an unknown acid or base using neutralization math.', 'c2222222-0011-4000-a000-000000000011'),
('Molecular Orbital Theory', 'A method for describing the electronic structure of molecules using quantum mechanics to show bonding and antibonding.', 'c2222222-0014-4000-a000-000000000014'),
('Spectroscopy', 'The study of the interaction between matter and electromagnetic radiation to determine molecular structure.', 'c2222222-0009-4000-a000-000000000009'),
('Crystal Field Theory', 'A model that describes the breaking of degeneracies of electron orbital states in transition metal complexes.', 'c2222222-0015-4000-a000-000000000015'),

-- Microbiology topics (Subject: 11111111-1111-1111-1111-111111111111)
('Horizontal Gene Transfer', 'The movement of genetic material between unicellular organisms through transformation, transduction, or conjugation.', 'c1111111-0003-4000-a000-000000000003'),
('Viral Replication Cycles', 'The process by which viruses infect host cells to produce new virions via lytic or lysogenic pathways.', 'c1111111-0006-4000-a000-000000000006'),
('Microbial Metabolism', 'The diverse chemical means by which microorganisms obtain energy, including lithotrophy and fermentation.', 'c1111111-0004-4000-a000-000000000004'),
('Antibiotic Resistance Mechanisms', 'The various ways bacteria evolve to survive exposure to antimicrobial drugs, such as efflux pumps or enzyme inactivation.', 'c1111111-0008-4000-a000-000000000008'),
('The Complement System', 'A complex cascade of plasma proteins that enhances the ability of antibodies to clear damaged cells and pathogens.', 'c1111111-0007-4000-a000-000000000007'),
('Bacterial Growth Kinetics', 'The mathematical study of the population growth of bacteria through lag, log, stationary, and death phases.', 'c1111111-0005-4000-a000-000000000005'),
('Endospore Formation', 'A complex survival mechanism where certain bacteria produce a dormant, highly resistant structure to survive extreme conditions.', 'c1111111-0002-4000-a000-000000000002'),
('Quorum Sensing', 'A system of stimulus and response correlated to population density used by bacteria to coordinate gene expression.', 'c1111111-0005-4000-a000-000000000005'),
('Nitrogen Fixation', 'The biological process of converting atmospheric nitrogen into ammonia, driven by the nitrogenase enzyme complex.', 'c1111111-0004-4000-a000-000000000004'),
('Virulence Factors', 'Specific molecules or strategies used by pathogens to colonize hosts, evade immune responses, and cause disease.', 'c1111111-0001-4000-a000-000000000001');