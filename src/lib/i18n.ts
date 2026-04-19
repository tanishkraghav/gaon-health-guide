// Minimal i18n with 8 languages used by Swasthya Sathi.
// Each key holds the primary string in the selected language; English shown alongside in UI.

export type LangCode = "hi" | "en" | "bho" | "or" | "bn" | "mr" | "ta" | "te";

export interface LanguageDef {
  code: LangCode;
  label: string; // native name
  english: string;
  speechCode: string; // BCP-47 for Web Speech API
}

export const LANGUAGES: LanguageDef[] = [
  { code: "hi", label: "हिन्दी", english: "Hindi", speechCode: "hi-IN" },
  { code: "en", label: "English", english: "English", speechCode: "en-IN" },
  { code: "bho", label: "भोजपुरी", english: "Bhojpuri", speechCode: "hi-IN" },
  { code: "or", label: "ଓଡ଼ିଆ", english: "Odia", speechCode: "or-IN" },
  { code: "bn", label: "বাংলা", english: "Bengali", speechCode: "bn-IN" },
  { code: "mr", label: "मराठी", english: "Marathi", speechCode: "mr-IN" },
  { code: "ta", label: "தமிழ்", english: "Tamil", speechCode: "ta-IN" },
  { code: "te", label: "తెలుగు", english: "Telugu", speechCode: "te-IN" },
];

type Dict = Record<string, Partial<Record<LangCode, string>> & { en: string }>;

export const dict: Dict = {
  appName: {
    en: "Swasthya Sathi",
    hi: "स्वास्थ्य साथी",
    bho: "स्वास्थ्य साथी",
    or: "ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ",
    bn: "স্বাস্থ্য সাথী",
    mr: "स्वास्थ्य साथी",
    ta: "ஸ்வாஸ்த்ய சாதி",
    te: "స్వాస్థ్య సాథి",
  },
  tagline: {
    en: "Your health companion",
    hi: "आपका स्वास्थ्य साथी",
    bho: "रउरा के स्वास्थ्य साथी",
    or: "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ",
    bn: "আপনার স্বাস্থ্য সঙ্গী",
    mr: "तुमचा आरोग्य साथी",
    ta: "உங்கள் சுகாதார துணை",
    te: "మీ ఆరోగ్య సహచరుడు",
  },
  iAmPatient: { en: "I am a Patient", hi: "मैं मरीज़ हूँ", bho: "हम मरीज़ हईं", or: "ମୁଁ ଜଣେ ରୋଗୀ", bn: "আমি একজন রোগী", mr: "मी रुग्ण आहे", ta: "நான் ஒரு நோயாளி", te: "నేను రోగిని" },
  iAmAsha: { en: "I am an ASHA Worker", hi: "मैं आशा कार्यकर्ता हूँ", bho: "हम आशा कार्यकर्ता हईं", or: "ମୁଁ ଆଶା କର୍ମୀ", bn: "আমি একজন আশা কর্মী", mr: "मी आशा कार्यकर्ती आहे", ta: "நான் ஆஷா பணியாளர்", te: "నేను ఆశా కార్యకర్తను" },
  tapAndSpeak: {
    en: "Tap and speak your symptoms",
    hi: "दबाएँ और अपने लक्षण बताएँ",
    bho: "दबाईं अउर लक्षण बताईं",
    or: "ଚାପନ୍ତୁ ଓ ଲକ୍ଷଣ କୁହନ୍ତୁ",
    bn: "চাপুন এবং উপসর্গ বলুন",
    mr: "दाबा आणि लक्षणे सांगा",
    ta: "தட்டி அறிகுறிகளை சொல்லுங்கள்",
    te: "నొక్కి మీ లక్షణాలను చెప్పండి",
  },
  recentVisits: { en: "Recent visits", hi: "हाल की मुलाक़ातें" },
  switchToText: { en: "Switch to text", hi: "टाइप करें" },
  feelBetter: { en: "I feel better", hi: "मैं बेहतर हूँ" },
  symptomsWorsened: { en: "Symptoms worsened", hi: "लक्षण बढ़ गए" },
  notifyHerComing: { en: "Notify her I'm coming", hi: "उन्हें सूचित करें" },
  callAmbulance: { en: "Call ambulance", hi: "एम्बुलेंस बुलाएँ" },
  villageName: { en: "Village name", hi: "गाँव का नाम" },
  phoneNumber: { en: "Phone number", hi: "फ़ोन नंबर" },
  workerId: { en: "NHM Worker ID", hi: "एनएचएम कार्यकर्ता आईडी" },
  pin: { en: "PIN", hi: "पिन" },
  continue: { en: "Continue", hi: "जारी रखें" },
  selectLanguage: { en: "Select language", hi: "भाषा चुनें" },
  offlineBanner: { en: "Offline mode — basic features available", hi: "ऑफ़लाइन मोड — बुनियादी सुविधाएँ" },
  homeCare: { en: "Home care", hi: "घर पर देखभाल" },
  visitAsha: { en: "Visit ASHA worker", hi: "आशा कार्यकर्ता से मिलें" },
  goHospital: { en: "Go to hospital urgently", hi: "तुरंत अस्पताल जाएँ" },
};

export function t(key: keyof typeof dict, lang: LangCode): string {
  const entry = dict[key];
  return entry[lang] || entry.en;
}
