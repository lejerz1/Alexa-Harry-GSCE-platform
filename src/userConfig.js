// ── User profiles ──────────────────────────────────────────────
export const USER_PROFILES = {
  harry: {
    displayName: "Harry",
    school: "Nord Anglia",
    location: "Abu Dhabi",
    yearGroup: "Year 10",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "french", "maths", "business", "history", "combined_science"],
  },
  alexa: {
    displayName: "Alexa",
    school: "Millfield",
    location: "UK",
    yearGroup: "Year 11",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "maths", "business"],
  },
  zara: {
    displayName: "Zara",
    school: "Arbor School",
    location: "Dubai",
    yearGroup: "Year 10",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "spanish", "maths", "business", "history", "combined_science"],
  },
  layla: {
    displayName: "Layla",
    school: "Arbor School",
    location: "Dubai",
    yearGroup: "Year 10",
    board: "Cambridge IGCSE",
    subjectKeys: ["english", "spanish", "maths", "business", "history", "combined_science"],
  },
  georgia: {
    displayName: "Georgia",
    school: "Arbor School",
    location: "Dubai",
    yearGroup: "Year 8",
    board: "GCSE",
    subjectKeys: null, // uses GENERIC_SUBJECTS
  },
};

// ── Cambridge IGCSE subjects ───────────────────────────────────
export const CAMBRIDGE_IGCSE_SUBJECTS = {
  english: {
    name: "English",
    icon: "✎",
    color: "#4ECDC4",
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
    icon: "🇫🇷",
    color: "#9B59B6",
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
    icon: "🇪🇸",
    color: "#E67E22",
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
    icon: "∑",
    color: "#4ECDC4",
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
    icon: "📊",
    color: "#F39C12",
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
    icon: "⏳",
    color: "#8E6F47",
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
    icon: "🔬",
    color: "#2ECC71",
    board: "Cambridge IGCSE",
    isCombined: true,
    branches: {
      biology: {
        name: "Biology",
        icon: "🧬",
        color: "#2ECC71",
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
        icon: "⚗",
        color: "#3498DB",
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
        icon: "⚛",
        color: "#E74C3C",
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
};

// ── Generic GCSE subjects (Georgia) ────────────────────────────
export const GENERIC_SUBJECTS = {
  maths: {
    name: "Mathematics",
    icon: "∑",
    color: "#4ECDC4",
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
    icon: "✎",
    color: "#4ECDC4",
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
    icon: "📖",
    color: "#9B59B6",
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
    icon: "🧬",
    color: "#2ECC71",
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
    icon: "⚗",
    color: "#3498DB",
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
    icon: "⚛",
    color: "#E74C3C",
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
    icon: "🌍",
    color: "#F39C12",
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
    icon: "⏳",
    color: "#8E6F47",
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
    icon: "💻",
    color: "#1ABC9C",
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

export function getSubjectsForUser(userName) {
  const profile = USER_PROFILES[userName];
  if (!profile) return GENERIC_SUBJECTS;

  // null subjectKeys → full generic list (Georgia)
  if (!profile.subjectKeys) return GENERIC_SUBJECTS;

  const out = {};
  for (const key of profile.subjectKeys) {
    if (CAMBRIDGE_IGCSE_SUBJECTS[key]) {
      out[key] = CAMBRIDGE_IGCSE_SUBJECTS[key];
    }
  }
  return out;
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
