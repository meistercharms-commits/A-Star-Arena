import { v4 as uuidv4 } from 'uuid';
import topics from '../content/topics.json';

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
};

// ─── Helpers ───

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTopicQuestions(topicId, phase) {
  const bank = questionBank[topicId];
  if (!bank) return questionBank.enzymes[phase] || [];
  return bank[phase] || [];
}

function getSubskillsForTopic(topicId) {
  const topic = topics.find(t => t.id === topicId);
  return topic?.subskills?.map(s => s.id) || [];
}

// ─── Mock API: Generate Question ───

export function mockGenerateQuestion({ topicId, phase, difficulty = 3, examBoard = 'generic' }) {
  const questions = getTopicQuestions(topicId, phase);
  if (questions.length === 0) {
    return { success: false, error: `No questions for topic '${topicId}' phase '${phase}'` };
  }

  const q = pickRandom(questions);
  const subskillIds = q.subskillIds || [getSubskillsForTopic(topicId)[0] || topicId];

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
        ? 'Strong answer with good use of biological terminology.'
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

export function mockRecommendNextAction({ lastBattleResult, masteryData, recentHistory }) {
  const topicMasteries = Object.entries(masteryData || {});

  if (topicMasteries.length === 0) {
    return {
      success: true,
      data: {
        nextAction: 'start_new_topic',
        topic: { id: 'biological_molecules', name: 'Biological Molecules' },
        reason: 'Welcome! Start with Biological Molecules — it\'s a high-yield foundation topic.',
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
