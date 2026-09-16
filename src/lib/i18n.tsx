import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", short: "EN", label: "English", speech: "en-IN" },
  { code: "hi", short: "हिं", label: "हिन्दी", speech: "hi-IN" },
  { code: "mr", short: "मरा", label: "मराठी", speech: "mr-IN" },
  { code: "bn", short: "বাং", label: "বাংলা", speech: "bn-IN" },
  { code: "te", short: "తె", label: "తెలుగు", speech: "te-IN" },
  { code: "ta", short: "தமி", label: "தமிழ்", speech: "ta-IN" },
  { code: "kn", short: "ಕನ್", label: "ಕನ್ನಡ", speech: "kn-IN" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type Dict = Record<string, string>;

const en: Dict = {
  appName: "KisanSahayak",
  tagline: "Your field assistant",
  greeting: "Namaste",
  chooseLanguage: "Choose your language",
  scanTitle: "Check a plant for disease",
  scanSubtitle: "Point your camera at a leaf, or send a photo you already have.",
  scanPlant: "Scan plant",
  uploadPhoto: "Upload a photo",
  scanResult: "Scan result",
  whatToDo: "What to do",
  severity: "Severity",
  analysing: "Reading the leaf…",
  growMore: "Grow more this season",
  askByVoice: "Ask by voice",
  voiceSubtitle: "Speak naturally. We answer in your language.",
  tapButton: "Tap the button",
  andSpeak: "and start talking about your crop.",
  pastScans: "Your past scans",
  seeAll: "See all",
  noScans: "No scans yet. Scan your first leaf.",
  home: "Home",
  scan: "Scan",
  voice: "Voice",
  tips: "Tips",
  me: "Me",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  email: "Email",
  password: "Password",
  fullName: "Your name",
  village: "Village",
  continueGoogle: "Continue with Google",
  loginNeeded: "Sign in to scan and save your crop records.",
  saved: "Saved to your records",
  typeQuestion: "Type your question",
  send: "Send",
  listening: "Listening…",
  stop: "Stop",
  speakAnswer: "Play answer",
  retake: "Scan another leaf",
  yieldTitle: "Ways to get more crop",
  profile: "My account",
  saveProfile: "Save",
  checkEmail: "Check your email to confirm your account.",
  chat: "Chat",
  chatTitle: "Ask about your plant",
  chatSubtitle: "Tell me what you see and I will guide you step by step.",
  chatIntro:
    "Namaste! I am your farm helper. Tell me your crop and what is wrong, and I will tell you exactly what to do next.",
  chatQ1: "What should I do after the scan?",
  chatQ2: "Which fertiliser should I use now?",
  chatQ3: "How much water does my crop need?",
  chatQ4: "How do I stop the disease from spreading?",
  shops: "Shops",
  shopsTitle: "Fertiliser shops near you",
  shopsSubtitle: "Turn on your location to see farm supply shops close by.",
  useLocation: "Use my location",
  locating: "Finding shops near you…",
  noShops: "No farm shops found nearby. Try again from your village centre.",
  openMap: "Open in maps",
  kmAway: "km away",
  locationDenied: "Location is off. Please allow location in your phone settings.",
  langSaved: "Language saved",
  continue: "Continue",
  adminConsole: "Admin console",
  fertilizers: "Fertilisers",
  fertTitle: "Fertiliser guide",
  fertSubtitle: "Which fertiliser to use, how much, and when.",
  searchFert: "Search crop, problem or fertiliser",
  noFert: "No fertiliser matches your search.",
  addFert: "Add a fertiliser",
  fertAdded: "Fertiliser added",
  dosage: "How much",
  timing: "When to use",
  goodFor: "Good for",
  helpsWith: "Helps with",
  price: "Approx price",
  language: "Language",
  offline: "You are offline. Scans and answers need internet.",
  backOnline: "Back online",
};

const hi: Dict = {
  ...en,
  tagline: "आपका खेत सहायक",
  greeting: "नमस्ते",
  chooseLanguage: "अपनी भाषा चुनें",
  scanTitle: "पौधे की बीमारी जाँचें",
  scanSubtitle: "पत्ते पर कैमरा रखें, या पहले से मौजूद फोटो भेजें।",
  scanPlant: "पौधा स्कैन करें",
  uploadPhoto: "फोटो अपलोड करें",
  scanResult: "जाँच का नतीजा",
  whatToDo: "क्या करें",
  severity: "गंभीरता",
  analysing: "पत्ता पढ़ा जा रहा है…",
  growMore: "इस मौसम में ज़्यादा उपज",
  askByVoice: "बोलकर पूछें",
  voiceSubtitle: "आराम से बोलिए। हम आपकी भाषा में जवाब देंगे।",
  tapButton: "बटन दबाइए",
  andSpeak: "और अपनी फसल के बारे में बोलिए।",
  pastScans: "पिछली जाँचें",
  seeAll: "सब देखें",
  noScans: "अभी कोई जाँच नहीं। पहला पत्ता स्कैन करें।",
  home: "घर",
  scan: "स्कैन",
  voice: "आवाज़",
  tips: "सुझाव",
  me: "मैं",
  signIn: "लॉग इन",
  signUp: "खाता बनाएँ",
  signOut: "लॉग आउट",
  email: "ईमेल",
  password: "पासवर्ड",
  fullName: "आपका नाम",
  village: "गाँव",
  continueGoogle: "Google से जारी रखें",
  loginNeeded: "स्कैन और रिकॉर्ड सहेजने के लिए लॉग इन करें।",
  saved: "आपके रिकॉर्ड में सहेजा गया",
  typeQuestion: "अपना सवाल लिखें",
  send: "भेजें",
  listening: "सुन रहे हैं…",
  stop: "रोकें",
  speakAnswer: "जवाब सुनें",
  retake: "दूसरा पत्ता स्कैन करें",
  yieldTitle: "उपज बढ़ाने के तरीके",
  profile: "मेरा खाता",
  saveProfile: "सहेजें",
  checkEmail: "खाता पक्का करने के लिए ईमेल देखें।",
  chat: "बातचीत",
  chatTitle: "अपने पौधे के बारे में पूछें",
  chatSubtitle: "जो दिख रहा है बताइए, मैं कदम-कदम बताऊँगा।",
  chatIntro: "नमस्ते! मैं आपका खेत सहायक हूँ। फसल और परेशानी बताइए, मैं बताऊँगा आगे क्या करना है।",
  chatQ1: "जाँच के बाद अब क्या करूँ?",
  chatQ2: "अभी कौन सी खाद डालूँ?",
  chatQ3: "फसल को कितना पानी चाहिए?",
  chatQ4: "बीमारी फैलने से कैसे रोकूँ?",
  shops: "दुकानें",
  shopsTitle: "पास की खाद दुकानें",
  shopsSubtitle: "लोकेशन चालू करें और पास की खेती दुकानें देखें।",
  useLocation: "मेरी लोकेशन लें",
  locating: "पास की दुकानें खोजी जा रही हैं…",
  noShops: "पास कोई खेती दुकान नहीं मिली। गाँव के बीच से फिर कोशिश करें।",
  openMap: "नक्शे में देखें",
  kmAway: "कि.मी. दूर",
  fertilizers: "खाद",
  fertTitle: "खाद गाइड",
  fertSubtitle: "कौन सी खाद, कितनी और कब डालें।",
  searchFert: "फसल, समस्या या खाद खोजें",
  noFert: "आपकी खोज से कोई खाद नहीं मिली।",
  dosage: "कितनी मात्रा",
  timing: "कब डालें",
  goodFor: "किस फसल के लिए",
  helpsWith: "किसमें मदद",
  price: "अनुमानित दाम",
  locationDenied: "लोकेशन बंद है। कृपया फोन सेटिंग में चालू करें।",
  langSaved: "भाषा सहेजी गई",
  continue: "आगे बढ़ें",
  language: "भाषा",
  offline: "इंटरनेट बंद है। स्कैन और जवाब के लिए इंटरनेट चाहिए।",
  backOnline: "इंटरनेट वापस आ गया",


};

const mr: Dict = {
  ...en,
  tagline: "तुमचा शेत सहाय्यक",
  greeting: "नमस्कार",
  chooseLanguage: "तुमची भाषा निवडा",
  scanTitle: "झाडाचा रोग तपासा",
  scanSubtitle: "पानावर कॅमेरा धरा किंवा फोटो पाठवा.",
  scanPlant: "झाड स्कॅन करा",
  uploadPhoto: "फोटो अपलोड करा",
  scanResult: "तपासणीचा निकाल",
  whatToDo: "काय करावे",
  growMore: "या हंगामात जास्त पीक",
  askByVoice: "बोलून विचारा",
  pastScans: "मागील तपासण्या",
  home: "घर",
  scan: "स्कॅन",
  voice: "आवाज",
  tips: "सल्ला",
  me: "मी",
  signIn: "लॉग इन",
  signOut: "लॉग आउट",
  yieldTitle: "पीक वाढवण्याचे मार्ग",
};

const bn: Dict = {
  ...en,
  tagline: "আপনার মাঠের সহায়ক",
  greeting: "নমস্কার",
  chooseLanguage: "আপনার ভাষা বাছুন",
  scanTitle: "গাছের রোগ দেখুন",
  scanSubtitle: "পাতার দিকে ক্যামেরা ধরুন বা ছবি পাঠান।",
  scanPlant: "গাছ স্ক্যান করুন",
  uploadPhoto: "ছবি আপলোড করুন",
  scanResult: "ফলাফল",
  whatToDo: "কী করবেন",
  growMore: "এই মরসুমে বেশি ফসল",
  askByVoice: "কথা বলে জিজ্ঞাসা করুন",
  pastScans: "আগের স্ক্যান",
  home: "হোম",
  scan: "স্ক্যান",
  voice: "কণ্ঠ",
  tips: "পরামর্শ",
  me: "আমি",
  yieldTitle: "ফলন বাড়ানোর উপায়",
};

const te: Dict = {
  ...en,
  tagline: "మీ పొలం సహాయకుడు",
  greeting: "నమస్తే",
  chooseLanguage: "మీ భాషను ఎంచుకోండి",
  scanTitle: "మొక్క వ్యాధిని చూడండి",
  scanSubtitle: "ఆకు మీద కెమెరా పెట్టండి లేదా ఫోటో పంపండి.",
  scanPlant: "మొక్కను స్కాన్ చేయండి",
  uploadPhoto: "ఫోటో అప్‌లోడ్ చేయండి",
  scanResult: "ఫలితం",
  whatToDo: "ఏమి చేయాలి",
  growMore: "ఈ సీజన్‌లో ఎక్కువ దిగుబడి",
  askByVoice: "మాట్లాడి అడగండి",
  pastScans: "గత స్కాన్‌లు",
  home: "హోమ్",
  scan: "స్కాన్",
  voice: "వాయిస్",
  tips: "సూచనలు",
  me: "నేను",
  yieldTitle: "దిగుబడి పెంచే మార్గాలు",
};

const ta: Dict = {
  ...en,
  tagline: "உங்கள் வயல் உதவியாளர்",
  greeting: "வணக்கம்",
  chooseLanguage: "உங்கள் மொழியைத் தேர்வு செய்யுங்கள்",
  scanTitle: "செடி நோயைச் சரிபார்க்கவும்",
  scanSubtitle: "இலையில் கேமராவை காட்டுங்கள் அல்லது படத்தை அனுப்புங்கள்.",
  scanPlant: "செடியை ஸ்கேன் செய்",
  uploadPhoto: "படத்தை பதிவேற்று",
  scanResult: "முடிவு",
  whatToDo: "என்ன செய்ய வேண்டும்",
  growMore: "இந்த பருவத்தில் அதிக விளைச்சல்",
  askByVoice: "பேசி கேளுங்கள்",
  pastScans: "முந்தைய ஸ்கேன்கள்",
  home: "முகப்பு",
  scan: "ஸ்கேன்",
  voice: "குரல்",
  tips: "குறிப்புகள்",
  me: "நான்",
  yieldTitle: "விளைச்சலை அதிகரிக்கும் வழிகள்",
};

const kn: Dict = {
  ...en,
  tagline: "ನಿಮ್ಮ ಹೊಲದ ಸಹಾಯಕ",
  greeting: "ನಮಸ್ಕಾರ",
  chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ",
  scanTitle: "ಗಿಡದ ರೋಗ ಪರಿಶೀಲಿಸಿ",
  scanSubtitle: "ಎಲೆಯ ಮೇಲೆ ಕ್ಯಾಮೆರಾ ಹಿಡಿಯಿರಿ ಅಥವಾ ಫೋಟೋ ಕಳುಹಿಸಿ.",
  scanPlant: "ಗಿಡ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
  uploadPhoto: "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
  scanResult: "ಫಲಿತಾಂಶ",
  whatToDo: "ಏನು ಮಾಡಬೇಕು",
  growMore: "ಈ ಋತುವಿನಲ್ಲಿ ಹೆಚ್ಚು ಬೆಳೆ",
  askByVoice: "ಮಾತನಾಡಿ ಕೇಳಿ",
  pastScans: "ಹಿಂದಿನ ಸ್ಕ್ಯಾನ್‌ಗಳು",
  home: "ಮುಖಪುಟ",
  scan: "ಸ್ಕ್ಯಾನ್",
  voice: "ಧ್ವನಿ",
  tips: "ಸಲಹೆ",
  me: "ನಾನು",
  yieldTitle: "ಇಳುವರಿ ಹೆಚ್ಚಿಸುವ ಮಾರ್ಗಗಳು",
};

const DICTS: Record<LangCode, Dict> = { en, hi, mr, bn, te, ta, kn };

type I18nValue = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: keyof typeof en | string) => string;
  languageLabel: string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("ks-lang") as LangCode | null;
    if (stored && DICTS[stored]) setLangState(stored);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (code) => {
        setLangState(code);
        window.localStorage.setItem("ks-lang", code);
      },
      t: (key) => DICTS[lang][key as string] ?? en[key as string] ?? String(key),
      languageLabel: LANGUAGES.find((l) => l.code === lang)?.label ?? "English",
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
