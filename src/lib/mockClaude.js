import { v4 as uuidv4 } from 'uuid';

// ─── Question Banks (per topic, per phase) ───

const questionBank = {
  biological_molecules: {
    recall: [
      { prompt: "Define a glycosidic bond.", keywords: ["condensation reaction", "between monosaccharides", "covalent bond"], maxScore: 2 },
      { prompt: "Name the three elements found in carbohydrates.", keywords: ["carbon", "hydrogen", "oxygen"], maxScore: 1 },
      { prompt: "What type of reaction joins two amino acids together?", keywords: ["condensation", "peptide bond", "water released"], maxScore: 2 },
      { prompt: "State the monomer of a polysaccharide.", keywords: ["monosaccharide", "glucose"], maxScore: 1 },
      { prompt: "Name the bond that holds amino acids together in a protein.", keywords: ["peptide bond"], maxScore: 1 },
      { prompt: "What is the difference between an alpha-glucose and a beta-glucose molecule?", keywords: ["position of OH group", "carbon 1", "structural isomers"], maxScore: 2 },
      { prompt: "Define the term 'hydrolysis'.", keywords: ["breaking", "bond", "addition of water"], maxScore: 2 },
    ],
    application: [
      { prompt: "A student heated a protein solution to 80°C and found it could no longer function. Explain why.", subskillIds: ["protein_structure"], keywords: ["hydrogen bonds break", "tertiary structure lost", "active site shape changed", "denaturation"], maxScore: 4 },
      { prompt: "Cellulose and starch are both polymers of glucose. Explain why cellulose is stronger than starch.", subskillIds: ["polysaccharides"], keywords: ["beta-glucose", "1-4 glycosidic bonds", "straight chains", "hydrogen bonds between chains", "microfibrils"], maxScore: 4 },
      { prompt: "A food sample was tested with Benedict's reagent and remained blue. Suggest why this does not prove the absence of sugar.", subskillIds: ["monosaccharides"], keywords: ["non-reducing sugar", "sucrose", "need hydrolysis first", "only tests reducing sugars"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe and explain the relationship between the structure of proteins and their function, using named examples. (6 marks)", subskillIds: ["protein_structure", "amino_acids"], keywords: ["primary sequence", "hydrogen bonds", "tertiary structure", "active site", "haemoglobin", "collagen", "fibrous vs globular"], maxScore: 6, rubricPoints: ["Primary structure is the sequence of amino acids", "Determines tertiary/3D shape via hydrogen bonds, disulfide bridges, ionic bonds, hydrophobic interactions", "Globular proteins (e.g., enzymes, haemoglobin) are soluble and have specific 3D shapes for function", "Fibrous proteins (e.g., collagen) have repeating structures for strength", "Shape determines function — e.g., enzyme active site is complementary to substrate", "Changes to primary structure (mutations) can alter shape and function"] },
      { prompt: "Compare and contrast the structure and function of starch and cellulose. (6 marks)", subskillIds: ["polysaccharides"], keywords: ["alpha glucose", "beta glucose", "1-4 glycosidic", "branched/unbranched", "energy storage", "structural"], maxScore: 6, rubricPoints: ["Both polymers of glucose linked by glycosidic bonds", "Starch: alpha-glucose; cellulose: beta-glucose", "Starch: coiled (amylose) and branched (amylopectin); cellulose: straight chains", "Cellulose chains form hydrogen bonds between molecules → microfibrils → strong", "Starch is compact and insoluble → good energy store", "Cellulose provides structural support in plant cell walls"] },
    ],
  },
  enzymes: {
    recall: [
      { prompt: "Define the term 'active site'.", keywords: ["region", "enzyme", "substrate binds", "complementary shape"], maxScore: 2 },
      { prompt: "What is meant by 'enzyme specificity'?", keywords: ["specific substrate", "complementary", "active site shape"], maxScore: 2 },
      { prompt: "State one difference between competitive and non-competitive inhibition.", keywords: ["active site vs allosteric", "can be overcome vs cannot"], maxScore: 1 },
      { prompt: "Name the model that describes the enzyme changing shape when the substrate binds.", keywords: ["induced fit"], maxScore: 1 },
      { prompt: "What happens to an enzyme at temperatures above its optimum?", keywords: ["denaturation", "hydrogen bonds break", "active site shape lost"], maxScore: 2 },
      { prompt: "Define the term 'activation energy'.", keywords: ["minimum energy", "required", "reaction to occur"], maxScore: 2 },
      { prompt: "What is a cofactor?", keywords: ["non-protein", "required for enzyme function", "metal ion or coenzyme"], maxScore: 2 },
    ],
    application: [
      { prompt: "A scientist added substrate to an enzyme solution at 30°C. The rate of reaction increased rapidly at first, then plateaued. Explain why the reaction rate did not continue to increase linearly.", subskillIds: ["kinetics", "induced_fit"], keywords: ["saturation", "active sites occupied", "enzyme concentration limiting", "no free active sites"], maxScore: 4 },
      { prompt: "Enzyme A is inhibited by drug X — rate drops 50%. Enzyme B is inhibited by drug Y — rate drops to zero regardless of substrate concentration. Explain the difference.", subskillIds: ["competitive_inhibition", "noncompetitive_inhibition"], keywords: ["competitive: binds active site", "can be overcome by more substrate", "non-competitive: binds allosteric site", "changes enzyme shape permanently", "cannot be overcome"], maxScore: 4 },
      { prompt: "Two enzymes have different optimal temperatures (37°C vs 80°C). The second is from a thermophilic bacterium. Explain why.", subskillIds: ["temperature_effects"], keywords: ["more hydrogen bonds", "stronger ionic interactions", "tertiary structure more heat-stable", "adapted to hot environment", "denaturation at higher temperature"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Explain how the induced fit model accounts for enzyme specificity and catalytic activity. (6 marks)", subskillIds: ["induced_fit", "enzyme_structure"], keywords: ["complementary shape", "substrate binds", "enzyme shape changes", "lowers activation energy", "enzyme-substrate complex"], maxScore: 6, rubricPoints: ["Active site has a shape approximately complementary to the substrate", "When substrate enters, the active site changes shape to fit more closely (induced fit)", "This forms an enzyme-substrate complex", "The change in shape puts strain on the substrate bonds, lowering activation energy", "Only specific substrates can induce the correct shape change → specificity", "Enzyme is not permanently changed and can catalyse further reactions"] },
      { prompt: "Compare competitive and non-competitive enzyme inhibition. Explain how you could experimentally distinguish between them. (6 marks)", subskillIds: ["competitive_inhibition", "noncompetitive_inhibition", "kinetics"], keywords: ["active site", "allosteric", "substrate concentration", "Vmax", "Km", "Lineweaver-Burk"], maxScore: 6, rubricPoints: ["Competitive: inhibitor binds active site; similar shape to substrate", "Non-competitive: inhibitor binds allosteric site; changes active site shape", "Competitive can be overcome by increasing substrate concentration", "Non-competitive cannot be overcome by increasing substrate", "Experimentally: increase substrate concentration and measure rate", "If rate returns to normal at high substrate → competitive; if Vmax stays reduced → non-competitive"] },
    ],
  },
  cell_structure: {
    recall: [
      { prompt: "Name three organelles found in eukaryotic cells but not in prokaryotic cells.", keywords: ["nucleus", "mitochondria", "endoplasmic reticulum", "Golgi apparatus"], maxScore: 3 },
      { prompt: "State the function of the rough endoplasmic reticulum.", keywords: ["protein synthesis", "ribosomes attached", "transport of proteins"], maxScore: 2 },
      { prompt: "What is the function of mitochondria?", keywords: ["aerobic respiration", "ATP production", "site of oxidative phosphorylation"], maxScore: 2 },
      { prompt: "Define the term 'resolution' in microscopy.", keywords: ["ability to distinguish", "two points", "as separate"], maxScore: 2 },
      { prompt: "Name one feature of prokaryotic cells not found in eukaryotic cells.", keywords: ["plasmid", "70S ribosomes", "no membrane-bound nucleus", "cell wall with murein"], maxScore: 1 },
    ],
    application: [
      { prompt: "A cell produces large amounts of a secreted protein. Which organelles would you expect to be abundant in this cell? Explain your reasoning.", subskillIds: ["organelle_function", "eukaryotic_cells"], keywords: ["rough ER", "ribosomes", "Golgi apparatus", "vesicles", "protein synthesis", "modification", "packaging"], maxScore: 4 },
      { prompt: "Explain why electron microscopes have a higher resolution than light microscopes.", subskillIds: ["ultrastructure"], keywords: ["shorter wavelength", "electrons vs light", "can distinguish smaller structures", "higher magnification useful"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the process of cell fractionation and explain how it allows scientists to study individual organelles. (6 marks)", subskillIds: ["cell_fractionation", "organelle_function"], keywords: ["homogenisation", "isotonic buffer", "filtration", "ultracentrifugation", "differential centrifugation", "pellet and supernatant"], maxScore: 6, rubricPoints: ["Cells broken open by homogenisation (blender) in cold, isotonic, buffered solution", "Cold: prevents enzyme damage; isotonic: prevents osmotic damage; buffered: prevents pH change", "Filtered to remove cell debris", "Ultracentrifugation at increasing speeds", "Heaviest organelles (nuclei) sediment first at lowest speed", "Lighter organelles (ribosomes) sediment at highest speed → each pellet studied separately"] },
    ],
  },
  transport_membranes: {
    recall: [
      { prompt: "Define diffusion.", keywords: ["net movement", "molecules", "high to low concentration", "down concentration gradient"], maxScore: 2 },
      { prompt: "What is osmosis?", keywords: ["net movement of water", "partially permeable membrane", "high water potential to low water potential"], maxScore: 2 },
      { prompt: "State two differences between active transport and diffusion.", keywords: ["requires ATP", "against concentration gradient", "carrier proteins", "passive vs active"], maxScore: 2 },
      { prompt: "Name the type of protein involved in facilitated diffusion.", keywords: ["channel protein", "carrier protein"], maxScore: 1 },
      { prompt: "What is meant by 'water potential'?", keywords: ["tendency of water", "move by osmosis", "measured in kPa", "pure water = 0"], maxScore: 2 },
    ],
    application: [
      { prompt: "Red blood cells placed in distilled water swell and burst. Explain why.", subskillIds: ["osmosis"], keywords: ["water potential higher outside", "water enters by osmosis", "no cell wall to resist", "cell swells", "lysis"], maxScore: 4 },
      { prompt: "Explain why root hair cells need active transport to absorb mineral ions from the soil.", subskillIds: ["active_transport"], keywords: ["mineral concentration higher inside root", "against concentration gradient", "requires ATP", "carrier proteins"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Compare and contrast diffusion, facilitated diffusion, osmosis, and active transport. (6 marks)", subskillIds: ["diffusion", "facilitated_diffusion", "osmosis", "active_transport"], keywords: ["concentration gradient", "passive", "active", "ATP", "proteins", "water"], maxScore: 6, rubricPoints: ["All involve movement of molecules/ions across membranes", "Diffusion: passive, down concentration gradient, no proteins needed (for small/non-polar molecules)", "Facilitated diffusion: passive, down gradient, requires channel or carrier proteins (for charged/large molecules)", "Osmosis: net movement of water only, down water potential gradient, through partially permeable membrane", "Active transport: requires ATP, against concentration gradient, uses carrier proteins", "Diffusion and facilitated diffusion stop at equilibrium; active transport can maintain concentration differences"] },
    ],
  },
  dna_protein_synthesis: {
    recall: [
      { prompt: "Name the enzyme that unwinds the DNA double helix during replication.", keywords: ["helicase"], maxScore: 1 },
      { prompt: "State the base pairing rules in DNA.", keywords: ["adenine-thymine", "cytosine-guanine", "complementary"], maxScore: 2 },
      { prompt: "What is a codon?", keywords: ["triplet", "three bases", "codes for amino acid", "on mRNA"], maxScore: 2 },
      { prompt: "Where in the cell does translation occur?", keywords: ["ribosome", "cytoplasm", "rough ER"], maxScore: 1 },
      { prompt: "Name the sugar found in RNA.", keywords: ["ribose"], maxScore: 1 },
    ],
    application: [
      { prompt: "A mutation changes one base in a gene. Explain why this might not affect the protein produced.", subskillIds: ["genetic_code", "mutations"], keywords: ["degenerate code", "multiple codons code for same amino acid", "silent mutation", "no change in amino acid sequence"], maxScore: 3 },
      { prompt: "Explain why mRNA must leave the nucleus for protein synthesis to occur.", subskillIds: ["transcription", "translation"], keywords: ["DNA too large to leave nucleus", "ribosomes in cytoplasm", "mRNA carries genetic code", "template for translation"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the process of protein synthesis from gene to functional protein. (6 marks)", subskillIds: ["transcription", "translation", "genetic_code"], keywords: ["transcription", "mRNA", "RNA polymerase", "ribosome", "tRNA", "anticodon", "peptide bond"], maxScore: 6, rubricPoints: ["Transcription: RNA polymerase binds to promoter, unwinds DNA", "Complementary mRNA strand synthesised from template strand", "mRNA leaves nucleus through nuclear pore", "Translation: mRNA attaches to ribosome", "tRNA brings amino acids; anticodon pairs with codon on mRNA", "Peptide bonds form between amino acids; polypeptide chain folds into functional protein"] },
    ],
  },
  cell_division: {
    recall: [
      { prompt: "How many cells are produced at the end of meiosis?", keywords: ["four", "haploid"], maxScore: 1 },
      { prompt: "State one function of mitosis.", keywords: ["growth", "repair", "asexual reproduction", "replacing cells"], maxScore: 1 },
      { prompt: "What is crossing over?", keywords: ["exchange of genetic material", "homologous chromosomes", "chiasma", "genetic variation"], maxScore: 2 },
      { prompt: "Name the stage of mitosis where chromosomes line up at the equator.", keywords: ["metaphase"], maxScore: 1 },
      { prompt: "Define the term 'haploid'.", keywords: ["one set of chromosomes", "half the diploid number", "n"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why meiosis is important for sexual reproduction.", subskillIds: ["meiosis", "genetic_variation"], keywords: ["produces haploid gametes", "maintains chromosome number after fertilisation", "genetic variation through crossing over and independent assortment"], maxScore: 4 },
      { prompt: "A cell with 46 chromosomes undergoes mitosis. State the chromosome number of each daughter cell and explain why.", subskillIds: ["mitosis"], keywords: ["46", "identical", "DNA replicated in S phase", "chromatids separated"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Compare and contrast mitosis and meiosis in terms of process and outcome. (6 marks)", subskillIds: ["mitosis", "meiosis", "genetic_variation"], keywords: ["one division vs two", "diploid vs haploid", "identical vs genetically different", "crossing over", "independent assortment"], maxScore: 6, rubricPoints: ["Mitosis: one division producing two identical diploid cells", "Meiosis: two divisions producing four genetically different haploid cells", "Both involve DNA replication in interphase", "Meiosis I: homologous pairs separate (reduction division); crossing over occurs", "Meiosis II: sister chromatids separate (similar to mitosis)", "Meiosis produces genetic variation through crossing over and independent assortment; mitosis does not"] },
    ],
  },
  exchange_surfaces: {
    recall: [
      { prompt: "State three features that increase the rate of diffusion across an exchange surface.", keywords: ["large surface area", "thin barrier", "good blood supply", "ventilation", "concentration gradient"], maxScore: 3 },
      { prompt: "What is meant by the 'surface area to volume ratio'?", keywords: ["surface area divided by volume", "smaller organisms have higher ratio"], maxScore: 2 },
      { prompt: "Name two features of alveoli that make them efficient for gas exchange.", keywords: ["thin walls", "large surface area", "good blood supply", "moist", "many alveoli"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why large multicellular organisms need specialised exchange surfaces but single-celled organisms do not.", subskillIds: ["sa_v_ratio", "adaptations"], keywords: ["small SA:V ratio in large organisms", "diffusion too slow", "greater distances", "higher metabolic demand", "single-celled: large SA:V, short diffusion distance"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Describe how the mammalian lung is adapted for efficient gas exchange. (6 marks)", subskillIds: ["gas_exchange_lungs", "adaptations"], keywords: ["alveoli", "surface area", "thin walls", "capillaries", "ventilation", "concentration gradient"], maxScore: 6, rubricPoints: ["Many alveoli provide a very large surface area for gas exchange", "Alveolar walls are one cell thick → short diffusion distance", "Dense capillary network maintains steep concentration gradient", "Ventilation (breathing) brings fresh air and removes stale air", "Moist lining allows gases to dissolve before diffusing", "Good blood supply carries oxygen away and brings CO2 → maintains gradient"] },
    ],
  },
  transport_animals: {
    recall: [
      { prompt: "Name the four chambers of the heart.", keywords: ["left atrium", "right atrium", "left ventricle", "right ventricle"], maxScore: 2 },
      { prompt: "What is the function of the SAN (sinoatrial node)?", keywords: ["pacemaker", "generates electrical impulse", "controls heart rate"], maxScore: 2 },
      { prompt: "State two differences between arteries and veins.", keywords: ["thick walls vs thin walls", "high pressure vs low pressure", "no valves vs valves", "narrow lumen vs wide lumen"], maxScore: 2 },
      { prompt: "What carries oxygen in the blood?", keywords: ["haemoglobin", "red blood cells"], maxScore: 1 },
    ],
    application: [
      { prompt: "The left ventricle wall is thicker than the right ventricle wall. Explain why.", subskillIds: ["heart_structure"], keywords: ["pumps blood to whole body", "systemic circulation", "higher pressure needed", "greater distance", "right ventricle only pumps to lungs"], maxScore: 3 },
      { prompt: "Explain the role of valves in the circulatory system.", subskillIds: ["heart_structure", "blood_vessels"], keywords: ["prevent backflow", "ensure one-way flow", "open when pressure is higher above", "close when pressure drops"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the cardiac cycle, including the role of the SAN and pressure changes. (6 marks)", subskillIds: ["cardiac_cycle", "heart_structure"], keywords: ["SAN", "atrial systole", "ventricular systole", "diastole", "pressure", "valves"], maxScore: 6, rubricPoints: ["SAN generates electrical impulse → spreads across atria", "Atrial systole: atria contract, pushing blood into ventricles", "AVN delays impulse → ventricles contract after atria (ventricular systole)", "Pressure in ventricles exceeds pressure in arteries → semilunar valves open", "Blood ejected into aorta and pulmonary artery", "Diastole: heart relaxes, pressure drops, AV valves open, blood fills atria and ventricles"] },
    ],
  },
  respiration: {
    recall: [
      { prompt: "Where in the cell does glycolysis occur?", keywords: ["cytoplasm"], maxScore: 1 },
      { prompt: "Name the molecule that enters the Krebs cycle.", keywords: ["acetyl CoA"], maxScore: 1 },
      { prompt: "What is the final electron acceptor in oxidative phosphorylation?", keywords: ["oxygen"], maxScore: 1 },
      { prompt: "State the net ATP yield from glycolysis.", keywords: ["2 ATP"], maxScore: 1 },
      { prompt: "What is produced during anaerobic respiration in animals?", keywords: ["lactate", "lactic acid"], maxScore: 1 },
    ],
    application: [
      { prompt: "A student investigated the effect of temperature on respiration rate of yeast cells. Explain the shape of the curve between 20°C and 60°C.", subskillIds: ["glycolysis", "krebs_cycle"], keywords: ["increased kinetic energy", "more collisions", "enzyme activity increases", "optimum temperature", "denaturation", "hydrogen bonds break", "rate decreases"], maxScore: 4 },
      { prompt: "Explain why the rate of respiration increases during exercise.", subskillIds: ["oxidative_phosphorylation", "glycolysis"], keywords: ["more ATP needed", "muscle contraction", "increased oxygen demand", "increased glucose demand", "faster breathing and heart rate"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the process of aerobic respiration from glucose to ATP, including where each stage occurs. (6 marks)", subskillIds: ["glycolysis", "link_reaction", "krebs_cycle", "oxidative_phosphorylation"], keywords: ["glycolysis", "cytoplasm", "link reaction", "Krebs cycle", "matrix", "electron transport chain", "inner membrane"], maxScore: 6, rubricPoints: ["Glycolysis: glucose → 2 pyruvate in cytoplasm; net 2 ATP + 2 NADH", "Link reaction: pyruvate → acetyl CoA + CO2 in mitochondrial matrix; NADH produced", "Krebs cycle: acetyl CoA + oxaloacetate → citrate; produces NADH, FADH2, ATP, CO2 in matrix", "Oxidative phosphorylation: NADH/FADH2 donate electrons to electron transport chain on inner membrane", "Chemiosmosis: H+ ions flow through ATP synthase → ATP produced", "Oxygen is final electron acceptor → combines with H+ to form water"] },
    ],
  },
  photosynthesis: {
    recall: [
      { prompt: "Where do the light-dependent reactions take place?", keywords: ["thylakoid", "thylakoid membrane", "granum"], maxScore: 1 },
      { prompt: "Name the enzyme that fixes CO2 in the Calvin cycle.", keywords: ["RuBisCO"], maxScore: 1 },
      { prompt: "What are the products of the light-dependent reactions?", keywords: ["ATP", "reduced NADP", "oxygen"], maxScore: 2 },
      { prompt: "State three limiting factors of photosynthesis.", keywords: ["light intensity", "CO2 concentration", "temperature"], maxScore: 3 },
      { prompt: "Name the 3-carbon molecule produced when CO2 is fixed in the Calvin cycle.", keywords: ["GP", "glycerate-3-phosphate"], maxScore: 1 },
    ],
    application: [
      { prompt: "A graph shows the effect of light intensity on photosynthesis rate at two different CO2 concentrations (300 ppm and 600 ppm). At high light, 300 ppm plateaus lower. Explain why.", subskillIds: ["limiting_factors", "light_independent"], keywords: ["CO2 is limiting factor at 300 ppm", "all light energy cannot be used", "Calvin cycle rate limited", "at 600 ppm more CO2 for fixation", "higher rate of carbon fixation"], maxScore: 4 },
      { prompt: "Explain why increasing temperature beyond the optimum decreases the rate of photosynthesis.", subskillIds: ["limiting_factors"], keywords: ["enzymes denature", "RuBisCO", "hydrogen bonds break", "active site shape lost", "Calvin cycle slows"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the light-dependent and light-independent reactions of photosynthesis and explain how they are linked. (6 marks)", subskillIds: ["light_dependent", "light_independent"], keywords: ["thylakoid", "photolysis", "electron transport", "ATP", "NADP", "Calvin cycle", "RuBP", "GP", "TP"], maxScore: 6, rubricPoints: ["Light-dependent: light energy absorbed by chlorophyll in thylakoid membranes", "Photolysis of water produces H+ ions, electrons, and O2", "Electrons pass along electron transport chain → ATP produced (photophosphorylation)", "NADP reduced to NADPH using H+ from photolysis", "Light-independent (Calvin cycle): CO2 fixed by RuBisCO + RuBP → GP in stroma", "GP reduced to TP using ATP and NADPH from light-dependent reactions → link between the two stages"] },
    ],
  },
  homeostasis: {
    recall: [
      { prompt: "Define negative feedback.", keywords: ["response", "reverses", "change", "returns to set point", "deviation corrected"], maxScore: 2 },
      { prompt: "Which hormone lowers blood glucose concentration?", keywords: ["insulin"], maxScore: 1 },
      { prompt: "Where is ADH produced?", keywords: ["hypothalamus", "released from posterior pituitary"], maxScore: 1 },
      { prompt: "Name the cells in the pancreas that produce glucagon.", keywords: ["alpha cells"], maxScore: 1 },
      { prompt: "State the role of the loop of Henle.", keywords: ["creates concentration gradient", "in medulla", "reabsorption of water", "countercurrent multiplier"], maxScore: 2 },
    ],
    application: [
      { prompt: "After eating a meal rich in carbohydrates, blood glucose rises. Describe how the body returns blood glucose to normal.", subskillIds: ["blood_glucose", "negative_feedback"], keywords: ["beta cells detect rise", "insulin secreted", "glucose uptake by cells", "glycogenesis", "blood glucose falls", "negative feedback"], maxScore: 4 },
      { prompt: "Explain why a person who drinks a large volume of water produces dilute urine.", subskillIds: ["osmoregulation", "kidney_function"], keywords: ["blood water potential rises", "osmoreceptors detect change", "less ADH released", "collecting duct less permeable", "less water reabsorbed", "dilute urine"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Describe and explain how blood glucose concentration is regulated by insulin and glucagon. (6 marks)", subskillIds: ["blood_glucose", "negative_feedback"], keywords: ["insulin", "glucagon", "beta cells", "alpha cells", "glycogenesis", "glycogenolysis", "negative feedback"], maxScore: 6, rubricPoints: ["High blood glucose detected by beta cells in islets of Langerhans", "Beta cells secrete insulin → promotes glucose uptake by cells + glycogenesis (glucose → glycogen)", "Blood glucose falls back to normal (negative feedback)", "Low blood glucose detected by alpha cells", "Alpha cells secrete glucagon → promotes glycogenolysis (glycogen → glucose) + gluconeogenesis", "Blood glucose rises back to normal (negative feedback) — antagonistic hormones maintain balance"] },
    ],
  },
  ecology: {
    recall: [
      { prompt: "Define carrying capacity.", keywords: ["maximum population", "environment can sustain", "resources available"], maxScore: 2 },
      { prompt: "Name two density-dependent factors.", keywords: ["disease", "competition", "predation", "food availability"], maxScore: 2 },
      { prompt: "What is a pioneer species?", keywords: ["first to colonise", "bare substrate", "start succession"], maxScore: 2 },
      { prompt: "State one difference between a food chain and a food web.", keywords: ["food web shows multiple", "interconnected", "food chain is linear"], maxScore: 1 },
    ],
    application: [
      { prompt: "A population of field mice shows logistic growth. Explain two density-dependent factors that limit population growth.", subskillIds: ["density_dependent", "population_growth"], keywords: ["intraspecific competition", "disease transmission", "food becomes limited", "more individuals competing", "predation increases"], maxScore: 4 },
      { prompt: "Explain why only about 10% of energy is transferred between trophic levels.", subskillIds: ["ecosystems"], keywords: ["respiration", "heat loss", "not all organisms eaten", "not all parts digested", "faeces", "excretion"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the process of ecological succession from bare rock to a climax community. (6 marks)", subskillIds: ["succession"], keywords: ["pioneer species", "lichens", "soil formation", "new species", "biodiversity increases", "climax community"], maxScore: 6, rubricPoints: ["Pioneer species (e.g., lichens, mosses) colonise bare rock", "They weather the rock and add organic matter when they die → soil begins to form", "Soil allows new species (grasses, small plants) to grow → outcompete pioneers", "Each stage (seral stage) changes the environment, making it suitable for next species", "Biodiversity and biomass increase at each stage", "Climax community reached: stable community (e.g., oak woodland in UK) — no further change unless disturbed"] },
    ],
  },
  cell_recognition_immune: {
    recall: [
      { prompt: "What is an antigen?", keywords: ["molecule", "cell surface", "triggers immune response", "foreign", "non-self"], maxScore: 2 },
      { prompt: "Name the two main types of lymphocyte.", keywords: ["B lymphocyte", "T lymphocyte"], maxScore: 1 },
      { prompt: "State the function of a plasma cell.", keywords: ["produces antibodies", "secretes", "large amounts", "specific antibody"], maxScore: 2 },
      { prompt: "Define the term 'phagocytosis'.", keywords: ["engulfing", "pathogen", "phagocyte", "lysosome", "digestion"], maxScore: 2 },
      { prompt: "What is the difference between active and passive immunity?", keywords: ["active produces own antibodies", "passive receives antibodies from another source", "active is long-lasting", "passive is temporary"], maxScore: 2 },
      { prompt: "Name the type of cell that HIV targets.", keywords: ["T helper cell", "CD4", "T lymphocyte"], maxScore: 1 },
      { prompt: "State what is meant by 'herd immunity'.", keywords: ["large proportion", "population vaccinated", "protects unvaccinated", "transmission reduced"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why the secondary immune response produces more antibodies more quickly than the primary response.", subskillIds: ["primary_secondary_response", "b_lymphocytes"], keywords: ["memory cells", "remain in body", "recognise antigen faster", "clonal expansion quicker", "more plasma cells produced", "faster antibody production"], maxScore: 4 },
      { prompt: "A patient receives an injection of antibodies against tetanus. Explain why this provides only short-term protection.", subskillIds: ["active_passive_immunity"], keywords: ["passive immunity", "antibodies not made by patient", "no memory cells produced", "antibodies break down", "no immunological memory", "cannot respond to future infection"], maxScore: 4 },
      { prompt: "Explain how vaccination prevents disease.", subskillIds: ["vaccination", "primary_secondary_response"], keywords: ["attenuated/dead pathogen", "antigens present", "immune response triggered", "B cells produce antibodies", "memory cells formed", "secondary response if exposed"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Describe the immune response to a bacterial infection, including the roles of phagocytes, T lymphocytes, and B lymphocytes. (6 marks)", subskillIds: ["phagocytes", "t_lymphocytes", "b_lymphocytes", "antibody_structure"], keywords: ["phagocyte", "engulf", "antigen presentation", "T helper", "cytokines", "B cell", "plasma cell", "antibodies", "memory cells"], maxScore: 6, rubricPoints: ["Phagocytes (e.g., macrophages) engulf the pathogen by endocytosis and digest it with lysosomes", "Phagocyte presents antigens from the pathogen on its surface (antigen-presenting cell)", "T helper cells with complementary receptors bind to the presented antigen and become activated", "Activated T helper cells release cytokines that stimulate B cells and T killer cells", "B cells with complementary antibodies are selected (clonal selection) and divide (clonal expansion)", "B cells differentiate into plasma cells (secrete antibodies) and memory cells (long-term immunity)"] },
      { prompt: "Explain how HIV leads to AIDS and why individuals with AIDS are susceptible to opportunistic infections. (6 marks)", subskillIds: ["hiv_aids", "t_lymphocytes"], keywords: ["HIV", "T helper cells", "CD4", "replication", "destroys", "immune system weakened", "opportunistic infections"], maxScore: 6, rubricPoints: ["HIV is a retrovirus that infects T helper cells (CD4+ cells)", "HIV attaches to CD4 receptors and injects its RNA into the T helper cell", "Reverse transcriptase produces DNA from viral RNA; integrates into host DNA", "Host cell produces new HIV particles which bud off, destroying the T helper cell", "Over time, T helper cell numbers decline significantly", "Without T helper cells: B cells are not activated, antibody production fails, cell-mediated responses fail → opportunistic infections (e.g., TB, pneumonia) cause AIDS"] },
    ],
  },

  // ─── Chemistry Topics ───

  atomic_structure: {
    recall: [
      { prompt: "Define the term 'isotope'.", keywords: ["same number of protons", "different number of neutrons", "same element"], maxScore: 2 },
      { prompt: "State the relative charge and relative mass of a proton.", keywords: ["+1", "1"], maxScore: 2 },
      { prompt: "Write the electron configuration of a sodium atom (Na, atomic number 11).", keywords: ["1s2", "2s2", "2p6", "3s1"], maxScore: 2 },
      { prompt: "Define first ionisation energy.", keywords: ["energy required", "remove one electron", "one mole", "gaseous atoms", "gaseous ions"], maxScore: 2 },
      { prompt: "State the number of protons, neutrons and electrons in an atom of carbon-14.", keywords: ["6 protons", "8 neutrons", "6 electrons"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why the first ionisation energy of magnesium is higher than that of sodium.", subskillIds: ["ionisation_energy"], keywords: ["more protons", "greater nuclear charge", "same shielding", "stronger attraction", "outer electron harder to remove"], maxScore: 4 },
      { prompt: "The relative atomic mass of chlorine is 35.5, not a whole number. Explain why.", subskillIds: ["isotopes"], keywords: ["two isotopes", "Cl-35 and Cl-37", "weighted average", "natural abundance", "75% Cl-35 and 25% Cl-37"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe and explain the trend in first ionisation energies across Period 3 (Na to Ar). Account for any exceptions. (6 marks)", subskillIds: ["ionisation_energy", "electron_configuration"], keywords: ["increase across period", "nuclear charge increases", "shielding similar", "dip at aluminium", "3p electron easier to remove", "dip at sulfur", "paired electrons repel"], maxScore: 6, rubricPoints: ["General trend: IE increases across Period 3 due to increasing nuclear charge", "Electrons added to same shell, so shielding effect is similar", "Greater nuclear charge means outer electrons held more tightly", "Exception at Al (lower than Mg): 3p electron is in a higher energy subshell than 3s, easier to remove", "Exception at S (lower than P): 3p4 has paired electrons that repel, easier to remove one", "Ar has highest IE: greatest nuclear charge with electrons in same shell"] },
    ],
  },
  bonding_structure: {
    recall: [
      { prompt: "Define ionic bonding.", keywords: ["electrostatic attraction", "oppositely charged ions", "electron transfer"], maxScore: 2 },
      { prompt: "State two properties of giant ionic compounds.", keywords: ["high melting point", "conduct electricity when molten/dissolved", "strong electrostatic forces", "brittle"], maxScore: 2 },
      { prompt: "What is a hydrogen bond?", keywords: ["intermolecular force", "between H bonded to N/O/F", "lone pair", "electronegativity difference"], maxScore: 2 },
      { prompt: "Name the shape of a molecule with four bonding pairs and no lone pairs around the central atom.", keywords: ["tetrahedral", "109.5 degrees"], maxScore: 2 },
      { prompt: "State what is meant by a 'covalent bond'.", keywords: ["shared pair of electrons", "between two atoms"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why the boiling point of water (100C) is much higher than expected for a molecule of its size.", subskillIds: ["intermolecular_forces"], keywords: ["hydrogen bonds", "O-H bond polar", "high electronegativity of oxygen", "more energy to overcome", "stronger than van der Waals"], maxScore: 4 },
      { prompt: "Diamond and graphite are both forms of carbon. Explain why graphite conducts electricity but diamond does not.", subskillIds: ["giant_structures"], keywords: ["graphite has delocalised electrons", "free to move", "carry charge", "diamond: all four electrons in covalent bonds", "no free electrons"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Compare and contrast ionic, covalent, and metallic bonding in terms of structure, bonding, and properties. (6 marks)", subskillIds: ["ionic_bonding", "covalent_bonding", "metallic_bonding"], keywords: ["electron transfer", "shared pair", "delocalised electrons", "high melting point", "conductivity", "lattice"], maxScore: 6, rubricPoints: ["Ionic: transfer of electrons forming ions; electrostatic attraction in a giant lattice", "Covalent: shared pair(s) of electrons between non-metal atoms; can be simple molecular or giant covalent", "Metallic: delocalised electrons in a sea around positive metal ions; electrostatic attraction", "Ionic compounds: high mp, conduct when molten/dissolved, brittle", "Simple covalent: low mp (weak intermolecular forces), don't conduct; Giant covalent: very high mp", "Metallic: conduct electricity (delocalised electrons), malleable, variable mp depending on charge/radius"] },
    ],
  },
  states_of_matter: {
    recall: [
      { prompt: "State the ideal gas equation.", keywords: ["pV = nRT", "pressure", "volume", "moles", "gas constant", "temperature"], maxScore: 2 },
      { prompt: "What is the molar volume of a gas at room temperature and pressure (RTP)?", keywords: ["24 dm3", "24000 cm3"], maxScore: 1 },
      { prompt: "State the value and units of the gas constant R.", keywords: ["8.314", "J mol-1 K-1"], maxScore: 2 },
    ],
    application: [
      { prompt: "Calculate the volume of 0.5 mol of gas at RTP.", subskillIds: ["molar_volume"], keywords: ["0.5 x 24", "12 dm3", "molar volume"], maxScore: 2 },
      { prompt: "A gas occupies 2.0 dm3 at 300 K and 100 kPa. Calculate the number of moles. (R = 8.314 J mol-1 K-1)", subskillIds: ["ideal_gas"], keywords: ["pV = nRT", "n = pV/RT", "100000 x 0.002 / (8.314 x 300)", "0.080 mol"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Explain why real gases deviate from ideal gas behaviour at high pressures and low temperatures, and describe the assumptions of the ideal gas model. (6 marks)", subskillIds: ["real_vs_ideal", "ideal_gas"], keywords: ["no intermolecular forces", "negligible volume", "high pressure", "low temperature", "molecules closer", "forces significant"], maxScore: 6, rubricPoints: ["Ideal gas assumptions: molecules have negligible volume; no intermolecular forces between molecules", "At high pressure: molecules forced closer together, volume of molecules becomes significant compared to container", "Intermolecular forces become significant when molecules are close together", "At low temperature: molecules have less kinetic energy, intermolecular forces have greater effect", "Molecules attract each other, reducing pressure exerted on container walls", "Real gases behave most like ideal gases at high temperature and low pressure"] },
    ],
  },
  stoichiometry: {
    recall: [
      { prompt: "Calculate the relative formula mass (Mr) of calcium carbonate, CaCO3. (Ar: Ca=40, C=12, O=16)", keywords: ["40 + 12 + 48", "100"], maxScore: 2 },
      { prompt: "Define the term 'limiting reagent'.", keywords: ["reactant", "completely used up", "determines amount of product"], maxScore: 2 },
      { prompt: "State the formula used to calculate moles from mass.", keywords: ["n = m / M", "moles = mass / molar mass"], maxScore: 1 },
      { prompt: "What is meant by 'percentage yield'?", keywords: ["actual yield / theoretical yield", "x 100"], maxScore: 2 },
      { prompt: "Balance this equation: Fe + O2 -> Fe2O3", keywords: ["4Fe", "3O2", "2Fe2O3"], maxScore: 2 },
    ],
    application: [
      { prompt: "5.00 g of calcium carbonate (CaCO3) is decomposed by heating: CaCO3 -> CaO + CO2. Calculate the mass of CaO produced. (Ar: Ca=40, C=12, O=16)", subskillIds: ["mole_calculations", "stoichiometric_ratio"], keywords: ["Mr CaCO3 = 100", "moles = 5/100 = 0.05", "1:1 ratio", "Mr CaO = 56", "mass = 0.05 x 56 = 2.80 g"], maxScore: 4 },
      { prompt: "A student reacts 2.43 g of magnesium with excess hydrochloric acid. Mg + 2HCl -> MgCl2 + H2. Calculate the volume of hydrogen gas produced at RTP. (Ar: Mg=24)", subskillIds: ["mole_calculations", "stoichiometric_ratio"], keywords: ["moles Mg = 2.43/24 = 0.10125", "1:1 ratio with H2", "volume = 0.10125 x 24", "2.43 dm3"], maxScore: 4 },
    ],
    extended: [
      { prompt: "A student adds 0.50 g of magnesium to 50 cm3 of 0.40 mol/dm3 hydrochloric acid. Mg + 2HCl -> MgCl2 + H2. Determine which reagent is in excess, calculate the volume of H2 produced at RTP, and explain why the actual yield might be less than expected. (6 marks)", subskillIds: ["mole_calculations", "stoichiometric_ratio", "limiting_reagent", "percentage_yield"], keywords: ["moles Mg", "moles HCl", "ratio", "limiting reagent", "volume", "percentage yield"], maxScore: 6, rubricPoints: ["Moles Mg = 0.50/24 = 0.0208 mol", "Moles HCl = 0.40 x 0.050 = 0.020 mol", "Ratio requires 2 mol HCl per mol Mg; 0.0208 mol Mg needs 0.0417 mol HCl; only 0.020 available so HCl is limiting", "Moles H2 = 0.020/2 = 0.010 mol (from HCl ratio)", "Volume H2 = 0.010 x 24 = 0.24 dm3", "Actual yield lower because: gas escapes, incomplete reaction, side reactions, measurement errors"] },
    ],
  },
  energetics: {
    recall: [
      { prompt: "Define the term 'exothermic reaction'.", keywords: ["releases energy", "to surroundings", "negative delta H", "temperature increase"], maxScore: 2 },
      { prompt: "State whether bond breaking is exothermic or endothermic.", keywords: ["endothermic", "requires energy"], maxScore: 1 },
      { prompt: "Write the equation used in calorimetry to calculate energy change.", keywords: ["q = mcDT", "mass", "specific heat capacity", "temperature change"], maxScore: 2 },
      { prompt: "State Hess's law.", keywords: ["total enthalpy change", "independent of route", "same start and end", "constant"], maxScore: 2 },
    ],
    application: [
      { prompt: "Use the following bond energies to calculate the enthalpy change for: H2 + Cl2 -> 2HCl. Bond energies: H-H = 436 kJ/mol, Cl-Cl = 242 kJ/mol, H-Cl = 431 kJ/mol.", subskillIds: ["bond_energies"], keywords: ["bonds broken = 436 + 242 = 678", "bonds formed = 2 x 431 = 862", "delta H = 678 - 862 = -184 kJ/mol", "exothermic"], maxScore: 4 },
      { prompt: "50 cm3 of 1.0 mol/dm3 HCl was mixed with 50 cm3 of 1.0 mol/dm3 NaOH. The temperature rose by 6.8C. Calculate the enthalpy of neutralisation. (c = 4.18 J/g/K, density = 1 g/cm3)", subskillIds: ["calorimetry"], keywords: ["q = 100 x 4.18 x 6.8", "q = 2842.4 J", "moles = 0.05", "delta H = -2842.4/0.05 = -56848 J/mol", "-56.8 kJ/mol"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Describe how Hess's law can be used to calculate the enthalpy of formation of methane, given that the enthalpies of combustion of carbon, hydrogen and methane are known. Include a Hess's law cycle. (6 marks)", subskillIds: ["hess_law", "enthalpy_changes"], keywords: ["Hess's law", "enthalpy cycle", "combustion data", "alternative route", "formation", "calculation"], maxScore: 6, rubricPoints: ["State Hess's law: total enthalpy change is independent of route taken", "Write formation equation: C(s) + 2H2(g) -> CH4(g)", "Draw Hess cycle: formation route vs combustion route (both ending at CO2 + H2O)", "Route 1: direct formation (unknown)", "Route 2: combustion of elements minus combustion of product", "DeltaHf = sum of combustion of elements - combustion of CH4; calculation with given values"] },
    ],
  },
  kinetics: {
    recall: [
      { prompt: "State two conditions needed for a successful collision.", keywords: ["sufficient energy", "activation energy", "correct orientation"], maxScore: 2 },
      { prompt: "Define the term 'activation energy'.", keywords: ["minimum energy", "required", "for a reaction to occur", "successful collision"], maxScore: 2 },
      { prompt: "How does a catalyst increase the rate of reaction?", keywords: ["alternative pathway", "lower activation energy", "not consumed", "unchanged"], maxScore: 2 },
      { prompt: "State the effect of increasing temperature on the rate of reaction.", keywords: ["increases rate", "more kinetic energy", "more successful collisions"], maxScore: 2 },
    ],
    application: [
      { prompt: "Using the Boltzmann distribution, explain why a small increase in temperature causes a large increase in reaction rate.", subskillIds: ["boltzmann", "activation_energy"], keywords: ["distribution shifts right", "more molecules exceed Ea", "greater proportion", "more successful collisions", "exponential increase"], maxScore: 4 },
      { prompt: "Explain why increasing the concentration of a reactant in solution increases the rate of reaction.", subskillIds: ["collision_theory", "factors_rate"], keywords: ["more particles per unit volume", "more frequent collisions", "more successful collisions per unit time", "rate increases"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe and explain how temperature and the use of a catalyst affect the rate of a chemical reaction. Include references to the Boltzmann distribution and activation energy in your answer. (6 marks)", subskillIds: ["boltzmann", "activation_energy", "catalysts"], keywords: ["Boltzmann distribution", "activation energy", "proportion of molecules", "catalyst", "alternative pathway", "lower Ea"], maxScore: 6, rubricPoints: ["At higher temperature, molecules have more kinetic energy on average", "Boltzmann distribution shifts right; more molecules exceed activation energy Ea", "Greater proportion of successful collisions per unit time, so rate increases", "A catalyst provides an alternative reaction pathway with a lower activation energy", "On the Boltzmann distribution, a lower Ea means more molecules have energy >= Ea", "Catalyst speeds up both forward and reverse reactions equally; does not change equilibrium position"] },
    ],
  },
  equilibrium: {
    recall: [
      { prompt: "State two conditions needed for dynamic equilibrium.", keywords: ["closed system", "forward rate equals reverse rate", "concentrations constant"], maxScore: 2 },
      { prompt: "Write the Kc expression for: N2(g) + 3H2(g) <=> 2NH3(g).", keywords: ["[NH3]^2 / ([N2][H2]^3)", "products over reactants", "stoichiometric powers"], maxScore: 2 },
      { prompt: "State Le Chatelier's principle.", keywords: ["system opposes", "change", "counteract", "restore equilibrium"], maxScore: 2 },
      { prompt: "What happens to Kc when temperature increases for an exothermic reaction?", keywords: ["Kc decreases", "equilibrium shifts left", "favours endothermic direction"], maxScore: 2 },
    ],
    application: [
      { prompt: "For the reaction N2O4(g) <=> 2NO2(g), at equilibrium [N2O4] = 0.10 mol/dm3 and [NO2] = 0.40 mol/dm3. Calculate Kc and state its units.", subskillIds: ["kc_calculation", "kc_units"], keywords: ["Kc = [NO2]^2 / [N2O4]", "0.40^2 / 0.10", "0.16 / 0.10", "1.6", "mol/dm3"], maxScore: 4 },
      { prompt: "The Haber process (N2 + 3H2 <=> 2NH3) is exothermic. Explain the effect of increasing pressure on the equilibrium position and yield of ammonia.", subskillIds: ["le_chatelier"], keywords: ["increased pressure", "shifts to fewer moles", "4 moles to 2 moles", "shifts right", "more ammonia", "yield increases"], maxScore: 3 },
    ],
    extended: [
      { prompt: "The industrial production of sulfuric acid uses the Contact Process: 2SO2(g) + O2(g) <=> 2SO3(g), DeltaH = -196 kJ/mol. Discuss the conditions used (temperature, pressure, catalyst) and explain the compromises made between rate and yield. (6 marks)", subskillIds: ["le_chatelier", "kc_calculation"], keywords: ["exothermic", "low temperature favours yield", "high temperature needed for rate", "compromise 450C", "high pressure favours fewer moles", "V2O5 catalyst"], maxScore: 6, rubricPoints: ["Exothermic reaction: lower temperature shifts equilibrium right (more SO3), increasing yield", "But low temperature gives slow rate, so compromise of ~450C used", "3 moles gas on left, 2 on right: high pressure shifts equilibrium right, increasing yield", "But high pressure is expensive and dangerous, so moderate pressure (~2 atm) used", "V2O5 catalyst used to increase rate without affecting equilibrium position", "Catalyst allows acceptable rate at lower temperature, improving both rate and yield"] },
    ],
  },
  acid_base: {
    recall: [
      { prompt: "Define a strong acid.", keywords: ["fully dissociates", "in water", "all molecules ionise"], maxScore: 2 },
      { prompt: "Calculate the pH of a 0.01 mol/dm3 HCl solution.", keywords: ["pH = -log[H+]", "-log(0.01)", "pH = 2"], maxScore: 2 },
      { prompt: "What is a buffer solution?", keywords: ["resists change in pH", "when small amounts of acid or base added", "weak acid and conjugate base"], maxScore: 2 },
      { prompt: "State what is measured in a titration.", keywords: ["volume", "of one solution", "to react exactly", "with known volume of another"], maxScore: 2 },
    ],
    application: [
      { prompt: "25.0 cm3 of 0.10 mol/dm3 NaOH required 20.0 cm3 of HCl to reach the endpoint. Calculate the concentration of HCl.", subskillIds: ["titrations"], keywords: ["moles NaOH = 0.10 x 0.025 = 0.0025", "1:1 ratio", "moles HCl = 0.0025", "conc = 0.0025/0.020", "0.125 mol/dm3"], maxScore: 4 },
      { prompt: "Explain why ethanoic acid (CH3COOH) has a higher pH than hydrochloric acid of the same concentration.", subskillIds: ["weak_acids"], keywords: ["ethanoic acid is a weak acid", "partially dissociates", "fewer H+ ions in solution", "HCl fully dissociates", "lower [H+] means higher pH"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Explain how an ethanoic acid/sodium ethanoate buffer solution maintains a relatively constant pH when small amounts of acid or alkali are added. (6 marks)", subskillIds: ["buffers", "weak_acids"], keywords: ["weak acid", "conjugate base", "equilibrium", "H+ ions", "OH- ions", "Le Chatelier"], maxScore: 6, rubricPoints: ["Buffer contains weak acid (CH3COOH) and its conjugate base (CH3COO-) from sodium ethanoate", "When acid (H+) added: CH3COO- + H+ -> CH3COOH; excess H+ removed by conjugate base", "Equilibrium shifts to left, removing added H+, so pH barely changes", "When alkali (OH-) added: CH3COOH + OH- -> CH3COO- + H2O; weak acid neutralises OH-", "Equilibrium shifts to right to replace used acid", "Effective because large reservoir of both weak acid and conjugate base to absorb changes"] },
    ],
  },
  redox: {
    recall: [
      { prompt: "Define oxidation in terms of electron transfer.", keywords: ["loss of electrons", "OIL", "oxidation is loss"], maxScore: 2 },
      { prompt: "State the oxidation state of sulfur in H2SO4.", keywords: ["+6"], maxScore: 1 },
      { prompt: "What is a half-equation?", keywords: ["shows either oxidation or reduction", "separately", "electrons shown"], maxScore: 2 },
      { prompt: "State the oxidation state of iron in Fe2O3.", keywords: ["+3"], maxScore: 1 },
    ],
    application: [
      { prompt: "In the reaction: Zn + CuSO4 -> ZnSO4 + Cu, identify the species being oxidised and the species being reduced. Explain your reasoning.", subskillIds: ["redox_identification", "oxidation_states"], keywords: ["Zn is oxidised", "loses electrons", "0 to +2", "Cu2+ is reduced", "gains electrons", "+2 to 0"], maxScore: 4 },
      { prompt: "Write a balanced ionic equation for the reaction between zinc and copper(II) sulfate. Include state symbols.", subskillIds: ["half_equations"], keywords: ["Zn(s) + Cu2+(aq) -> Zn2+(aq) + Cu(s)", "spectator ions removed", "SO42- not included"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe and explain redox reactions using the examples of rusting of iron and the displacement of copper by zinc. Include half-equations in your answer. (6 marks)", subskillIds: ["half_equations", "redox_identification", "oxidation_states"], keywords: ["oxidation", "reduction", "electron transfer", "half-equations", "oxidation states change"], maxScore: 6, rubricPoints: ["Rusting: iron loses electrons (Fe -> Fe2+ + 2e-); iron is oxidised", "Oxygen gains electrons (O2 + 4e- -> 2O2-); oxygen is reduced", "Overall: iron reacts with oxygen and water to form hydrated iron(III) oxide", "Displacement: Zn -> Zn2+ + 2e- (oxidation); zinc is more reactive, loses electrons", "Cu2+ + 2e- -> Cu (reduction); copper ions gain electrons and form copper metal", "In both cases: oxidation and reduction occur simultaneously (redox); electron transfer from more reactive to less reactive species"] },
    ],
  },
  organic_1: {
    recall: [
      { prompt: "What is meant by a 'functional group'?", keywords: ["group of atoms", "determines chemical properties", "reactive part of molecule"], maxScore: 2 },
      { prompt: "Name the functional group present in alkenes.", keywords: ["C=C", "carbon-carbon double bond"], maxScore: 1 },
      { prompt: "What is the general formula of an alkane?", keywords: ["CnH2n+2"], maxScore: 1 },
      { prompt: "Define the term 'structural isomers'.", keywords: ["same molecular formula", "different structural formula", "different arrangement of atoms"], maxScore: 2 },
      { prompt: "What type of reaction occurs between an alkene and bromine water?", keywords: ["electrophilic addition", "addition reaction"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why alkenes are more reactive than alkanes.", subskillIds: ["alkenes", "alkanes"], keywords: ["C=C double bond", "pi bond", "high electron density", "attracts electrophiles", "alkanes only have sigma bonds", "less reactive"], maxScore: 3 },
      { prompt: "Draw and name two structural isomers of C4H10.", subskillIds: ["isomerism"], keywords: ["butane", "methylpropane", "straight chain", "branched"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe the mechanism of free radical substitution of methane with chlorine, including initiation, propagation and termination steps. Explain why a mixture of products is formed. (6 marks)", subskillIds: ["free_radical", "alkanes"], keywords: ["initiation", "UV light", "homolytic fission", "Cl radicals", "propagation", "chain reaction", "termination"], maxScore: 6, rubricPoints: ["Initiation: Cl2 -> 2Cl* (UV light causes homolytic fission of Cl-Cl bond)", "Propagation step 1: CH4 + Cl* -> CH3* + HCl (H abstracted from methane)", "Propagation step 2: CH3* + Cl2 -> CH3Cl + Cl* (regenerates Cl radical)", "Termination: two radicals combine (Cl* + Cl* -> Cl2, or CH3* + Cl* -> CH3Cl)", "Mixture of products because CH3Cl can undergo further substitution to form CH2Cl2, CHCl3, CCl4", "This is because the propagation steps can repeat with the chlorinated products (further H substitution)"] },
    ],
  },
  organic_2: {
    recall: [
      { prompt: "What is a nucleophile?", keywords: ["electron pair donor", "lone pair", "attacks positive/electron-deficient centre"], maxScore: 2 },
      { prompt: "Name the type of reaction that converts a halogenoalkane to an alcohol using aqueous NaOH.", keywords: ["nucleophilic substitution"], maxScore: 1 },
      { prompt: "State the conditions needed to oxidise a primary alcohol to an aldehyde.", keywords: ["acidified potassium dichromate", "distillation", "heat"], maxScore: 2 },
      { prompt: "What is the role of a curly arrow in a mechanism?", keywords: ["shows movement", "of electron pair", "from nucleophile to electrophile"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain why the rate of hydrolysis of halogenoalkanes decreases in the order C-I > C-Br > C-Cl.", subskillIds: ["halogenoalkanes"], keywords: ["bond enthalpy", "C-I weakest bond", "C-Cl strongest bond", "weaker bond breaks more easily", "lower activation energy"], maxScore: 3 },
      { prompt: "A primary alcohol can be oxidised to an aldehyde or a carboxylic acid. Explain how you would control which product is formed.", subskillIds: ["alcohols"], keywords: ["distillation for aldehyde", "removes aldehyde as formed", "reflux for carboxylic acid", "keeps aldehyde in mixture", "further oxidation"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Compare nucleophilic substitution and elimination reactions of halogenoalkanes. Explain the conditions that favour each reaction and the products formed. (6 marks)", subskillIds: ["nucleophilic_sub", "elimination"], keywords: ["nucleophilic substitution", "elimination", "aqueous NaOH", "ethanolic NaOH", "alcohol product", "alkene product"], maxScore: 6, rubricPoints: ["Nucleophilic substitution: halogen replaced by nucleophile (e.g., OH-)", "Conditions: aqueous NaOH, warm; NaOH acts as nucleophile", "Product: alcohol (halogen replaced by OH group)", "Elimination: HX removed from halogenoalkane to form C=C double bond", "Conditions: ethanolic NaOH, hot; NaOH acts as base", "Product: alkene; the choice of solvent (aqueous vs ethanolic) determines which reaction dominates"] },
    ],
  },
  organic_3: {
    recall: [
      { prompt: "Name the reagent used to test for an aldehyde.", keywords: ["Tollens reagent", "silver mirror", "ammoniacal silver nitrate"], maxScore: 2 },
      { prompt: "What type of reaction produces an ester?", keywords: ["esterification", "condensation", "acid + alcohol"], maxScore: 2 },
      { prompt: "State one use of esters.", keywords: ["perfumes", "flavourings", "solvents", "plasticisers"], maxScore: 1 },
      { prompt: "What is meant by a 'condensation polymer'?", keywords: ["monomers join", "losing small molecule", "water or HCl"], maxScore: 2 },
    ],
    application: [
      { prompt: "Explain how you would distinguish between an aldehyde and a ketone using a simple chemical test.", subskillIds: ["aldehydes_ketones", "analytical_tests"], keywords: ["Tollens reagent", "aldehyde gives silver mirror", "ketone gives no reaction", "aldehyde is more easily oxidised"], maxScore: 3 },
      { prompt: "Write the equation for the formation of an ester from ethanol and ethanoic acid. Name the ester and state the catalyst.", subskillIds: ["esters", "carboxylic_acids"], keywords: ["CH3COOH + CH3CH2OH", "CH3COOCH2CH3 + H2O", "ethyl ethanoate", "concentrated sulfuric acid catalyst"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Compare addition polymerisation and condensation polymerisation, giving examples of each. Explain why condensation polymers are biodegradable but addition polymers are not. (6 marks)", subskillIds: ["polymers", "esters"], keywords: ["addition polymer", "condensation polymer", "alkene monomer", "bifunctional", "small molecule lost", "biodegradable"], maxScore: 6, rubricPoints: ["Addition polymerisation: alkene monomers join by opening C=C double bond; no small molecule lost", "Example: poly(ethene) from ethene; poly(chloroethene) from chloroethene", "Condensation polymerisation: bifunctional monomers (e.g., diol + dicarboxylic acid); water lost", "Example: polyester (e.g., Terylene); polyamide (e.g., nylon)", "Addition polymers have strong C-C backbone with no easily hydrolysable bonds; non-biodegradable", "Condensation polymers have ester/amide links that can be hydrolysed by water/enzymes; biodegradable"] },
    ],
  },
  synthesis_analysis: {
    recall: [
      { prompt: "In mass spectrometry, what does the molecular ion peak (M+) tell you?", keywords: ["relative molecular mass", "Mr", "of the compound"], maxScore: 2 },
      { prompt: "In IR spectroscopy, what does a broad absorption around 2500-3300 cm-1 indicate?", keywords: ["O-H bond", "carboxylic acid", "broad peak"], maxScore: 2 },
      { prompt: "What is meant by 'chemical shift' in NMR spectroscopy?", keywords: ["position of peak", "relative to TMS", "indicates chemical environment"], maxScore: 2 },
    ],
    application: [
      { prompt: "A compound has Mr = 46 (from mass spec), a broad O-H absorption in IR, and shows 3 peaks in 1H NMR. Suggest a possible structure.", subskillIds: ["combined_analysis", "mass_spec", "ir_spectroscopy"], keywords: ["ethanol", "CH3CH2OH", "Mr 46 matches", "O-H from alcohol", "3 different H environments"], maxScore: 4 },
      { prompt: "Describe the reagents and conditions needed to convert ethanol to ethanoic acid in two steps.", subskillIds: ["synthesis_routes"], keywords: ["step 1: oxidise to ethanal", "acidified dichromate and distil", "step 2: oxidise to ethanoic acid", "acidified dichromate and reflux"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Describe how you would use mass spectrometry, IR spectroscopy, and NMR to identify an unknown organic compound. Explain what information each technique provides. (6 marks)", subskillIds: ["mass_spec", "ir_spectroscopy", "nmr_basics", "combined_analysis"], keywords: ["mass spec", "molecular ion", "Mr", "fragmentation", "IR", "functional groups", "NMR", "chemical environments"], maxScore: 6, rubricPoints: ["Mass spectrometry: molecular ion peak gives Mr; fragmentation pattern shows structural fragments", "Use Mr to determine molecular formula (with composition data)", "IR spectroscopy: identifies functional groups present (e.g., O-H, C=O, N-H absorptions)", "Can distinguish between carboxylic acid (broad O-H ~2500-3300) and alcohol (broad O-H ~3200-3550)", "NMR: number of peaks shows different hydrogen environments; integration gives ratio of H atoms", "Splitting pattern shows number of H on adjacent carbons; combine all data to determine full structure"] },
    ],
  },
  // ─── Mathematics Topics ───

  algebra_functions: {
    recall: [
      { prompt: "Simplify √48.", keywords: ["4√3", "√(16×3)", "4 times root 3"], maxScore: 2 },
      { prompt: "State the value of 8^(2/3).", keywords: ["4", "cube root of 8 is 2", "2 squared is 4"], maxScore: 1 },
      { prompt: "State the condition on the discriminant for a quadratic equation to have two distinct real roots.", keywords: ["b^2 - 4ac > 0", "discriminant greater than zero"], maxScore: 2 },
      { prompt: "What does x^0 equal for any non-zero x?", keywords: ["1", "x^0 = 1"], maxScore: 1 },
      { prompt: "State the quadratic formula.", keywords: ["x = (-b ± √(b²-4ac)) / 2a", "negative b", "plus or minus", "square root", "2a"], maxScore: 2 },
    ],
    application: [
      { prompt: "Solve x² - 5x + 6 = 0 by factorising.", subskillIds: ["quadratics"], keywords: ["(x-2)(x-3) = 0", "x = 2", "x = 3", "factorise"], maxScore: 3 },
      { prompt: "Find the set of values of x for which x² - 4x - 5 < 0.", subskillIds: ["inequalities"], keywords: ["(x-5)(x+1) < 0", "critical values -1 and 5", "-1 < x < 5"], maxScore: 4 },
      { prompt: "Rationalise the denominator of 3/(2 + √5).", subskillIds: ["surds_indices"], keywords: ["multiply by conjugate", "2 - √5", "3(2-√5)/(4-5)", "-3(2-√5)", "or equivalent", "-6 + 3√5"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Prove by contradiction that √2 is irrational. (6 marks)", subskillIds: ["proof"], keywords: ["assume rational", "p/q in lowest terms", "2q² = p²", "p is even", "q is even", "contradiction"], maxScore: 6, rubricPoints: ["Assume √2 is rational, so √2 = p/q where p and q are integers with no common factors", "Then 2 = p²/q², so p² = 2q²", "Therefore p² is even, which means p must be even (since odd² is odd)", "Let p = 2k, then (2k)² = 2q², so 4k² = 2q², giving q² = 2k²", "Therefore q² is even, so q is also even", "Both p and q are even — contradicts the assumption they share no common factors, so √2 is irrational"] },
      { prompt: "Complete the square for 2x² - 12x + 7 and hence state the minimum value and the value of x at which it occurs. (6 marks)", subskillIds: ["quadratics"], keywords: ["2(x² - 6x) + 7", "2(x-3)² - 18 + 7", "2(x-3)² - 11", "minimum -11", "at x = 3"], maxScore: 6, rubricPoints: ["Factor out 2: 2(x² - 6x) + 7", "Complete the square inside: 2(x - 3)² - 9) + 7", "Expand: 2(x-3)² - 18 + 7", "Simplify: 2(x-3)² - 11", "Minimum value is -11 (since (x-3)² ≥ 0)", "Occurs when x = 3"] },
    ],
  },
  differentiation_1: {
    recall: [
      { prompt: "Differentiate y = x⁵ with respect to x.", keywords: ["5x⁴", "5x^4", "power rule"], maxScore: 1 },
      { prompt: "What is the derivative of sin(x)?", keywords: ["cos(x)", "cos x"], maxScore: 1 },
      { prompt: "State the product rule for differentiation.", keywords: ["d/dx(uv) = u(dv/dx) + v(du/dx)", "u'v + uv'"], maxScore: 2 },
      { prompt: "What is the derivative of e^x?", keywords: ["e^x", "same function"], maxScore: 1 },
      { prompt: "State the chain rule.", keywords: ["dy/dx = dy/du × du/dx", "f'(g(x)) × g'(x)", "composite function"], maxScore: 2 },
    ],
    application: [
      { prompt: "Find dy/dx when y = 3x⁴ - 2x² + 7x - 1.", subskillIds: ["power_rule"], keywords: ["12x³", "- 4x", "+ 7", "12x^3 - 4x + 7"], maxScore: 3 },
      { prompt: "Find the gradient of the curve y = x³ - 6x + 2 at the point where x = 2.", subskillIds: ["tangents_normals"], keywords: ["dy/dx = 3x² - 6", "substitute x = 2", "3(4) - 6 = 6", "gradient = 6"], maxScore: 4 },
      { prompt: "Differentiate y = (3x + 1)⁵ using the chain rule.", subskillIds: ["chain_product_quotient"], keywords: ["5(3x+1)⁴", "× 3", "15(3x+1)⁴"], maxScore: 3 },
    ],
    extended: [
      { prompt: "Find the stationary points of y = 2x³ - 9x² + 12x - 4 and determine their nature using the second derivative test. (6 marks)", subskillIds: ["stationary_points", "power_rule"], keywords: ["dy/dx = 6x² - 18x + 12", "6(x² - 3x + 2)", "x = 1, x = 2", "d²y/dx² = 12x - 18", "maximum at x = 1", "minimum at x = 2"], maxScore: 6, rubricPoints: ["Differentiate: dy/dx = 6x² - 18x + 12", "Set equal to 0: 6(x² - 3x + 2) = 0, so (x-1)(x-2) = 0", "Stationary points at x = 1 and x = 2", "Second derivative: d²y/dx² = 12x - 18", "At x = 1: d²y/dx² = -6 < 0, so maximum; y = 2-9+12-4 = 1 → maximum at (1, 1)", "At x = 2: d²y/dx² = 6 > 0, so minimum; y = 16-36+24-4 = 0 → minimum at (2, 0)"] },
      { prompt: "The curve y = x² - 4x + 3 has a tangent at the point P(1, 0). Find the equation of the tangent and the equation of the normal at P. (6 marks)", subskillIds: ["tangents_normals", "power_rule"], keywords: ["dy/dx = 2x - 4", "at x=1: gradient = -2", "tangent: y = -2x + 2", "normal gradient = 1/2", "normal: y = (1/2)x - 1/2"], maxScore: 6, rubricPoints: ["Differentiate: dy/dx = 2x - 4", "At P(1,0): gradient = 2(1) - 4 = -2", "Tangent: y - 0 = -2(x - 1), so y = -2x + 2", "Normal gradient = negative reciprocal = 1/2", "Normal: y - 0 = (1/2)(x - 1), so y = (1/2)x - 1/2", "Both equations pass through P(1, 0) — verify by substitution"] },
    ],
  },
  integration_1: {
    recall: [
      { prompt: "Integrate x³ with respect to x.", keywords: ["x⁴/4 + c", "x^4/4 + c", "divide by new power", "add constant"], maxScore: 2 },
      { prompt: "What is the integral of cos(x)?", keywords: ["sin(x) + c", "sin x + c"], maxScore: 1 },
      { prompt: "What is the integral of 1/x?", keywords: ["ln|x| + c", "natural log of x", "absolute value"], maxScore: 2 },
      { prompt: "State the integral of e^x.", keywords: ["e^x + c", "same function plus c"], maxScore: 1 },
      { prompt: "Why must you include '+ c' in indefinite integration?", keywords: ["constant of integration", "family of curves", "derivative of constant is 0", "unknown constant"], maxScore: 2 },
    ],
    application: [
      { prompt: "Evaluate the definite integral ∫₁³ (2x + 1) dx.", subskillIds: ["definite_integrals"], keywords: ["x² + x", "from 1 to 3", "(9+3) - (1+1)", "12 - 2 = 10"], maxScore: 3 },
      { prompt: "Find ∫(4x³ - 6x + 2) dx.", subskillIds: ["indefinite_integrals"], keywords: ["x⁴ - 3x² + 2x + c", "x^4", "- 3x^2", "+ 2x", "+ c"], maxScore: 3 },
      { prompt: "Find the area between the curve y = x² and the x-axis from x = 0 to x = 3.", subskillIds: ["area_under_curve"], keywords: ["∫₀³ x² dx", "x³/3", "from 0 to 3", "27/3 - 0 = 9", "area = 9"], maxScore: 4 },
    ],
    extended: [
      { prompt: "Find the area enclosed between the curve y = x² - 4 and the x-axis. (6 marks)", subskillIds: ["area_under_curve", "definite_integrals"], keywords: ["find where y = 0", "x = -2, x = 2", "∫₋₂² (x²-4) dx", "negative area", "take absolute value", "area = 32/3"], maxScore: 6, rubricPoints: ["Find x-intercepts: x² - 4 = 0 → x = ±2", "Set up integral: ∫₋₂² (x² - 4) dx", "Integrate: [x³/3 - 4x] from -2 to 2", "Evaluate: (8/3 - 8) - (-8/3 + 8) = -32/3", "Area is below x-axis so take absolute value", "Area = 32/3 ≈ 10.67 square units"] },
      { prompt: "Use the trapezium rule with 4 strips to estimate ∫₀² √(1 + x²) dx. Give your answer to 3 decimal places. (6 marks)", subskillIds: ["trapezium_rule"], keywords: ["h = 0.5", "y₀ = 1", "y₁, y₂, y₃, y₄", "trapezium rule formula", "h/2[y₀ + 2(y₁+y₂+y₃) + y₄]"], maxScore: 6, rubricPoints: ["Strip width h = (2-0)/4 = 0.5", "Calculate y-values: y₀ = √1 = 1, y₁ = √1.25 ≈ 1.118, y₂ = √2 ≈ 1.414, y₃ = √3.25 ≈ 1.803, y₄ = √5 ≈ 2.236", "Apply formula: (0.5/2)[1 + 2(1.118 + 1.414 + 1.803) + 2.236]", "= 0.25[1 + 2(4.335) + 2.236]", "= 0.25[1 + 8.670 + 2.236] = 0.25 × 11.906", "≈ 2.977 (to 3 d.p.)"] },
    ],
  },
  statistics_1: {
    recall: [
      { prompt: "State the formula for the mean of a data set.", keywords: ["sum of values", "divided by", "number of values", "Σx / n"], maxScore: 1 },
      { prompt: "What is the condition for events A and B to be independent?", keywords: ["P(A∩B) = P(A) × P(B)", "P(A|B) = P(A)", "occurrence of one does not affect the other"], maxScore: 2 },
      { prompt: "State the mean of the binomial distribution X ~ B(n, p).", keywords: ["np", "n times p"], maxScore: 1 },
      { prompt: "What is a null hypothesis?", keywords: ["statement assumed true", "no effect", "no difference", "to be tested", "H₀"], maxScore: 2 },
      { prompt: "State two conditions for a binomial distribution to be a suitable model.", keywords: ["fixed number of trials", "two outcomes", "constant probability", "independent trials"], maxScore: 2 },
    ],
    application: [
      { prompt: "A fair die is rolled 60 times. Let X be the number of sixes. State the distribution of X and find P(X = 10).", subskillIds: ["binomial_distribution"], keywords: ["X ~ B(60, 1/6)", "P(X=10) = 60C10 × (1/6)^10 × (5/6)^50", "binomial formula"], maxScore: 4 },
      { prompt: "Two events A and B are mutually exclusive with P(A) = 0.3 and P(B) = 0.4. Find P(A ∪ B).", subskillIds: ["probability"], keywords: ["P(A∪B) = P(A) + P(B)", "0.3 + 0.4 = 0.7", "mutually exclusive so P(A∩B) = 0"], maxScore: 3 },
      { prompt: "A manufacturer claims that 5% of items are defective. A sample of 20 is tested and 3 are found defective. State suitable hypotheses and test at the 5% significance level whether the defect rate has increased.", subskillIds: ["hypothesis_testing"], keywords: ["H₀: p = 0.05", "H₁: p > 0.05", "X ~ B(20, 0.05)", "P(X ≥ 3)", "compare with 0.05", "one-tailed"], maxScore: 4 },
    ],
    extended: [
      { prompt: "A student is taking a multiple choice test with 20 questions, each having 4 options. The student guesses every answer randomly. (a) State the distribution for the number of correct answers. (b) Find the probability of getting exactly 5 correct. (c) Find the probability of passing if the pass mark is 10. Comment on the student's chances. (6 marks)", subskillIds: ["binomial_distribution", "probability"], keywords: ["X ~ B(20, 0.25)", "P(X=5) = 20C5 × 0.25^5 × 0.75^15", "P(X ≥ 10)", "very low probability", "unlikely to pass by guessing"], maxScore: 6, rubricPoints: ["X ~ B(20, 0.25) where n = 20, p = 1/4 = 0.25", "P(X = 5) = 20C5 × 0.25⁵ × 0.75¹⁵ ≈ 0.2023", "For pass: need P(X ≥ 10) = 1 - P(X ≤ 9)", "Using cumulative binomial tables or calculation", "P(X ≥ 10) ≈ 0.0139 (very small)", "The student is very unlikely to pass by guessing alone — only ~1.4% chance"] },
      { prompt: "Explain the process of hypothesis testing for a binomial distribution. Include the concepts of null hypothesis, alternative hypothesis, significance level, and critical region. Give an example. (6 marks)", subskillIds: ["hypothesis_testing"], keywords: ["H₀", "H₁", "significance level", "critical region", "p-value", "reject or fail to reject"], maxScore: 6, rubricPoints: ["State null hypothesis H₀ (the default claim about parameter p) and alternative H₁", "Choose significance level (e.g., 5% or 1%) — probability of incorrectly rejecting H₀", "Under H₀, X follows B(n, p₀); calculate probability of observed or more extreme result", "Critical region: set of values that lead to rejecting H₀", "If observed value falls in critical region (or p-value < significance level), reject H₀", "Example: testing if a coin is biased — H₀: p=0.5, H₁: p≠0.5, observe 18 heads in 20 tosses, likely reject H₀"] },
    ],
  },
};

// ─── Helpers ───

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTopicQuestions(topicId, phase) {
  const bank = questionBank[topicId];
  if (!bank) {
    // Fallback chain: biology → chemistry → mathematics
    return questionBank.enzymes?.[phase] || questionBank.atomic_structure?.[phase] || questionBank.algebra_functions?.[phase] || [];
  }
  return bank[phase] || [];
}

function getSubskillsForTopic(topicId, topics = []) {
  const topic = topics.find(t => t.id === topicId);
  return topic?.subskills?.map(s => s.id) || [];
}

// ─── Mock API: Generate Question ───

export function mockGenerateQuestion({ topicId, phase, difficulty = 3, examBoard = 'generic', topics = [] }) {
  const questions = getTopicQuestions(topicId, phase);
  if (questions.length === 0) {
    return { success: false, error: `No questions for topic '${topicId}' phase '${phase}'` };
  }

  const q = pickRandom(questions);
  const subskillIds = q.subskillIds || [getSubskillsForTopic(topicId, topics)[0] || topicId];

  return {
    success: true,
    data: {
      questionId: `q_${topicId}_${phase}_${uuidv4().slice(0, 8)}`,
      topicId,
      subskillIds,
      phase,
      difficulty,
      examBoard,
      format: phase === 'recall' ? 'short' : phase === 'extended' ? 'extended' : 'short',
      prompt: q.prompt,
      dataIncluded: null,
      choices: null,
      marking: {
        type: phase === 'extended' ? 'rubric' : 'keyword',
        maxScore: q.maxScore,
        rubricPoints: q.rubricPoints || null,
        keywords: q.keywords,
        commonErrors: [],
      },
      hint: `Think about the key terms: ${q.keywords.slice(0, 2).join(', ')}.`,
    },
  };
}

// ─── Mock API: Mark Answer ───

export function mockMarkAnswer({ questionId, studentAnswer, phase, difficulty = 3, rubric }) {
  const answer = (studentAnswer || '').toLowerCase().trim();
  const keywords = rubric?.keywords || [];
  const maxScore = rubric?.maxScore || 6;

  // Simple keyword matching for mock
  let matchedKeywords = [];
  let missedKeywords = [];
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (answer.includes(kwLower) || answer.includes(kwLower.split(' ')[0])) {
      matchedKeywords.push(kw);
    } else {
      missedKeywords.push(kw);
    }
  });

  // Score based on keyword coverage
  const coverage = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
  let score;
  if (phase === 'extended') {
    score = Math.round(coverage * maxScore);
  } else {
    // For recall/application: more binary but still partial credit
    score = Math.round(coverage * maxScore);
  }

  // Bonus for longer, more detailed answers
  if (phase === 'extended' && answer.length > 200 && score < maxScore) {
    score = Math.min(maxScore, score + 1);
  }

  const correct = score >= maxScore * 0.7;

  return {
    success: true,
    data: {
      questionId,
      score,
      maxScore,
      correct,
      rationale: score >= maxScore * 0.8
        ? 'Strong answer with good use of scientific terminology.'
        : score >= maxScore * 0.5
          ? 'Partial answer — some key points covered but missing detail.'
          : 'Weak answer — key concepts and terminology missing.',
      feedback: {
        whatYouDidWell: matchedKeywords.length > 0
          ? matchedKeywords.map(k => `Correctly identified: ${k}`)
          : ['You attempted the question — keep going!'],
        missingPoints: missedKeywords.map(k => `Missing concept: ${k}`),
        incorrectPoints: [],
        howToImprove: missedKeywords.length > 0
          ? [`Focus on these terms: ${missedKeywords.slice(0, 3).join(', ')}`, 'Use cause → effect chains in your explanations.']
          : ['Well done — try to add more detail next time.'],
        modelAnswer: rubric?.rubricPoints
          ? rubric.rubricPoints.join('. ') + '.'
          : `Key points: ${keywords.join(', ')}.`,
      },
      tags: {
        topicId: questionId.split('_')[1] || 'unknown',
        subskillIds: [],
        errorTypes: missedKeywords.length > 0 ? ['missing_keyword'] : [],
        errorKeywords: missedKeywords,
      },
    },
  };
}

// ─── Mock API: Recommend Next Action ───

export function mockRecommendNextAction({ lastBattleResult, masteryData, recentHistory, topics = [] }) {
  const topicMasteries = Object.entries(masteryData || {});

  if (topicMasteries.length === 0) {
    const firstTopic = topics[0];
    return {
      success: true,
      data: {
        nextAction: 'start_new_topic',
        topic: { id: firstTopic?.id || 'biological_molecules', name: firstTopic?.name || 'Biological Molecules' },
        reason: `Welcome! Start with ${firstTopic?.name || 'Biological Molecules'} — it's a high-yield foundation topic.`,
        difficulty: 2,
        focusSubskills: [],
        drillLength: null,
        estimatedTimeMin: 15,
      },
    };
  }

  // Find weakest topic — mastery value may be a number or an object with .topicMastery
  const getMasteryValue = (v) => typeof v === 'number' ? v : (v?.topicMastery ?? 0);
  const weakest = topicMasteries.sort((a, b) => getMasteryValue(a[1]) - getMasteryValue(b[1]))[0];
  const weakTopicId = weakest[0];
  const weakMastery = getMasteryValue(weakest[1]);
  const topic = topics.find(t => t.id === weakTopicId);

  // If just did this topic and errors, recommend targeted drill
  if (lastBattleResult?.topicId === weakTopicId && lastBattleResult.score < lastBattleResult.maxScore * 0.7) {
    return {
      success: true,
      data: {
        nextAction: 'targeted_drill',
        topic: { id: weakTopicId, name: topic?.name || weakTopicId },
        reason: `You missed key points on ${topic?.name || weakTopicId}. A short drill will reinforce the weak areas.`,
        difficulty: 2,
        focusSubskills: lastBattleResult.errorTypes || [],
        drillLength: 3,
        estimatedTimeMin: 5,
      },
    };
  }

  // Otherwise recommend weakest topic
  return {
    success: true,
    data: {
      nextAction: weakMastery < 0.3 ? 'start_new_topic' : 'battle',
      topic: { id: weakTopicId, name: topic?.name || weakTopicId },
      reason: `${topic?.name || weakTopicId} is your weakest area (mastery: ${(weakMastery * 100).toFixed(0)}%). Time to strengthen it.`,
      difficulty: weakMastery < 0.4 ? 2 : 3,
      focusSubskills: [],
      drillLength: null,
      estimatedTimeMin: 15,
    },
  };
}

// ─── Mock API: Generate Study Guide ───

export function mockGenerateStudyGuide({ topicId, topicName, subskills = [], masteryScore, weakSubskills = [], errorPatterns = [] }) {
  const subskillNames = subskills.map(s => typeof s === 'string' ? s : s.name || 'Key concept');

  const weakFocus = weakSubskills.length > 0
    ? weakSubskills.map(s => ({
        subskill: s,
        issue: `You have been consistently losing marks on questions involving ${s}.`,
        howToFix: `Review the core definitions and practise with short recall questions on ${s} before attempting application questions.`,
      }))
    : [{ subskill: topicName, issue: 'No specific weak spots identified yet.', howToFix: 'Keep practising across all subskills to build a strong foundation.' }];

  if (errorPatterns.length > 0) {
    errorPatterns.slice(0, 2).forEach(ep => {
      weakFocus.push({
        subskill: ep,
        issue: `Recurring error: "${ep}" has appeared multiple times in your answers.`,
        howToFix: `Focus on understanding the distinction around "${ep}". Write out definitions from memory and compare with a textbook.`,
      });
    });
  }

  return {
    success: true,
    data: {
      topicId,
      topicName,
      summary: `This study guide covers ${topicName} for your A-level revision. ${masteryScore != null ? `Your current mastery is ${Math.round(masteryScore * 100)}%. ` : ''}Focus on the key concepts below and use the worked examples to test your understanding.`,
      keyConceptCards: subskillNames.slice(0, 4).map(name => ({
        title: name,
        explanation: `This is a core concept within ${topicName}. Make sure you understand the definitions, can explain the processes involved, and can apply your knowledge to unfamiliar scenarios. Practise writing concise definitions from memory.`,
        examTip: 'Always use precise scientific terminology in your answers. Examiners award marks for specific keywords from the mark scheme.',
      })),
      workedExamples: [
        {
          question: `Explain one key process in ${topicName}. (4 marks)`,
          answer: `A strong answer would include: correct terminology, a clear cause-and-effect chain, reference to specific structures or molecules involved, and a concluding statement linking back to the question. Each mark typically corresponds to one key point from the mark scheme.`,
          marks: 4,
        },
        {
          question: `Describe and explain a concept related to ${subskillNames[0] || topicName}. (6 marks)`,
          answer: `For 6-mark questions, plan your answer first. Include: an introduction stating the key idea, 4-5 detailed points with scientific terminology, cause-and-effect reasoning, and a brief conclusion. Use paragraphs and logical flow to demonstrate understanding.`,
          marks: 6,
        },
      ],
      examTips: [
        'Use diagrams to support your written answers where relevant.',
        'Read the question carefully — "describe" means state what happens; "explain" means state what happens AND why.',
        `For ${topicName}, examiners commonly look for precise use of key terms.`,
        'In extended response questions, plan your answer before writing to ensure a logical structure.',
        'Show all working in calculation questions — you can earn method marks even if the final answer is wrong.',
      ],
      weakSpotFocus: weakFocus,
      generatedAt: new Date().toISOString(),
    },
  };
}
