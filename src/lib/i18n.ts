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

  // Onboarding
  workerIdNotFound: {
    en: "This Worker ID is not registered with Swasthya Sathi. Please contact your PHC supervisor.",
    hi: "यह कार्यकर्ता आईडी पंजीकृत नहीं है। कृपया अपने पीएचसी पर्यवेक्षक से संपर्क करें।",
    bho: "ई वर्कर आईडी रजिस्टर ना बा। आपन पीएचसी सुपरवाइज़र से संपर्क करीं।",
    or: "ଏହି ୱର୍କର୍ ଆଇଡି ପଞ୍ଜିକୃତ ନୁହେଁ। ଦୟାକରି PHC ସୁପରଭାଇଜରଙ୍କୁ ଯୋଗାଯୋଗ କରନ୍ତୁ।",
    bn: "এই ওয়ার্কার আইডি নিবন্ধিত নয়। আপনার PHC সুপারভাইজারের সাথে যোগাযোগ করুন।",
    mr: "ही वर्कर आयडी नोंदणीकृत नाही. कृपया तुमच्या PHC पर्यवेक्षकाशी संपर्क साधा.",
    ta: "இந்த பணியாளர் ஐடி பதிவு செய்யப்படவில்லை. உங்கள் PHC மேற்பார்வையாளரை தொடர்பு கொள்ளவும்.",
    te: "ఈ వర్కర్ ID నమోదు కాలేదు. మీ PHC పర్యవేక్షకుని సంప్రదించండి.",
  },
  firstTimeHint: {
    en: "First time? Enter your government-issued Worker ID to get started.",
    hi: "पहली बार? शुरू करने के लिए अपनी सरकारी कार्यकर्ता आईडी दर्ज करें।",
    bho: "पहिला बेर? आपन सरकारी वर्कर आईडी डालीं।",
    or: "ପ୍ରଥମ ଥର? ଆପଣଙ୍କ ସରକାରୀ ୱର୍କର୍ ଆଇଡି ଦିଅନ୍ତୁ।",
    bn: "প্রথমবার? আপনার সরকারি ওয়ার্কার আইডি লিখুন।",
    mr: "पहिल्यांदा? तुमची सरकारी वर्कर आयडी टाका.",
    ta: "முதல் முறையா? உங்கள் அரசு வழங்கிய பணியாளர் ஐடியை உள்ளிடவும்.",
    te: "మొదటిసారా? మీ ప్రభుత్వ వర్కర్ ID నమోదు చేయండి.",
  },
  sendOtpTo: {
    en: "We will send an OTP to",
    hi: "हम ओटीपी भेजेंगे",
    bho: "हम ओटीपी भेजब",
    or: "ଆମେ OTP ପଠାଇବୁ",
    bn: "আমরা OTP পাঠাব",
    mr: "आम्ही OTP पाठवू",
    ta: "OTP அனுப்புவோம்",
    te: "OTP పంపుతాము",
  },
  sendOtp: { en: "Send OTP", hi: "ओटीपी भेजें", bho: "ओटीपी भेजीं", or: "OTP ପଠାନ୍ତୁ", bn: "OTP পাঠান", mr: "OTP पाठवा", ta: "OTP அனுப்பு", te: "OTP పంపండి" },
  verifyOtp: { en: "Verify OTP", hi: "ओटीपी सत्यापित करें", bho: "ओटीपी जाँचीं", or: "OTP ଯାଞ୍ଚ", bn: "OTP যাচাই", mr: "OTP तपासा", ta: "OTP சரிபார்க்க", te: "OTP నిర్ధారించండి" },
  demoOtp: { en: "Demo OTP: 1234", hi: "डेमो ओटीपी: 1234", bho: "डेमो ओटीपी: 1234", or: "ଡେମୋ OTP: 1234", bn: "ডেমো OTP: 1234", mr: "डेमो OTP: 1234", ta: "டெமோ OTP: 1234", te: "డెమో OTP: 1234" },
  createPin: { en: "Create your 4-digit PIN", hi: "अपना 4-अंकीय पिन बनाएँ", bho: "आपन 4 अंक के पिन बनाईं", or: "ଆପଣଙ୍କ 4-ଅଙ୍କ PIN ତିଆରି କରନ୍ତୁ", bn: "আপনার 4-সংখ্যার PIN তৈরি করুন", mr: "तुमचा 4-अंकी PIN तयार करा", ta: "உங்கள் 4-இலக்க PIN உருவாக்கவும்", te: "మీ 4-అంకెల PIN సృష్టించండి" },
  newPin: { en: "New PIN", hi: "नया पिन", bho: "नया पिन", or: "ନୂଆ PIN", bn: "নতুন PIN", mr: "नवीन PIN", ta: "புதிய PIN", te: "కొత్త PIN" },
  confirmPin: { en: "Confirm PIN", hi: "पिन की पुष्टि करें", bho: "पिन फिर से डालीं", or: "PIN ନିଶ୍ଚିତ କରନ୍ତୁ", bn: "PIN নিশ্চিত করুন", mr: "PIN ची पुष्टी", ta: "PIN உறுதிசெய்க", te: "PIN నిర్ధారించండి" },
  pinsDoNotMatch: { en: "PINs do not match", hi: "पिन मेल नहीं खाते", bho: "पिन मेल ना खाता", or: "PIN ମେଳ ଖାଉନାହିଁ", bn: "PIN মিলছে না", mr: "PIN जुळत नाही", ta: "PIN பொருந்தவில்லை", te: "PINలు సరిపోలడం లేదు" },
  completeProfile: { en: "Complete Your Profile", hi: "अपनी प्रोफ़ाइल पूरी करें", bho: "आपन प्रोफ़ाइल पूरा करीं", or: "ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ", bn: "আপনার প্রোফাইল সম্পূর্ণ করুন", mr: "तुमची प्रोफाइल पूर्ण करा", ta: "உங்கள் சுயவிவரத்தை நிறைவு செய்யவும்", te: "మీ ప్రొఫైల్ పూర్తి చేయండి" },
  fullName: { en: "Full Name", hi: "पूरा नाम", bho: "पूरा नाम", or: "ପୁରା ନାମ", bn: "পূর্ণ নাম", mr: "पूर्ण नाव", ta: "முழு பெயர்", te: "పూర్తి పేరు" },
  district: { en: "District", hi: "ज़िला", bho: "जिला", or: "ଜିଲ୍ଲା", bn: "জেলা", mr: "जिल्हा", ta: "மாவட்டம்", te: "జిల్లా" },
  block: { en: "Block", hi: "ब्लॉक", bho: "ब्लॉक", or: "ବ୍ଲକ୍", bn: "ব্লক", mr: "ब्लॉक", ta: "வட்டம்", te: "బ్లాక్" },
  village: { en: "Village", hi: "गाँव", bho: "गाँव", or: "ଗ୍ରାମ", bn: "গ্রাম", mr: "गाव", ta: "கிராமம்", te: "గ్రామం" },
  households: { en: "Households under care", hi: "देखरेख वाले परिवार", bho: "देखरेख वाला परिवार", or: "ତତ୍ତ୍ୱାବଧାନରେ ଥିବା ପରିବାର", bn: "তত্ত্বাবধানে থাকা পরিবার", mr: "देखभाल असलेली कुटुंबे", ta: "பராமரிப்பில் உள்ள குடும்பங்கள்", te: "సంరక్షణలోని కుటుంబాలు" },
  forgotPin: { en: "Forgot PIN?", hi: "पिन भूल गए?", bho: "पिन भुला गइनी?", or: "PIN ଭୁଲିଗଲେ?", bn: "PIN ভুলে গেছেন?", mr: "PIN विसरलात?", ta: "PIN மறந்துவிட்டதா?", te: "PIN మర్చిపోయారా?" },
  saveAndContinue: { en: "Save & Continue", hi: "सहेजें और जारी रखें", bho: "सहेजीं अउर आगू बढ़ीं", or: "ସଞ୍ଚୟ କରନ୍ତୁ ଓ ଆଗକୁ ବଢ଼ନ୍ତୁ", bn: "সংরক্ষণ ও চালিয়ে যান", mr: "जतन करा व पुढे जा", ta: "சேமித்து தொடரவும்", te: "సేవ్ & కొనసాగించండి" },
  stepVerifyPhone: { en: "Verify Phone", hi: "फ़ोन सत्यापन", bho: "फोन जाँच", or: "ଫୋନ୍ ଯାଞ୍ଚ", bn: "ফোন যাচাই", mr: "फोन तपासणी", ta: "தொலைபேசி சரிபார்ப்பு", te: "ఫోన్ నిర్ధారణ" },
  stepSetPin: { en: "Set PIN", hi: "पिन बनाएँ", bho: "पिन बनाईं", or: "PIN ସେଟ୍ କରନ୍ତୁ", bn: "PIN সেট", mr: "PIN सेट", ta: "PIN அமை", te: "PIN సెట్" },
  stepProfile: { en: "Your Profile", hi: "आपकी प्रोफ़ाइल", bho: "आपन प्रोफ़ाइल", or: "ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍", bn: "আপনার প্রোফাইল", mr: "तुमची प्रोफाइल", ta: "உங்கள் சுயவிவரம்", te: "మీ ప్రొఫైల్" },
  incorrectOtp: { en: "Incorrect OTP. Please try again.", hi: "ग़लत ओटीपी। पुनः प्रयास करें।", bho: "ग़लत ओटीपी, फिर कोशिश करीं।", or: "ଭୁଲ OTP, ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।", bn: "ভুল OTP, আবার চেষ্টা করুন।", mr: "चुकीचा OTP, पुन्हा प्रयत्न करा.", ta: "தவறான OTP, மீண்டும் முயற்சிக்கவும்.", te: "తప్పు OTP, మళ్లీ ప్రయత్నించండి." },
  incorrectPin: { en: "Incorrect PIN. Please try again.", hi: "ग़लत पिन। पुनः प्रयास करें।", bho: "ग़लत पिन, फिर कोशिश करीं।", or: "ଭୁଲ PIN, ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।", bn: "ভুল PIN, আবার চেষ্টা করুন।", mr: "चुकीचा PIN, पुन्हा प्रयत्न करा.", ta: "தவறான PIN, மீண்டும் முயற்சிக்கவும்.", te: "తప్పు PIN, మళ్లీ ప్రయత్నించండి." },
};


export function t(key: keyof typeof dict, lang: LangCode): string {
  const entry = dict[key];
  return entry[lang] || entry.en;
}
