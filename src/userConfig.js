// ── User profiles ──────────────────────────────────────────────
export const USER_PROFILES = {
  harry: {
    displayName: "Harry",
    school: "Nord Anglia",
    location: "Abu Dhabi",
    yearGroup: "Year 10",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "french", "maths", "business", "history", "combined_science"],
    examDates: {},
    accent: "#60A5FA",
  },
  alexa: {
    displayName: "Alexa",
    school: "Millfield",
    location: "UK",
    yearGroup: "Year 11",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "edexcel_maths", "business"],
    examDates: {},
    accent: "#A78BFA",
  },
  zara: {
    displayName: "Zara",
    school: "Arbor School",
    location: "Dubai",
    yearGroup: "Year 11",
    board: "Edexcel IGCSE",
    subjectKeys: ["edexcel_maths", "edexcel_chemistry", "edexcel_physics"],
    parkedSubjectKeys: ["english", "business", "pe", "biology"],
    examDates: {
      edexcel_maths: "2026-11-02",      // placeholder: first week of November, confirm with Rich
      edexcel_chemistry: "2026-11-02",  // placeholder
      edexcel_physics: "2026-11-02",    // placeholder
    },
    accent: "#F472B6",
  },
  layla: {
    displayName: "Layla",
    school: "Arbor School",
    location: "Dubai",
    yearGroup: "Year 11",
    board: "Edexcel IGCSE",
    subjectKeys: ["edexcel_geography"],
    parkedSubjectKeys: ["english", "maths", "business", "psychology", "biology", "chemistry", "physics"],
    examDates: {
      edexcel_geography: "2026-11-02",  // placeholder: first week of November, confirm with Rich
    },
    accent: "#FB923C",
  },
  georgia: {
    displayName: "Georgia",
    school: "Jebel Ali School",
    location: "Dubai",
    yearGroup: "Year 8",
    board: "GCSE",
    subjectKeys: [
      "maths", "english_lang", "english_lit", "biology", "chemistry", "physics",
      "geography", "history", "computer_science", "spanish", "arabic",
    ],
    examDates: {},
    accent: "#34D399",
  },
};

// Harmonised subject accents: every subject card reads as one family.
export const SUBJECT_PALETTE = {
  maths: "#5BD0C3", english: "#A78BFA", english_lang: "#A78BFA", english_lit: "#C4B5FD",
  business: "#FFB45B", history: "#C9A27A", biology: "#5FD37A", chemistry: "#6FA8FF",
  physics: "#FF7A6B", geography: "#F2B84B", pe: "#FF6FA3", psychology: "#C78BF0",
  computer_science: "#4FD1C5", french: "#B48CF2", spanish: "#F0945B", arabic: "#E57373",
  combined_science: "#5FD37A",
};

// ── Cambridge IGCSE subjects ───────────────────────────────────
export const CAMBRIDGE_IGCSE_SUBJECTS = {
  english: {
    name: "English",
    icon: "BookOpen",
    color: "#A78BFA",
    board: "Cambridge IGCSE",
    topics: [
      "Reading (Explicit & Implicit)",
      "Analysing Language & Structure",
      "Directed Writing",
      "Writer's Effect",
      "Summary Writing",
      "Argumentative & Discursive Writing",
    ],
  },
  french: {
    name: "French",
    icon: "Languages",
    color: "#B48CF2",
    board: "Cambridge IGCSE",
    topics: [
      "Daily Life",
      "School & Future Plans",
      "Travel & Tourism",
      "Health & Fitness",
      "Environment & Social Issues",
      "Media & Technology",
    ],
  },
  spanish: {
    name: "Spanish",
    icon: "Languages",
    color: "#F0945B",
    board: "Cambridge IGCSE",
    topics: [
      "Daily Life",
      "School & Future Plans",
      "Travel & Tourism",
      "Health & Fitness",
      "Environment & Social Issues",
      "Media & Technology",
    ],
  },
  arabic: {
    name: "Arabic",
    icon: "Languages",
    color: "#E57373",
    board: "Cambridge IGCSE",
    topics: [
      "Daily Life",
      "School & Future Plans",
      "Travel & Tourism",
      "Health & Fitness",
      "Environment & Social Issues",
      "Media & Technology",
    ],
  },
  maths: {
    name: "Mathematics",
    icon: "Calculator",
    color: "#5BD0C3",
    board: "Cambridge IGCSE",
    hasTiers: true,
    topics: [
      "Number",
      "Algebra & Graphs",
      "Coordinate Geometry",
      "Geometry",
      "Mensuration",
      "Trigonometry",
      "Transformations & Vectors",
      "Probability",
      "Statistics",
    ],
  },
  business: {
    name: "Business",
    icon: "TrendingUp",
    color: "#FFB45B",
    board: "Cambridge IGCSE",
    topics: [
      "Understanding Business Activity",
      "People in Business",
      "Marketing",
      "Operations Management",
      "Financial Information & Decisions",
      "External Influences",
    ],
  },
  history: {
    name: "History",
    icon: "Landmark",
    color: "#C9A27A",
    board: "Cambridge IGCSE",
    topics: [
      "Peace Treaties 1919-23",
      "League of Nations",
      "Causes of WWII",
      "Cold War",
      "USA & Communism",
      "USSR's Control of Eastern Europe",
    ],
  },
  combined_science: {
    name: "Combined Science",
    icon: "Microscope",
    color: "#5FD37A",
    board: "Cambridge IGCSE",
    isCombined: true,
    branches: {
      biology: {
        name: "Biology",
        icon: "Microscope",
        color: "#5FD37A",
        topics: [
          "Cells, Molecules & Enzymes",
          "Plant Nutrition & Transport",
          "Human Nutrition & Transport",
          "Respiration & Gas Exchange",
          "Coordination & Response",
          "Reproduction & Inheritance",
          "Ecology",
        ],
      },
      chemistry: {
        name: "Chemistry",
        icon: "FlaskConical",
        color: "#6FA8FF",
        topics: [
          "States of Matter",
          "Atoms, Elements & Compounds",
          "Stoichiometry",
          "Electrochemistry",
          "Chemical Energetics",
          "Chemical Reactions & Rate",
          "Organic Chemistry",
        ],
      },
      physics: {
        name: "Physics",
        icon: "Atom",
        color: "#FF7A6B",
        topics: [
          "Motion, Forces & Energy",
          "Thermal Physics",
          "Waves & Light",
          "Electricity & Magnetism",
          "Nuclear Physics",
          "Space Physics",
        ],
      },
    },
  },
  biology: {
    name: "Biology",
    icon: "Microscope",
    color: "#5FD37A",
    board: "Cambridge IGCSE",
    topics: [
      "Cells, Molecules & Enzymes",
      "Plant Nutrition & Transport",
      "Human Nutrition & Transport",
      "Respiration & Gas Exchange",
      "Coordination & Response",
      "Reproduction & Inheritance",
      "Ecology",
    ],
  },
  chemistry: {
    name: "Chemistry",
    icon: "FlaskConical",
    color: "#6FA8FF",
    board: "Cambridge IGCSE",
    topics: [
      "States of Matter",
      "Atoms, Elements & Compounds",
      "Stoichiometry",
      "Electrochemistry",
      "Chemical Energetics",
      "Chemical Reactions & Rate",
      "Organic Chemistry",
    ],
  },
  physics: {
    name: "Physics",
    icon: "Atom",
    color: "#FF7A6B",
    board: "Cambridge IGCSE",
    topics: [
      "Motion, Forces & Energy",
      "Thermal Physics",
      "Waves & Light",
      "Electricity & Magnetism",
      "Nuclear Physics",
      "Space Physics",
    ],
  },
  pe: {
    name: "PE",
    icon: "Dumbbell",
    color: "#FF6FA3",
    board: "Cambridge IGCSE",
    topics: [
      "Anatomy & Physiology",
      "Health, Fitness & Training",
      "Skill Acquisition & Psychology",
      "Social, Cultural & Ethical Issues",
      "Movement Analysis",
      "Physical Activity & Sport in Society",
    ],
  },
  psychology: {
    name: "Psychology",
    icon: "Brain",
    color: "#C78BF0",
    board: "Cambridge IGCSE",
    topics: [
      "Biological Approach",
      "Cognitive Approach",
      "Learning Approach",
      "Social Approach",
      "Research Methods",
      "Psychological Problems",
    ],
  },
  geography: {
    name: "Geography",
    icon: "Globe2",
    color: "#F2B84B",
    board: "Cambridge IGCSE",
    topics: [
      "Population & Settlement",
      "The Natural Environment",
      "Economic Development",
      "Geographical Skills & Investigations",
      "Weather & Climate",
      "Food Production & Water",
    ],
  },
};

// ── Edexcel IGCSE subjects (Alexa, Zara, Layla) ────────────────
export const EDEXCEL_IGCSE_SUBJECTS = {
  edexcel_maths: {
    name: "Mathematics",
    icon: "Calculator",
    color: "#5BD0C3",
    board: "Edexcel IGCSE",
    spec: {
      code: "4MA1",
      label: "Pearson Edexcel International GCSE Mathematics A (4MA1), Higher Tier",
      tier: "Higher",
      papers: "Paper 1H and Paper 2H, 2 hours each, 100 marks each, calculator allowed in both",
      notes: "Both papers are calculator papers but still test non-calculator fluency; full working must be shown. Use Edexcel International GCSE past-paper style, not Cambridge and not UK GCSE.",
      commandWords: ["Work out", "Calculate", "Solve", "Show that", "Find", "Express", "Simplify", "Prove", "Give a reason"],
    },
    sections: [
      { title: "Number and ratio", topics: ["Number", "Ratio, Proportion & Rates of Change"] },
      { title: "Algebra", topics: ["Algebra", "Graphs & Functions", "Calculus"] },
      { title: "Geometry and measure", topics: ["Shape, Space & Measure", "Mensuration", "Trigonometry", "Vectors & Transformations"] },
      { title: "Statistics", topics: ["Statistics & Probability"] },
    ],
    topics: [
      "Number", "Ratio, Proportion & Rates of Change", "Algebra", "Graphs & Functions",
      "Shape, Space & Measure", "Mensuration", "Trigonometry", "Vectors & Transformations",
      "Statistics & Probability", "Calculus",
    ],
  },

  edexcel_chemistry: {
    name: "Chemistry",
    icon: "FlaskConical",
    color: "#6FA8FF",
    board: "Edexcel IGCSE",
    spec: {
      code: "4CH1",
      label: "Pearson Edexcel International GCSE Chemistry (4CH1)",
      papers: "Paper 1C, 2 hours, 110 marks (61%), core content; Paper 2C, 1 hour 15 minutes, 70 marks (39%), core plus the bold Chemistry-only extension content at greater depth. Single tier.",
      notes: "Questions mix multiple choice, short answer, calculations and extended response. Include balanced symbol equations with state symbols where relevant, correct units, and standard Edexcel mark-scheme phrasing. Use Edexcel International GCSE past-paper style, not Cambridge and not UK GCSE.",
      commandWords: ["State", "Describe", "Explain", "Calculate", "Give", "Suggest", "Deduce", "Compare", "Write", "Draw", "Evaluate"],
    },
    sections: [
      { title: "Section 1: Principles of chemistry", topics: [
        "States of matter, elements, compounds & mixtures",
        "Atomic structure & the periodic table",
        "Formulae, equations & calculations",
        "Ionic, covalent & metallic bonding",
        "Electrolysis",
      ]},
      { title: "Section 2: Inorganic chemistry", topics: [
        "Group 1, Group 7 & gases in the atmosphere",
        "Reactivity series & extraction of metals",
        "Acids, alkalis, titrations & salts",
        "Chemical tests",
      ]},
      { title: "Section 3: Physical chemistry", topics: [
        "Energetics",
        "Rates of reaction & equilibria",
      ]},
      { title: "Section 4: Organic chemistry", topics: [
        "Crude oil, alkanes & alkenes",
        "Alcohols, carboxylic acids, esters & polymers",
      ]},
    ],
    topics: [
      "States of matter, elements, compounds & mixtures",
      "Atomic structure & the periodic table",
      "Formulae, equations & calculations",
      "Ionic, covalent & metallic bonding",
      "Electrolysis",
      "Group 1, Group 7 & gases in the atmosphere",
      "Reactivity series & extraction of metals",
      "Acids, alkalis, titrations & salts",
      "Chemical tests",
      "Energetics",
      "Rates of reaction & equilibria",
      "Crude oil, alkanes & alkenes",
      "Alcohols, carboxylic acids, esters & polymers",
    ],
  },

  edexcel_physics: {
    name: "Physics",
    icon: "Atom",
    color: "#FF7A6B",
    board: "Edexcel IGCSE",
    spec: {
      code: "4PH1",
      label: "Pearson Edexcel International GCSE Physics (4PH1)",
      papers: "Paper 1P, 2 hours, 110 marks (61%), core content; Paper 2P, 1 hour 15 minutes, 70 marks (39%), core plus the bold Physics-only extension content at greater depth. Single tier.",
      notes: "Questions mix multiple choice, short answer, calculations and extended response. Use the Edexcel equation sheet conventions, SI units, significant figures as in real mark schemes, and recall-and-apply equation questions. Use Edexcel International GCSE past-paper style, not Cambridge and not UK GCSE.",
      commandWords: ["State", "Describe", "Explain", "Calculate", "Give", "Suggest", "Show that", "Compare", "Draw", "Determine", "Evaluate"],
    },
    sections: [
      { title: "Section 1: Forces and motion", topics: [
        "Movement & position",
        "Forces, momentum & moments",
      ]},
      { title: "Section 2: Electricity", topics: [
        "Mains electricity & circuits",
        "Electric charge & static",
      ]},
      { title: "Section 3: Waves", topics: [
        "Properties of waves & the electromagnetic spectrum",
        "Light & sound",
      ]},
      { title: "Section 4: Energy resources and energy transfers", topics: [
        "Energy transfers, work & power",
        "Energy resources & electricity generation",
      ]},
      { title: "Section 5: Solids, liquids and gases", topics: [
        "Density, pressure, change of state & gas laws",
      ]},
      { title: "Section 6: Magnetism and electromagnetism", topics: [
        "Magnetism, electromagnetism & induction",
      ]},
      { title: "Section 7: Radioactivity and particles", topics: [
        "Radioactivity, fission & fusion",
      ]},
      { title: "Section 8: Astrophysics", topics: [
        "Motion in the universe, stellar evolution & cosmology",
      ]},
    ],
    topics: [
      "Movement & position",
      "Forces, momentum & moments",
      "Mains electricity & circuits",
      "Electric charge & static",
      "Properties of waves & the electromagnetic spectrum",
      "Light & sound",
      "Energy transfers, work & power",
      "Energy resources & electricity generation",
      "Density, pressure, change of state & gas laws",
      "Magnetism, electromagnetism & induction",
      "Radioactivity, fission & fusion",
      "Motion in the universe, stellar evolution & cosmology",
    ],
  },

  edexcel_geography: {
    name: "Geography",
    icon: "Globe2",
    color: "#F2B84B",
    board: "Edexcel IGCSE",
    spec: {
      code: "4GE1",
      label: "Pearson Edexcel International GCSE Geography (4GE1)",
      papers: "Paper 1 Physical Geography, 1 hour 10 minutes, 70 marks (40%); Paper 2 Human Geography and Global Issues, 1 hour 45 minutes, 105 marks (60%). Schools choose 2 of 3 physical topics, 2 of 3 human topics and 1 of 3 global issues; each paper includes a fieldwork section.",
      notes: "Questions progress from 1-mark identification through 2 to 4 mark describe/explain to 8-mark extended 'Evaluate' or 'Assess' responses with a level-based mark scheme. Use resource-based questions (maps, graphs, photos described in words), named located examples and case studies, and Edexcel International GCSE past-paper style, not Cambridge and not UK GCSE.",
      commandWords: ["Identify", "State", "Describe", "Explain", "Suggest", "Compare", "Calculate", "Assess", "Evaluate", "Examine", "Justify"],
    },
    sections: [
      { title: "Paper 1, Section A: Physical geography (your school chooses 2 of these 3)", choice: "2 of 3", topics: [
        "River environments",
        "Coastal environments",
        "Hazardous environments",
      ]},
      { title: "Paper 1, Section B: Physical fieldwork", topics: [
        "Physical fieldwork enquiry",
      ]},
      { title: "Paper 2, Section A: Human geography (your school chooses 2 of these 3)", choice: "2 of 3", topics: [
        "Economic activity & energy",
        "Rural environments",
        "Urban environments",
      ]},
      { title: "Paper 2, Section B: Human fieldwork", topics: [
        "Human fieldwork enquiry",
      ]},
      { title: "Paper 2, Section C: Global issues (your school chooses 1 of these 3)", choice: "1 of 3", topics: [
        "Fragile environments & climate change",
        "Globalisation & migration",
        "Development & human welfare",
      ]},
    ],
    topics: [
      "River environments",
      "Coastal environments",
      "Hazardous environments",
      "Physical fieldwork enquiry",
      "Economic activity & energy",
      "Rural environments",
      "Urban environments",
      "Human fieldwork enquiry",
      "Fragile environments & climate change",
      "Globalisation & migration",
      "Development & human welfare",
    ],
  },
};

// ── Generic GCSE subjects (Georgia) ────────────────────────────
export const GENERIC_SUBJECTS = {
  maths: {
    name: "Mathematics",
    icon: "Calculator",
    color: "#5BD0C3",
    board: "AQA / Edexcel / OCR",
    hasTiers: true,
    topics: [
      "Algebra & Equations",
      "Geometry & Measures",
      "Statistics & Probability",
      "Number & Ratio",
      "Graphs & Functions",
    ],
  },
  english_lang: {
    name: "English Language",
    icon: "BookOpen",
    color: "#A78BFA",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Reading Comprehension & Analysis",
      "Creative Writing",
      "Transactional Writing",
      "Language Techniques",
      "Comparing Texts",
    ],
  },
  english_lit: {
    name: "English Literature",
    icon: "BookOpen",
    color: "#C4B5FD",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Shakespeare",
      "19th Century Novel",
      "Modern Prose/Drama",
      "Poetry Anthology",
      "Unseen Poetry",
    ],
  },
  biology: {
    name: "Biology",
    icon: "Microscope",
    color: "#5FD37A",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Cell Biology & Organisation",
      "Infection & Response",
      "Bioenergetics",
      "Homeostasis & Response",
      "Inheritance & Evolution",
      "Ecology",
    ],
  },
  chemistry: {
    name: "Chemistry",
    icon: "FlaskConical",
    color: "#6FA8FF",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Atomic Structure & Bonding",
      "Quantitative Chemistry",
      "Chemical Changes",
      "Energy Changes",
      "Rate & Equilibrium",
      "Organic Chemistry",
    ],
  },
  physics: {
    name: "Physics",
    icon: "Atom",
    color: "#FF7A6B",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Energy & Forces",
      "Electricity",
      "Particle Model",
      "Atomic Structure & Radiation",
      "Waves & EM Spectrum",
      "Magnetism",
    ],
  },
  geography: {
    name: "Geography",
    icon: "Globe2",
    color: "#F2B84B",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Natural Hazards",
      "Living World (Ecosystems)",
      "Physical Landscapes (Rivers & Coasts)",
      "Urban Issues & Challenges",
      "Economic World",
      "Resource Management",
    ],
  },
  history: {
    name: "History",
    icon: "Landmark",
    color: "#C9A27A",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Medicine Through Time",
      "Elizabethan England",
      "Weimar & Nazi Germany",
      "Cold War",
      "Norman England",
      "American West",
    ],
  },
  computer_science: {
    name: "Computer Science",
    icon: "Monitor",
    color: "#4FD1C5",
    board: "AQA / OCR",
    topics: [
      "Computational Thinking & Algorithms",
      "Data Representation",
      "Computer Systems & Networks",
      "Programming Fundamentals",
      "Cyber Security",
      "Databases & SQL",
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────

const EXAM_WINDOW_DAYS = 60;

function resolveSubject(key) {
  return EDEXCEL_IGCSE_SUBJECTS[key] || CAMBRIDGE_IGCSE_SUBJECTS[key] || GENERIC_SUBJECTS[key] || null;
}

function parseLocalDate(dateString) {
  const [y, m, d] = String(dateString).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Whole days from today to dateString, local midnight to local midnight. Can be negative.
export function daysUntil(dateString) {
  const target = parseLocalDate(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function hasExamWithinWindow(profile) {
  return Object.values(profile.examDates || {}).some((d) => {
    const n = daysUntil(d);
    return n >= 0 && n <= EXAM_WINDOW_DAYS;
  });
}

export function getSubjectsForUser(userName) {
  const profile = USER_PROFILES[userName];
  if (!profile) return GENERIC_SUBJECTS;

  // null subjectKeys → full generic list
  if (!profile.subjectKeys) return GENERIC_SUBJECTS;

  // Parked subjects come back once the exam window has passed, so old progress is never lost.
  const keys = [...profile.subjectKeys];
  if (profile.parkedSubjectKeys && !hasExamWithinWindow(profile)) {
    for (const k of profile.parkedSubjectKeys) if (!keys.includes(k)) keys.push(k);
  }

  const out = {};
  for (const key of keys) {
    const subject = resolveSubject(key);
    if (subject) out[key] = subject;
  }
  return out;
}

// [{ key, subject, date, daysToGo }] for subjects with an upcoming exam date, nearest first.
export function getExamSubjectsForUser(userName) {
  const profile = USER_PROFILES[userName];
  if (!profile) return [];
  return Object.entries(profile.examDates || {})
    .map(([key, dateString]) => ({
      key,
      subject: resolveSubject(key),
      date: parseLocalDate(dateString),
      daysToGo: daysUntil(dateString),
    }))
    .filter((e) => e.subject && e.daysToGo >= 0)
    .sort((a, b) => a.date - b.date);
}

export function getNextExamForUser(userName) {
  return getExamSubjectsForUser(userName)[0] || null;
}

export function getNextExamAcrossUsers() {
  let best = null;
  for (const userName of Object.keys(USER_PROFILES)) {
    const next = getNextExamForUser(userName);
    if (next && (!best || next.date < best.date)) best = { userName, ...next };
  }
  return best;
}

// Every topic list in the UI renders through this. Returns [{ title, choice, branchKey, topics }].
export function getSubjectSections(subject) {
  if (!subject) return [];
  if (subject.sections) return subject.sections;
  if (subject.isCombined && subject.branches) {
    return Object.entries(subject.branches).map(([branchKey, b]) => ({
      title: b.name,
      branchKey,
      topics: b.topics,
    }));
  }
  return [{ title: null, topics: subject.topics || [] }];
}

export function getTotalTopicsCount(subjects) {
  let count = 0;
  for (const s of Object.values(subjects)) {
    if (s.isCombined && s.branches) {
      for (const branch of Object.values(s.branches)) {
        count += branch.topics.length;
      }
    } else {
      count += s.topics.length;
    }
  }
  return count;
}
