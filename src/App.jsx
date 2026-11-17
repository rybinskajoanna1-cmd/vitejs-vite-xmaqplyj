import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles, Calendar, ShoppingBag, Wallet, Check, RefreshCw,
  Dumbbell, Flame, ChevronDown, ChevronUp, Home, Sliders,
  AlertTriangle, CheckCircle2, ArrowRight, Sun, Moon, Cloud,
  Plus, Minus, Utensils, Award, TrendingDown, Info, PackageCheck,
  ChefHat, Clock, ShieldCheck, Layers, Filter, Search, User,
  Smartphone, Share2, Copy, Users, Refrigerator, Trash2, EyeOff, Eye
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';

// ==========================================
// INICJALIZACJA CHMURY FIREBASE
// ==========================================
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ai-life-diet-manager';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('Tryb lokalny: brak konfiguracji środowiska Firebase', err);
}

// ==========================================
// BAZA DANYCH SKŁADNIKÓW (CENY I MAKRO)
// ==========================================
const INGREDIENTS_DB = {
  oats: { id: 'oats', name: 'Płatki owsiane górskie', category: 'Produkty Suche', unit: 'g', pricePer100: 0.90, isPantryBase: true },
  rice: { id: 'rice', name: 'Ryż jaśminowy / biały', category: 'Produkty Suche', unit: 'g', pricePer100: 1.20, isPantryBase: true },
  pasta: { id: 'pasta', name: 'Makaron pełnoziarnisty', category: 'Produkty Suche', unit: 'g', pricePer100: 1.40, isPantryBase: true },
  bread: { id: 'bread', name: 'Chleb żytni na zakwasie', category: 'Produkty Suche', unit: 'g', pricePer100: 1.60, isPantryBase: false },
  potatoes: { id: 'potatoes', name: 'Ziemniaki młode / Bataty', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 0.75, isPantryBase: false },
  tortilla: { id: 'tortilla', name: 'Tortilla pełnoziarnista', category: 'Produkty Suche', unit: 'g', pricePer100: 2.50, isPantryBase: false },

  skyr: { id: 'skyr', name: 'Jogurt typu Skyr naturalny', category: 'Nabiał i Jajka', unit: 'g', pricePer100: 1.85, isPantryBase: false },
  twarog: { id: 'twarog', name: 'Twaróg chudy (klinek)', category: 'Nabiał i Jajka', unit: 'g', pricePer100: 2.10, isPantryBase: false },
  eggs: { id: 'eggs', name: 'Jajka wiejskie (klasa M/L)', category: 'Nabiał i Jajka', unit: 'g', pricePer100: 2.30, isPantryBase: true },
  mozzarella: { id: 'mozzarella', name: 'Ser Mozzarella light', category: 'Nabiał i Jajka', unit: 'g', pricePer100: 3.60, isPantryBase: false },
  milk_plant: { id: 'milk_plant', name: 'Napój owsiany / Mleko 1.5%', category: 'Nabiał i Jajka', unit: 'ml', pricePer100: 0.85, isPantryBase: true },

  chicken: { id: 'chicken', name: 'Pierś z kurczaka (filet)', category: 'Mięso i Ryby', unit: 'g', pricePer100: 3.20, isPantryBase: false },
  beef: { id: 'beef', name: 'Polędwica / Ligawa wołowa', category: 'Mięso i Ryby', unit: 'g', pricePer100: 6.90, isPantryBase: false },
  salmon: { id: 'salmon', name: 'Łosoś atlantycki świeży', category: 'Mięso i Ryby', unit: 'g', pricePer100: 9.80, isPantryBase: false },
  tofu: { id: 'tofu', name: 'Tofu naturalne / wędzone', category: 'Nabiał i Jajka', unit: 'g', pricePer100: 2.80, isPantryBase: false },
  tuna: { id: 'tuna', name: 'Tuńczyk w sosie własnym', category: 'Mięso i Ryby', unit: 'g', pricePer100: 4.10, isPantryBase: true },

  whey: { id: 'whey', name: 'Odżywka białkowa (WPC 80)', category: 'Zdrowe Tłuszcze i Dodatki', unit: 'g', pricePer100: 9.50, isPantryBase: true },
  pb: { id: 'pb', name: 'Masło orzechowe 100%', category: 'Zdrowe Tłuszcze i Dodatki', unit: 'g', pricePer100: 3.40, isPantryBase: true },
  olive_oil: { id: 'olive_oil', name: 'Oliwa z oliwek Extra Virgin', category: 'Zdrowe Tłuszcze i Dodatki', unit: 'ml', pricePer100: 5.20, isPantryBase: true },
  walnuts: { id: 'walnuts', name: 'Orzechy włoskie / migdały', category: 'Zdrowe Tłuszcze i Dodatki', unit: 'g', pricePer100: 6.20, isPantryBase: true },
  spices: { id: 'spices', name: 'Zestaw przypraw, zioła i sos sojowy', category: 'Zdrowe Tłuszcze i Dodatki', unit: 'g', pricePer100: 3.00, isPantryBase: true },

  berries: { id: 'berries', name: 'Borówki amerykańskie świeże', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 5.60, isPantryBase: false },
  apples: { id: 'apples', name: 'Jabłka polskie / Mrożone jagody', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 0.95, isPantryBase: false },
  banana: { id: 'banana', name: 'Banany', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 0.90, isPantryBase: false },
  spinach: { id: 'spinach', name: 'Szpinak baby świeży', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 3.50, isPantryBase: false },
  broccoli: { id: 'broccoli', name: 'Brokuł świeży', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 1.80, isPantryBase: false },
  tomatoes: { id: 'tomatoes', name: 'Pomidory malinowe / Passata', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 1.90, isPantryBase: false },
  avocado: { id: 'avocado', name: 'Awokado Hass dojrzałe', category: 'Warzywa i Owoce', unit: 'g', pricePer100: 5.80, isPantryBase: false }
};

// ==========================================
// PULA ZBILANSOWANYCH POSIŁKÓW AI
// ==========================================
const MEALS_POOL = {
  breakfast: [
    {
      id: 'b1',
      name: 'Nocna owsianka ze skyrem, masłem orzechowym i borówkami',
      prepTime: '5 min + noc w lodówce',
      tags: ['Wysokie białko', 'Meal-Prep', 'Słodkie'],
      baseMacros: { kcal: 640, p: 36, f: 18, c: 84 },
      ingredients: [
        { id: 'oats', amount: 85, scalableCarb: true },
        { id: 'skyr', amount: 150, scalableCarb: false },
        { id: 'pb', amount: 25, scalableCarb: false },
        { id: 'berries', amount: 100, scalableCarb: false },
        { id: 'milk_plant', amount: 120, scalableCarb: false }
      ],
      steps: [
        'Wieczorem wymieszaj w słoiczku płatki owsiane, napój roślinny oraz jogurt typu Skyr.',
        'Dodaj połowę masła orzechowego i dokładnie połącz składniki.',
        'Rano udekoruj świeżymi borówkami oraz resztą masła orzechowego. W dni treningowe porcja płatków jest automatycznie zwiększona.'
      ]
    },
    {
      id: 'b2',
      name: 'Szakszuka na oliwie z chlebem żytnim i mozzarellą',
      prepTime: '15 min',
      tags: ['Wytrawne', 'Ciepłe śniadanie'],
      baseMacros: { kcal: 630, p: 34, f: 24, c: 70 },
      ingredients: [
        { id: 'eggs', amount: 180, scalableCarb: false },
        { id: 'mozzarella', amount: 45, scalableCarb: false },
        { id: 'tomatoes', amount: 200, scalableCarb: false },
        { id: 'bread', amount: 110, scalableCarb: true },
        { id: 'olive_oil', amount: 10, scalableCarb: false },
        { id: 'spices', amount: 5, scalableCarb: false }
      ],
      steps: [
        'Na rozgrzanej oliwie podduś pokrojone pomidory z czosnkiem, kuminem i słodką papryką przez 4 minuty.',
        'Zrób wgłębienia w sosie, wbij 3 jajka, posyp tartą mozzarellą i duś pod przykryciem do ścięcia białek.',
        'Podawaj z chrupiącym pieczywem żytnim na zakwasie.'
      ]
    },
    {
      id: 'b3',
      name: 'Kremowy budyń jaglano-owsiany z WPC i bananem',
      prepTime: '12 min',
      tags: ['Szybkowchłanialne', 'Przedtreningowe'],
      baseMacros: { kcal: 650, p: 37, f: 16, c: 88 },
      ingredients: [
        { id: 'oats', amount: 90, scalableCarb: true },
        { id: 'whey', amount: 30, scalableCarb: false },
        { id: 'banana', amount: 120, scalableCarb: true },
        { id: 'walnuts', amount: 20, scalableCarb: false },
        { id: 'milk_plant', amount: 200, scalableCarb: false }
      ],
      steps: [
        'Ugotuj płatki owsiane na napoju roślinnym na gęsty krem (ok. 6 minut).',
        'Zdejmij z ognia, odczekaj minutę i wmieszaj miarkę odżywki białkowej.',
        'Przełóż do miski, ułóż plasterki banana i posyp posiekanymi orzechami włoskimi.'
      ]
    }
  ],
  second_breakfast: [
    {
      id: 's1',
      name: 'Zielone Smoothie Proteinowe (Szpinak, Banan, WPC, Owsiane)',
      prepTime: '5 min',
      tags: ['Do pracy', 'Bomba witaminowa'],
      baseMacros: { kcal: 490, p: 32, f: 12, c: 64 },
      ingredients: [
        { id: 'whey', amount: 30, scalableCarb: false },
        { id: 'banana', amount: 130, scalableCarb: true },
        { id: 'oats', amount: 45, scalableCarb: true },
        { id: 'spinach', amount: 60, scalableCarb: false },
        { id: 'pb', amount: 15, scalableCarb: false },
        { id: 'milk_plant', amount: 250, scalableCarb: false }
      ],
      steps: [
        'Umieść w kielichu blendera świeży szpinak, napój roślinny oraz banana.',
        'Dodaj płatki owsiane, odżywkę białkową i łyżeczkę masła orzechowego.',
        'Blenduj na wysokich obrotach przez 45 sekund do uzyskania aksamitnej konsystencji.'
      ]
    },
    {
      id: 's2',
      name: 'Twarożek proteinowy ze skyrem, owocami i orzechami',
      prepTime: '7 min',
      tags: ['Kazeina', 'Bez gotowania'],
      baseMacros: { kcal: 480, p: 35, f: 14, c: 56 },
      ingredients: [
        { id: 'twarog', amount: 125, scalableCarb: false },
        { id: 'skyr', amount: 100, scalableCarb: false },
        { id: 'bread', amount: 75, scalableCarb: true },
        { id: 'apples', amount: 150, scalableCarb: false },
        { id: 'walnuts', amount: 20, scalableCarb: false }
      ],
      steps: [
        'Rozgnieć twaróg widelcem i wymieszaj ze skyrem na gładką masę z odrobiną cynamonu.',
        'Dodaj pokrojone w kostkę jabłko oraz posiekane orzechy.',
        'Zjedz z kromkami chleba żytniego.'
      ]
    },
    {
      id: 's3',
      name: 'Tortilla pełnoziarnista z tuńczykiem, mozzarellą i szpinakiem',
      prepTime: '10 min',
      tags: ['Lunchbox', 'Szybkie'],
      baseMacros: { kcal: 500, p: 34, f: 14, c: 60 },
      ingredients: [
        { id: 'tortilla', amount: 90, scalableCarb: true },
        { id: 'tuna', amount: 100, scalableCarb: false },
        { id: 'mozzarella', amount: 35, scalableCarb: false },
        { id: 'spinach', amount: 50, scalableCarb: false },
        { id: 'tomatoes', amount: 100, scalableCarb: false }
      ],
      steps: [
        'Na placku tortilli ułóż liście szpinaku, odsączonego tuńczyka oraz plastry pomidora.',
        'Posyp mozzarellą, zwiń ciasno w rulon (burrito) i podpiecz na suchej patelni po 2 minuty z każdej strony.'
      ]
    }
  ],
  lunch: [
    {
      id: 'l1',
      name: 'Soczysty kurczak w ziołach z ryżem jaśminowym i brokułem',
      prepTime: '22 min',
      tags: ['Klasyk na masę', 'Okołotreningowe'],
      baseMacros: { kcal: 790, p: 44, f: 18, c: 112 },
      ingredients: [
        { id: 'chicken', amount: 170, scalableCarb: false },
        { id: 'rice', amount: 110, scalableCarb: true },
        { id: 'broccoli', amount: 180, scalableCarb: false },
        { id: 'olive_oil', amount: 14, scalableCarb: false },
        { id: 'spices', amount: 8, scalableCarb: false }
      ],
      steps: [
        'Ugotuj ryż jaśminowy al dente w lekko osolonej wodzie.',
        'Pierś z kurczaka pokrój w kostkę, zamarynuj w przyprawach z połową oliwy i usmaż na złoty kolor.',
        'Różyczki brokuła ugotuj na parze (ok. 6 min) i polej pozostałą oliwą z oliwek przed podaniem.'
      ]
    },
    {
      id: 'l2',
      name: 'Makaron pełnoziarnisty z polędwicą wołową w sosie pomidorowym',
      prepTime: '25 min',
      tags: ['Wysokie żelazo', 'Premium'],
      baseMacros: { kcal: 810, p: 42, f: 21, c: 110 },
      isExpensive: true,
      ingredients: [
        { id: 'beef', amount: 160, scalableCarb: false },
        { id: 'pasta', amount: 115, scalableCarb: true },
        { id: 'tomatoes', amount: 220, scalableCarb: false },
        { id: 'olive_oil', amount: 10, scalableCarb: false },
        { id: 'spices', amount: 8, scalableCarb: false }
      ],
      steps: [
        'Ugotuj makaron pełnoziarnisty zgodnie z czasem na opakowaniu.',
        'Polędwicę wołową pokrój w cienkie paski, obsmaż krótko na mocnym ogniu i zalej passatą/pomidorami z bazylią i czosnkiem.',
        'Połącz makaron z sosem na patelni, aby przeszedł aromatem.'
      ]
    },
    {
      id: 'l3',
      name: 'Azjatyckie Stir-Fry z wędzonym tofu, ryżem i warzywami w sosie orzechowym',
      prepTime: '18 min',
      tags: ['Roślinne białko', 'Szybki Wok'],
      baseMacros: { kcal: 780, p: 36, f: 22, c: 108 },
      ingredients: [
        { id: 'tofu', amount: 180, scalableCarb: false },
        { id: 'rice', amount: 110, scalableCarb: true },
        { id: 'broccoli', amount: 150, scalableCarb: false },
        { id: 'pb', amount: 22, scalableCarb: false },
        { id: 'spices', amount: 10, scalableCarb: false }
      ],
      steps: [
        'Pokrój tofu w kostkę i podsmaż na chrupko z sosem sojowym i imbirem.',
        'Dodaj różyczki brokuła oraz sos wymieszany z masła orzechowego, ciepłej wody i przypraw.',
        'Podawaj na puszystym ryżu jaśminowym.'
      ]
    }
  ],
  dinner: [
    {
      id: 'd1',
      name: 'Pieczony łosoś atlantycki z młodymi ziemniakami i szpinakiem',
      prepTime: '25 min',
      tags: ['Omega-3', 'Regeneracja nocna'],
      baseMacros: { kcal: 630, p: 34, f: 24, c: 70 },
      isExpensive: true,
      ingredients: [
        { id: 'salmon', amount: 140, scalableCarb: false },
        { id: 'potatoes', amount: 300, scalableCarb: true },
        { id: 'spinach', amount: 80, scalableCarb: false },
        { id: 'olive_oil', amount: 8, scalableCarb: false },
        { id: 'spices', amount: 5, scalableCarb: false }
      ],
      steps: [
        'Ziemniaki pokrój w łódeczki, skrop oliwą, posyp rozmarynem i piecz w 200°C przez 22 minuty.',
        'Na ostatnie 12 minut dołóż filet z łososia skropiony cytryną.',
        'Podawaj na świeżych liściach szpinaku baby.'
      ]
    },
    {
      id: 'd2',
      name: 'Tosty żytnie z szarpanym kurczakiem, mozzarellą i pomidorami',
      prepTime: '15 min',
      tags: ['Kolacja na ciepło', 'Ekonomiczne'],
      baseMacros: { kcal: 620, p: 36, f: 18, c: 76 },
      ingredients: [
        { id: 'chicken', amount: 120, scalableCarb: false },
        { id: 'bread', amount: 120, scalableCarb: true },
        { id: 'mozzarella', amount: 50, scalableCarb: false },
        { id: 'tomatoes', amount: 150, scalableCarb: false },
        { id: 'olive_oil', amount: 8, scalableCarb: false }
      ],
      steps: [
        'Usmażoną pierś z kurczaka poszarp widelcem i ułóż na kromkach chleba żytniego.',
        'Dodaj plastry mozzarelli i zapiecz pod grillem lub na patelni pod przykryciem.',
        'Podawaj z sałatką z pomidorów malinowych i oliwy.'
      ]
    },
    {
      id: 'd3',
      name: 'Bowl kolacyjny z komosą/ryżem, jajkami sadzonymi i awokado',
      prepTime: '15 min',
      tags: ['Zdrowe tłuszcze', 'Wegetariańskie'],
      baseMacros: { kcal: 625, p: 30, f: 25, c: 72 },
      ingredients: [
        { id: 'eggs', amount: 150, scalableCarb: false },
        { id: 'rice', amount: 80, scalableCarb: true },
        { id: 'avocado', amount: 70, scalableCarb: false },
        { id: 'spinach', amount: 60, scalableCarb: false },
        { id: 'tomatoes', amount: 120, scalableCarb: false }
      ],
      steps: [
        'W głębokiej misce ułóż ugotowany ryż, świeży szpinak, pokrojone pomidory oraz plastry awokado.',
        'Na wierzchu połóż 2-3 jajka sadzone z płynnym żółtkiem i oprósz świeżo mielonym pieprzem.'
      ]
    }
  ]
};

const DAYS_OF_WEEK = [
  { index: 0, short: 'Pon', full: 'Poniedziałek', defaultTraining: true, workoutName: 'Siłownia: Góra Ciała (Push/Pull)' },
  { index: 1, short: 'Wt', full: 'Wtorek', defaultTraining: false, workoutName: 'Regeneracja / Spacer 8000 kroków' },
  { index: 2, short: 'Śr', full: 'Środa', defaultTraining: true, workoutName: 'Siłownia: Dół Ciała (Legs & Core)' },
  { index: 3, short: 'Czw', full: 'Czwartek', defaultTraining: false, workoutName: 'Mobilność / Stretching' },
  { index: 4, short: 'Pt', full: 'Piątek', defaultTraining: true, workoutName: 'Siłownia: Full Body Workout (FBW)' },
  { index: 5, short: 'Sob', full: 'Sobota', defaultTraining: true, workoutName: 'Bieg tlenowy 8 km + Core' },
  { index: 6, short: 'Ndz', full: 'Niedziela', defaultTraining: false, workoutName: 'Pełny odpoczynek' }
];

const SLOT_LABELS = {
  breakfast: { label: 'Śniadanie', time: '08:00', icon: '🥣' },
  second_breakfast: { label: 'II Śniadanie', time: '11:30', icon: '🥤' },
  lunch: { label: 'Obiad (Okołotreningowy)', time: '15:30', icon: '🍲' },
  dinner: { label: 'Kolacja', time: '19:30', icon: '🥗' }
};

export default function App() {
  // ==========================================
  // STAN AUTORYZACJI I CHMURY FIREBASE
  // ==========================================
  const [user, setUser] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('connecting'); // 'synced' | 'syncing' | 'local' | 'connecting'
  const isRemoteUpdate = useRef(false);
  const initialLoadDone = useRef(false);

  // ==========================================
  // STAN GŁÓWNY APLIKACJI
  // ==========================================
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'shopping' | 'budget' | 'architecture'
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMealKey, setExpandedMealKey] = useState('0-breakfast');
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);
  const [regeneratingSlot, setRegeneratingSlot] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modale
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isFridgeAiOpen, setIsFridgeAiOpen] = useState(false);

  // Kreator "Generuj z lodówki (AI)"
  const [fridgePrompt, setFridgePrompt] = useState('skyr, banan, masło orzechowe');
  const [fridgeTargetSlot, setFridgeTargetSlot] = useState('second_breakfast');
  const [customAiMeals, setCustomAiMeals] = useState({}); // klucz: `${dayIdx}-${slotKey}`

  // Mnożnik porcji (1x lub 2x - np. gotowanie dla 2 osób / na 2 dni)
  const [mealMultipliers, setMealMultipliers] = useState({}); // klucz: `${dayIdx}-${slotKey}` -> 1 | 2

  // Zjedzone posiłki (Check-off postępu dnia)
  const [eatenMeals, setEatenMeals] = useState({
    '0-breakfast': true
  });

  // Tryb Sklepowy (Focus Mode w supermarkecie) + Własne produkty na liście
  const [shopFocusMode, setShopFocusMode] = useState(false);
  const [customShopItems, setCustomShopItems] = useState([
    { id: 'c1', name: 'Kawa ziarnista Specialty 250g', price: 24.90, checked: false },
    { id: 'c2', name: 'Woda wysokozmineralizowana (zgrzewka)', price: 11.40, checked: false }
  ]);
  const [newCustomItemName, setNewCustomItemName] = useState('');
  const [newCustomItemPrice, setNewCustomItemPrice] = useState('');

  // Cele i Profil Użytkownika
  const [userGoals, setUserGoals] = useState({
    userName: 'Marta • Konto PRO Cloud',
    goalName: 'Budowa masy mięśniowej (Lean Bulk)',
    baseKcal: 2550,
    baseProtein: 135,
    baseFat: 75,
    baseCarbs: 340,
    trainingBonusKcal: 250,
    trainingBonusCarbs: 50,
    trainingBonusProtein: 10
  });

  // Budżet tygodniowy i optymalizacje AI
  const [weeklyBudget, setWeeklyBudget] = useState(320);
  const [appliedOptimizations, setAppliedOptimizations] = useState({
    swapSalmonToTwarog: false,
    swapBeefToChicken: false,
    swapBerriesToApples: false,
    swapAvocadoToEggs: false
  });

  // Dni treningowe (Poniedziałek - Niedziela)
  const [trainingDays, setTrainingDays] = useState(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day.index]: day.defaultTraining }), {})
  );

  // Wygenerowany plan posiłków na 7 dni (indeksy w MEALS_POOL)
  const [weeklyPlan, setWeeklyPlan] = useState({
    0: { breakfast: 0, second_breakfast: 0, lunch: 0, dinner: 0 },
    1: { breakfast: 1, second_breakfast: 1, lunch: 1, dinner: 1 },
    2: { breakfast: 0, second_breakfast: 0, lunch: 0, dinner: 2 },
    3: { breakfast: 2, second_breakfast: 2, lunch: 2, dinner: 1 },
    4: { breakfast: 0, second_breakfast: 1, lunch: 1, dinner: 0 },
    5: { breakfast: 2, second_breakfast: 0, lunch: 0, dinner: 1 },
    6: { breakfast: 1, second_breakfast: 2, lunch: 2, dinner: 2 }
  });

  // Domowa Spiżarnia ("Mam w domu")
  const [pantryItems, setPantryItems] = useState({
    oats: true,
    rice: true,
    olive_oil: true,
    spices: true,
    whey: true,
    pb: false,
    eggs: false,
    pasta: false,
    tuna: false,
    walnuts: false,
    milk_plant: false
  });

  // Odznaczone produkty w sklepie (kupione)
  const [checkedShopItems, setCheckedShopItems] = useState({});

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ==========================================
  // 1. LOGOWANIE FIREBASE AUTH (RULE 3)
  // ==========================================
  useEffect(() => {
    if (!auth) {
      setCloudStatus('local');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Błąd autoryzacji Firebase:', err);
        setCloudStatus('local');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCloudStatus('synced');
      }
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // 2. SYNCHRONIZACJA Z CHMURĄ FIRESTORE (RULE 1 & 2)
  // ==========================================
  useEffect(() => {
    if (!user || !db) return;

    const stateDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'diet_manager', 'main_state');

    const unsubscribe = onSnapshot(
      stateDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          isRemoteUpdate.current = true;
          if (data.userGoals) setUserGoals(data.userGoals);
          if (data.weeklyBudget !== undefined) setWeeklyBudget(data.weeklyBudget);
          if (data.trainingDays) setTrainingDays(data.trainingDays);
          if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
          if (data.pantryItems) setPantryItems(data.pantryItems);
          if (data.checkedShopItems) setCheckedShopItems(data.checkedShopItems);
          if (data.appliedOptimizations) setAppliedOptimizations(data.appliedOptimizations);
          if (data.mealMultipliers) setMealMultipliers(data.mealMultipliers);
          if (data.eatenMeals) setEatenMeals(data.eatenMeals);
          if (data.customShopItems) setCustomShopItems(data.customShopItems);
          if (data.customAiMeals) setCustomAiMeals(data.customAiMeals);
          if (data.darkMode !== undefined) setDarkMode(data.darkMode);
          setTimeout(() => {
            isRemoteUpdate.current = false;
            initialLoadDone.current = true;
          }, 120);
        } else {
          initialLoadDone.current = true;
        }
        setCloudStatus('synced');
      },
      (error) => {
        console.error('Błąd subskrypcji Firestore:', error);
        setCloudStatus('local');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Automatyczny zapis do chmury przy zmianie stanu
  useEffect(() => {
    if (!user || !db || !initialLoadDone.current || isRemoteUpdate.current) return;

    const saveTimer = setTimeout(async () => {
      try {
        setCloudStatus('syncing');
        const stateDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'diet_manager', 'main_state');
        await setDoc(
          stateDocRef,
          {
            userGoals,
            weeklyBudget,
            trainingDays,
            weeklyPlan,
            pantryItems,
            checkedShopItems,
            appliedOptimizations,
            mealMultipliers,
            eatenMeals,
            customShopItems,
            customAiMeals,
            darkMode,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        setCloudStatus('synced');
      } catch (err) {
        console.error('Błąd zapisu do chmury:', err);
        setCloudStatus('local');
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [
    user,
    userGoals,
    weeklyBudget,
    trainingDays,
    weeklyPlan,
    pantryItems,
    checkedShopItems,
    appliedOptimizations,
    mealMultipliers,
    eatenMeals,
    customShopItems,
    customAiMeals,
    darkMode
  ]);

  // ==========================================
  // LOGIKA PRZELICZANIA POSIŁKÓW I MNOŻNIKÓW
  // ==========================================
  const getComputedMeal = (dayIdx, slotKey) => {
    const customKey = `${dayIdx}-${slotKey}`;
    const rawMeal = customAiMeals[customKey] || MEALS_POOL[slotKey][weeklyPlan[dayIdx][slotKey]];
    const isTraining = trainingDays[dayIdx];
    const portionMultiplier = mealMultipliers[customKey] || 1;

    // Mnożnik węglowodanowy w dzień treningowy
    const carbMultiplier = isTraining ? 1.28 : 1.0;

    let mealName = rawMeal.name;
    let isOptimized = false;

    const computedIngredients = rawMeal.ingredients.map((item) => {
      let ingId = item.id;
      let singleAmount = item.scalableCarb
        ? Math.round((item.amount * carbMultiplier) / 5) * 5
        : item.amount;

      if (appliedOptimizations.swapSalmonToTwarog && ingId === 'salmon') {
        ingId = 'twarog';
        singleAmount = Math.round(singleAmount * 1.15);
        mealName = mealName.replace('Pieczony łosoś atlantycki', 'Pieczony twaróg w ziołach / Dorsz');
        isOptimized = true;
      }
      if (appliedOptimizations.swapBeefToChicken && ingId === 'beef') {
        ingId = 'chicken';
        mealName = mealName.replace('polędwicą wołową', 'filetem z kurczaka');
        isOptimized = true;
      }
      if (appliedOptimizations.swapBerriesToApples && ingId === 'berries') {
        ingId = 'apples';
        singleAmount = Math.round(singleAmount * 1.2);
        mealName = mealName.replace('borówkami', 'karmelizowanym jabłkiem');
        isOptimized = true;
      }
      if (appliedOptimizations.swapAvocadoToEggs && ingId === 'avocado') {
        ingId = 'walnuts';
        singleAmount = 25;
        mealName = mealName.replace('awokado', 'orzechami włoskimi');
        isOptimized = true;
      }

      const finalAmount = singleAmount * portionMultiplier;
      const dbInfo = INGREDIENTS_DB[ingId] || INGREDIENTS_DB.oats;
      const cost = (finalAmount / 100) * dbInfo.pricePer100;

      return {
        ...dbInfo,
        id: ingId,
        amount: finalAmount,
        singleAmount,
        baseAmount: item.amount,
        wasScaledForTraining: isTraining && item.scalableCarb,
        cost
      };
    });

    const slotCarbBonus = isTraining ? (slotKey === 'lunch' ? 20 : slotKey === 'breakfast' ? 15 : 8) : 0;
    const slotKcalBonus = isTraining ? (slotKey === 'lunch' ? 95 : slotKey === 'breakfast' ? 75 : 40) : 0;
    const slotProteinBonus = isTraining ? (slotKey === 'lunch' ? 4 : 2) : 0;

    return {
      ...rawMeal,
      name: mealName,
      isOptimized,
      portionMultiplier,
      ingredients: computedIngredients,
      macros: {
        kcal: (rawMeal.baseMacros.kcal + slotKcalBonus) * portionMultiplier,
        p: (rawMeal.baseMacros.p + slotProteinBonus) * portionMultiplier,
        f: rawMeal.baseMacros.f * portionMultiplier,
        c: (rawMeal.baseMacros.c + slotCarbBonus) * portionMultiplier
      },
      singleMacros: {
        kcal: rawMeal.baseMacros.kcal + slotKcalBonus,
        p: rawMeal.baseMacros.p + slotProteinBonus,
        f: rawMeal.baseMacros.f,
        c: rawMeal.baseMacros.c + slotCarbBonus
      }
    };
  };

  // Makro wybranego dnia (planowane oraz zjedzone)
  const currentDayStats = useMemo(() => {
    const slots = ['breakfast', 'second_breakfast', 'lunch', 'dinner'];
    return slots.reduce(
      (acc, slot) => {
        const m = getComputedMeal(selectedDay, slot);
        const isEaten = !!eatenMeals[`${selectedDay}-${slot}`];
        return {
          kcal: acc.kcal + m.singleMacros.kcal,
          p: acc.p + m.singleMacros.p,
          f: acc.f + m.singleMacros.f,
          c: acc.c + m.singleMacros.c,
          eatenKcal: acc.eatenKcal + (isEaten ? m.singleMacros.kcal : 0),
          eatenP: acc.eatenP + (isEaten ? m.singleMacros.p : 0),
          eatenCount: acc.eatenCount + (isEaten ? 1 : 0)
        };
      },
      { kcal: 0, p: 0, f: 0, c: 0, eatenKcal: 0, eatenP: 0, eatenCount: 0 }
    );
  }, [selectedDay, weeklyPlan, trainingDays, appliedOptimizations, eatenMeals, customAiMeals]);

  const currentDayTargets = useMemo(() => {
    const isTraining = trainingDays[selectedDay];
    return {
      kcal: userGoals.baseKcal + (isTraining ? userGoals.trainingBonusKcal : 0),
      p: userGoals.baseProtein + (isTraining ? userGoals.trainingBonusProtein : 0),
      f: userGoals.baseFat,
      c: userGoals.baseCarbs + (isTraining ? userGoals.trainingBonusCarbs : 0)
    };
  }, [selectedDay, trainingDays, userGoals]);

  // ==========================================
  // AGREGACJA LISTY ZAKUPÓW Z CAŁEGO TYGODNIA
  // ==========================================
  const aggregatedShoppingData = useMemo(() => {
    const map = {};
    const slots = ['breakfast', 'second_breakfast', 'lunch', 'dinner'];

    for (let d = 0; d < 7; d++) {
      slots.forEach((slot) => {
        const meal = getComputedMeal(d, slot);
        meal.ingredients.forEach((ing) => {
          if (!map[ing.id]) {
            map[ing.id] = {
              ...INGREDIENTS_DB[ing.id],
              totalAmount: 0,
              totalCost: 0,
              occurrences: 0
            };
          }
          map[ing.id].totalAmount += ing.amount;
          map[ing.id].totalCost += ing.cost;
          map[ing.id].occurrences += 1;
        });
      });
    }

    const allItems = Object.values(map).map((item) => {
      const inPantry = !!pantryItems[item.id];
      return {
        ...item,
        totalAmount: Math.round(item.totalAmount),
        totalCost: Number(item.totalCost.toFixed(2)),
        effectiveCost: inPantry ? 0 : Number(item.totalCost.toFixed(2)),
        inPantry
      };
    });

    const byCategory = allItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const customItemsTotal = customShopItems.reduce((s, i) => s + Number(i.price || 0), 0);
    const grossTotalCost = allItems.reduce((sum, i) => sum + i.totalCost, 0) + customItemsTotal;
    const savedByPantryCost = allItems.reduce((sum, i) => sum + (i.inPantry ? i.totalCost : 0), 0);
    const netToPayCost = allItems.reduce((sum, i) => sum + i.effectiveCost, 0) + customItemsTotal;

    return {
      allItems,
      byCategory,
      customItemsTotal: Number(customItemsTotal.toFixed(2)),
      grossTotalCost: Number(grossTotalCost.toFixed(2)),
      savedByPantryCost: Number(savedByPantryCost.toFixed(2)),
      netToPayCost: Number(netToPayCost.toFixed(2))
    };
  }, [weeklyPlan, trainingDays, pantryItems, appliedOptimizations, mealMultipliers, customShopItems, customAiMeals]);

  // ==========================================
  // AKCJE UŻYTKOWNIKA I GENERATORA AI
  // ==========================================
  const toggleTrainingDay = (dayIdx) => {
    setTrainingDays((prev) => {
      const nextState = !prev[dayIdx];
      showToast(
        nextState
          ? `Dzień Treningowy (${DAYS_OF_WEEK[dayIdx].full}): +${userGoals.trainingBonusKcal} kcal i +${userGoals.trainingBonusCarbs}g W`
          : `Wyłączono Dzień Treningowy (${DAYS_OF_WEEK[dayIdx].full})`
      );
      return { ...prev, [dayIdx]: nextState };
    });
  };

  const togglePortionMultiplier = (dayIdx, slotKey, e) => {
    e.stopPropagation();
    const key = `${dayIdx}-${slotKey}`;
    setMealMultipliers((prev) => {
      const next = prev[key] === 2 ? 1 : 2;
      showToast(
        next === 2
          ? 'Włączono gotowanie na 2 porcje (2x) – przeliczono gramaturę i koszyk zakupowy!'
          : 'Powrót do standardowej 1 porcji (1x).'
      );
      return { ...prev, [key]: next };
    });
  };

  const toggleMealEaten = (dayIdx, slotKey, e) => {
    e.stopPropagation();
    const key = `${dayIdx}-${slotKey}`;
    setEatenMeals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegenerateMeal = (dayIdx, slotKey, e) => {
    e.stopPropagation();
    const loadingKey = `${dayIdx}-${slotKey}`;
    setRegeneratingSlot(loadingKey);

    setTimeout(() => {
      // Usuwamy ewentualny customowy posiłek z lodówki na rzecz nowego z puli AI
      setCustomAiMeals((prev) => {
        const copy = { ...prev };
        delete copy[loadingKey];
        return copy;
      });
      setWeeklyPlan((prev) => {
        const currentIdx = prev[dayIdx][slotKey];
        const poolLength = MEALS_POOL[slotKey].length;
        const nextIdx = (currentIdx + 1) % poolLength;
        return {
          ...prev,
          [dayIdx]: {
            ...prev[dayIdx],
            [slotKey]: nextIdx
          }
        };
      });
      setRegeneratingSlot(null);
      showToast('AI wygenerowało alternatywny posiłek o identycznym makro!');
    }, 450);
  };

  const handleGenerateFromFridgeAI = (e) => {
    e.preventDefault();
    if (!fridgePrompt.trim()) return;

    const lower = fridgePrompt.toLowerCase();
    const detectedIngs = [];
    if (lower.includes('skyr') || lower.includes('jogurt')) detectedIngs.push({ id: 'skyr', amount: 160, scalableCarb: false });
    if (lower.includes('kurczak') || lower.includes('pierś')) detectedIngs.push({ id: 'chicken', amount: 165, scalableCarb: false });
    if (lower.includes('jaj')) detectedIngs.push({ id: 'eggs', amount: 180, scalableCarb: false });
    if (lower.includes('twaróg') || lower.includes('ser')) detectedIngs.push({ id: 'twarog', amount: 150, scalableCarb: false });
    if (lower.includes('tofu')) detectedIngs.push({ id: 'tofu', amount: 180, scalableCarb: false });
    if (lower.includes('tuńczyk')) detectedIngs.push({ id: 'tuna', amount: 120, scalableCarb: false });

    if (lower.includes('banan')) detectedIngs.push({ id: 'banana', amount: 120, scalableCarb: true });
    if (lower.includes('ryż')) detectedIngs.push({ id: 'rice', amount: 100, scalableCarb: true });
    if (lower.includes('makaron')) detectedIngs.push({ id: 'pasta', amount: 105, scalableCarb: true });
    if (lower.includes('płatki') || lower.includes('owsian')) detectedIngs.push({ id: 'oats', amount: 85, scalableCarb: true });

    if (lower.includes('masło') || lower.includes('orzech')) detectedIngs.push({ id: 'pb', amount: 25, scalableCarb: false });
    if (lower.includes('szpinak')) detectedIngs.push({ id: 'spinach', amount: 70, scalableCarb: false });
    if (lower.includes('awokado')) detectedIngs.push({ id: 'avocado', amount: 70, scalableCarb: false });

    // Domyślne dopełnienie makro, jeśli wpisano nietypowe słowa
    if (detectedIngs.length < 2) {
      detectedIngs.push(
        { id: 'skyr', amount: 150, scalableCarb: false },
        { id: 'oats', amount: 80, scalableCarb: true },
        { id: 'pb', amount: 20, scalableCarb: false }
      );
    }

    const customKey = `${selectedDay}-${fridgeTargetSlot}`;
    const newMeal = {
      id: `custom-${Date.now()}`,
      name: `AI Custom Bowl z lodówki (${fridgePrompt})`,
      prepTime: '10 min (Zero Waste AI)',
      tags: ['Z Twojej lodówki', 'Dopasowane Makro'],
      baseMacros: { kcal: 610, p: 36, f: 17, c: 78 },
      ingredients: detectedIngs,
      steps: [
        `Przygotuj składniki wskazane w kreatorze lodówki: ${fridgePrompt}.`,
        'Połącz bazę białkową ze źródłem węglowodanów w odpowiednich gramaturach obliczonych przez AI.',
        'Dopraw do smaku i podawaj od razu lub zapakuj do lunchboxa.'
      ]
    };

    setCustomAiMeals((prev) => ({ ...prev, [customKey]: newMeal }));
    setExpandedMealKey(customKey);
    setIsFridgeAiOpen(false);
    showToast(`AI ułożyło posiłek z Twoich składników (${fridgePrompt}) i wstawiło do planu!`);
  };

  const handleGenerateFullWeekAI = () => {
    setIsGeneratingWeek(true);
    setTimeout(() => {
      const newPlan = {};
      for (let d = 0; d < 7; d++) {
        newPlan[d] = {
          breakfast: Math.floor(Math.random() * MEALS_POOL.breakfast.length),
          second_breakfast: Math.floor(Math.random() * MEALS_POOL.second_breakfast.length),
          lunch: Math.floor(Math.random() * MEALS_POOL.lunch.length),
          dinner: Math.floor(Math.random() * MEALS_POOL.dinner.length)
        };
      }
      setCustomAiMeals({});
      setWeeklyPlan(newPlan);
      setIsGeneratingWeek(false);
      showToast('AI wygenerowało nowy 7-dniowy plan i zsynchronizowało z chmurą!');
    }, 750);
  };

  const togglePantryItem = (ingId) => {
    setPantryItems((prev) => {
      const next = !prev[ingId];
      const name = INGREDIENTS_DB[ingId]?.name || 'Produkt';
      showToast(
        next
          ? `Oznaczono "${name}" jako dostępne w domu – odjęto z rachunku!`
          : `Przywrócono "${name}" na listę zakupów.`
      );
      return { ...prev, [ingId]: next };
    });
  };

  const handleAddCustomShopItem = (e) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;
    const priceNum = parseFloat(newCustomItemPrice.replace(',', '.')) || 8.50;
    setCustomShopItems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: newCustomItemName.trim(), price: priceNum, checked: false }
    ]);
    setNewCustomItemName('');
    setNewCustomItemPrice('');
    showToast('Dodano dodatkowy produkt domowy do koszyka.');
  };

  const handleCopyShoppingList = () => {
    const itemsToBuy = aggregatedShoppingData.allItems.filter((i) => !i.inPantry && !checkedShopItems[i.id]);
    const lines = [
      `🛒 LISTA ZAKUPÓW AI (${aggregatedShoppingData.netToPayCost.toFixed(2)} PLN):`,
      ...itemsToBuy.map((i) => `- ${i.name}: ${i.totalAmount}${i.unit} (~${i.effectiveCost.toFixed(1)} zł)`),
      ...customShopItems.filter((c) => !c.checked).map((c) => `- [Dom] ${c.name} (~${c.price.toFixed(1)} zł)`)
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Skopiowano listę zakupów do schowka! Możesz wkleić ją na WhatsApp lub w SMS.');
  };

  const applyAllBudgetOptimizations = () => {
    setAppliedOptimizations({
      swapSalmonToTwarog: true,
      swapBeefToChicken: true,
      swapBerriesToApples: true,
      swapAvocadoToEggs: true
    });
    showToast('AI zoptymalizowało koszyk! Podmieniono drogie składniki z zachowaniem 100% białka.');
  };

  // Paleta Clean Aesthetic: Warm Beige / Sand / Espresso
  const theme = {
    bgMain: darkMode ? 'bg-[#181412] text-[#F5EFEA]' : 'bg-[#F7F4EF] text-[#2C221E]',
    bgCard: darkMode ? 'bg-[#241E1B] border-[#382E29]' : 'bg-white border-[#E6DFD5]',
    bgSubtle: darkMode ? 'bg-[#2E2622] border-[#3F342F]' : 'bg-[#EFECE6] border-[#E2D9CC]',
    textMuted: darkMode ? 'text-[#A39388]' : 'text-[#7D6E65]',
    accentPrimary: darkMode ? 'bg-[#C89D7C] hover:bg-[#D4AB8B] text-[#181412]' : 'bg-[#7C5841] hover:bg-[#664734] text-[#F7F4EF]',
    badgeTraining: darkMode ? 'bg-[#423023] text-[#F0C9A2] border-[#6E4F38]' : 'bg-[#F3E7D8] text-[#7C5841] border-[#DBC3A8]'
  };

  const shopItemsToBuy = aggregatedShoppingData.allItems.filter((i) => !i.inPantry);
  const boughtCount = shopItemsToBuy.filter((i) => checkedShopItems[i.id]).length;
  const shopProgressPercent = shopItemsToBuy.length > 0 ? Math.round((boughtCount / shopItemsToBuy.length) * 100) : 100;

  const budgetRatio = (aggregatedShoppingData.netToPayCost / weeklyBudget) * 100;
  const remainingBudget = Number((weeklyBudget - aggregatedShoppingData.netToPayCost).toFixed(2));

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans pb-24 lg:pb-12 ${theme.bgMain}`}>
      {/* POWIADOMIENIE TOAST */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-50 max-w-md">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl bg-[#2C221E] text-[#F7F4EF] border border-[#A68A71]">
            <Sparkles className="w-5 h-5 text-[#C89D7C] shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* GÓRNY PASEK NAWIGACJI I SYNCHRONIZACJI CHMUROWEJ */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-95 ${theme.bgCard}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C5841] to-[#2C221E] flex items-center justify-center text-[#F7F4EF] shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none">
                  AI Life & Diet Manager
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7C5841]/15 text-[#7C5841] border border-[#7C5841]/30">
                  CLOUD PWA
                </span>
              </div>
              <p className={`text-xs mt-0.5 hidden sm:block ${theme.textMuted}`}>
                {userGoals.userName} • Synchronizacja między telefonem a komputerem
              </p>
            </div>
          </div>

          {/* Prawa strona nagłówka: Chmura + Telefon PWA + Konto + Motyw */}
          <div className="flex items-center gap-2">
            {/* Status Chmury Firebase */}
            <div
              onClick={() => showToast(user ? `Połączono z chmurą Firebase (ID: ${user.uid.slice(0, 8)}...)` : 'Działa zapis lokalny')}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${theme.bgSubtle}`}
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  cloudStatus === 'syncing'
                    ? 'animate-bounce text-amber-500'
                    : cloudStatus === 'synced'
                    ? 'text-emerald-600'
                    : 'text-[#7C5841]'
                }`}
              />
              <span className="hidden md:inline">
                {cloudStatus === 'syncing'
                  ? 'Zapisywanie w chmurze...'
                  : cloudStatus === 'synced'
                  ? 'Zsynchronizowano w chmurze'
                  : 'Zapis lokalny'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  cloudStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>

            {/* Przycisk: Jak zainstalować na telefonie (PWA) */}
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition hover:border-[#7C5841] ${theme.bgSubtle}`}
              title="Zainstaluj aplikację na ekranie telefonu"
            >
              <Smartphone className="w-4 h-4 text-[#7C5841]" />
              <span className="hidden sm:inline">Aplikacja na telefon</span>
            </button>

            {/* Przycisk Konta i Celów */}
            <button
              onClick={() => setIsGoalsModalOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition hover:border-[#7C5841] ${theme.bgSubtle}`}
              title="Konto i ustawienia makro"
            >
              <User className="w-4 h-4 text-[#7C5841]" />
              <span className="hidden sm:inline">Konto</span>
            </button>

            {/* Przełącznik Motywu */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition ${theme.bgSubtle}`}
              title={darkMode ? 'Tryb Jasny Beż' : 'Tryb Ciemny Espresso'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#C89D7C]" /> : <Moon className="w-4 h-4 text-[#7C5841]" />}
            </button>
          </div>
        </div>
      </header>

      {/* GŁÓWNA SIATKA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR NA DESKTOPIE */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${theme.bgCard}`}>
            <p className={`text-xs font-bold uppercase tracking-wider px-3 pb-2 ${theme.textMuted}`}>
              Nawigacja
            </p>
            {[
              { id: 'planner', label: 'Planer Posiłków AI', icon: Calendar, badge: '7 dni' },
              {
                id: 'shopping',
                label: 'Zakupy i Spiżarnia',
                icon: ShoppingBag,
                badge: `${shopItemsToBuy.length - boughtCount} do kup.`
              },
              {
                id: 'budget',
                label: 'Budżet i Zamienniki',
                icon: Wallet,
                badge: `${aggregatedShoppingData.netToPayCost.toFixed(0)} zł`
              },
              { id: 'architecture', label: 'Chmura & Telefon PWA', icon: Smartphone, badge: 'Info' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-[#7C5841] text-[#F7F4EF] shadow-sm'
                      : `hover:bg-[#7C5841]/10 ${theme.textMuted}`
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : theme.bgSubtle
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Karta Konta i Chmury w Sidebarze */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${theme.bgCard}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C5841]">
                Podsumowanie Tygodnia
              </span>
              <ShieldCheck className="w-4 h-4 text-[#7C5841]" />
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className={theme.textMuted}>Zjedzone dziś:</span>
                <span className="font-bold">
                  {currentDayStats.eatenCount} / 4 posiłki ({currentDayStats.eatenKcal} kcal)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={theme.textMuted}>Dni treningowe:</span>
                <span className="font-bold">
                  {Object.values(trainingDays).filter(Boolean).length} dni (+250 kcal)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={theme.textMuted}>Oszczędność spiżarni:</span>
                <span className="font-bold text-emerald-600">
                  -{aggregatedShoppingData.savedByPantryCost.toFixed(2)} PLN
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6DFD5]/40 flex justify-between items-center">
                <span className="font-medium">Koszyk sklepowy:</span>
                <span className={`font-bold text-base ${remainingBudget < 0 ? 'text-rose-500' : ''}`}>
                  {aggregatedShoppingData.netToPayCost.toFixed(2)} / {weeklyBudget} PLN
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyShoppingList}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition hover:border-[#7C5841] ${theme.bgSubtle}`}
            >
              <Share2 className="w-3.5 h-3.5 text-[#7C5841]" />
              Wyślij listę zakupów (WhatsApp)
            </button>
          </div>
        </aside>

        {/* GŁÓWNA PRZESTRZEŃ ROBOCZA */}
        <main className="lg:col-span-9 space-y-6">
          {/* GÓRNY PANEL CELÓW I PRZYCISKÓW AI */}
          <section className={`p-5 rounded-2xl border shadow-sm ${theme.bgCard}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD5]/40">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#7C5841]/15 text-[#7C5841]">
                    Cel Sylwetkowy
                  </span>
                  <h2 className="text-lg font-bold">{userGoals.goalName}</h2>
                  {trainingDays[selectedDay] && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${theme.badgeTraining}`}>
                      <Dumbbell className="w-3.5 h-3.5" />
                      Dzień Treningowy (+{userGoals.trainingBonusKcal} kcal / +{userGoals.trainingBonusCarbs}g W)
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>
                  Zjedzono dziś: <strong>{currentDayStats.eatenKcal} kcal</strong> z zaplanowanych {currentDayStats.kcal} kcal ({currentDayStats.eatenCount}/4 posiłków)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsFridgeAiOpen(true)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition hover:border-[#7C5841] ${theme.bgSubtle}`}
                >
                  <Refrigerator className="w-3.5 h-3.5 text-[#7C5841]" />
                  Generuj z lodówki (AI)
                </button>
                <button
                  onClick={handleGenerateFullWeekAI}
                  disabled={isGeneratingWeek}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition ${theme.accentPrimary}`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingWeek ? 'animate-spin' : ''}`} />
                  {isGeneratingWeek ? 'AI przelicza...' : 'Nowy tydzień z AI'}
                </button>
              </div>
            </div>

            {/* 4 Kafelki Makro dla wybranego dnia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {[
                {
                  label: `Kalorie (${DAYS_OF_WEEK[selectedDay].short})`,
                  current: currentDayStats.kcal,
                  target: currentDayTargets.kcal,
                  unit: 'kcal',
                  color: 'bg-[#7C5841]'
                },
                {
                  label: 'Białko (Cel)',
                  current: currentDayStats.p,
                  target: currentDayTargets.p,
                  unit: 'g',
                  color: 'bg-emerald-600'
                },
                {
                  label: 'Węglowodany',
                  current: currentDayStats.c,
                  target: currentDayTargets.c,
                  unit: 'g',
                  color: 'bg-amber-600',
                  highlight: trainingDays[selectedDay]
                },
                {
                  label: 'Tłuszcze',
                  current: currentDayStats.f,
                  target: currentDayTargets.f,
                  unit: 'g',
                  color: 'bg-[#A68A71]'
                }
              ].map((m, idx) => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition ${
                      m.highlight ? theme.badgeTraining : theme.bgSubtle
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-medium mb-1">
                      <span className="truncate">{m.label}</span>
                      {m.highlight && <Flame className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold">{m.current}</span>
                      <span className="text-xs opacity-75">
                        / {m.target} {m.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/10 mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================== */}
          {/* MODUŁ 1: PLANER POSIŁKÓW AI (ENHANCED)     */}
          {/* ========================================== */}
          {activeTab === 'planner' && (
            <div className="space-y-5">
              {/* Kalendarz Tygodniowy Pon - Ndz */}
              <div className={`p-4 rounded-2xl border shadow-sm ${theme.bgCard}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#7C5841]" />
                    Wybierz Dzień Tygodnia
                  </h3>
                  <span className={`text-xs ${theme.textMuted}`}>
                    Kliknij „Trening”, aby zwiększyć węglowodany w danym dniu
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDay === day.index;
                    const isWorkout = trainingDays[day.index];
                    return (
                      <div
                        key={day.index}
                        onClick={() => setSelectedDay(day.index)}
                        className={`cursor-pointer rounded-2xl p-2 sm:p-3 border transition-all flex flex-col items-center justify-between ${
                          isSelected
                            ? 'bg-[#7C5841] text-[#F7F4EF] border-[#2C221E] shadow-md scale-[1.02]'
                            : `${theme.bgSubtle} hover:border-[#7C5841]`
                        }`}
                      >
                        <span className="text-xs font-bold">{day.short}</span>
                        <div className="my-1.5">
                          {isWorkout ? (
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-black/25 text-white' : 'bg-[#7C5841]/20 text-[#7C5841]'
                              }`}
                            >
                              <Dumbbell className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-xl flex items-center justify-center opacity-40 text-xs">
                              Rest
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrainingDay(day.index);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition ${
                            isWorkout
                              ? isSelected
                                ? 'bg-amber-300/25 text-amber-100'
                                : 'bg-[#7C5841]/15 text-[#7C5841]'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {isWorkout ? 'Trening' : '+Trening'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pasek statusu treningowego wybranego dnia */}
                <div className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.bgSubtle}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${trainingDays[selectedDay] ? 'bg-[#7C5841] text-white' : 'bg-black/10'}`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">
                        {DAYS_OF_WEEK[selectedDay].full}: {trainingDays[selectedDay] ? 'Dzień Treningowy Aktywny' : 'Dzień Regeneracji (Rest Day)'}
                      </span>
                      <p className={`text-xs ${theme.textMuted}`}>
                        {trainingDays[selectedDay]
                          ? `${DAYS_OF_WEEK[selectedDay].workoutName} • Automatycznie zwiększono gramaturę płatków, ryżu i makaronu.`
                          : 'Standardowy rozkład makroskładników. Kliknij obok, jeśli idziesz dziś na trening.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTrainingDay(selectedDay)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                      trainingDays[selectedDay]
                        ? 'bg-[#7C5841] text-white shadow-sm'
                        : 'border border-[#7C5841] text-[#7C5841] hover:bg-[#7C5841]/10'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    {trainingDays[selectedDay] ? 'Wyłącz Dzień Treningowy' : 'Włącz Dzień Treningowy (+250 kcal)'}
                  </button>
                </div>
              </div>

              {/* Lista 4 Posiłków na dany dzień */}
              <div className="space-y-3.5">
                {['breakfast', 'second_breakfast', 'lunch', 'dinner'].map((slotKey) => {
                  const meal = getComputedMeal(selectedDay, slotKey);
                  const slotMeta = SLOT_LABELS[slotKey];
                  const cardKey = `${selectedDay}-${slotKey}`;
                  const isExpanded = expandedMealKey === cardKey;
                  const isRegenerating = regeneratingSlot === cardKey;
                  const isEaten = !!eatenMeals[cardKey];
                  const mealTotalCost = meal.ingredients.reduce((s, i) => s + i.cost, 0);

                  return (
                    <div
                      key={slotKey}
                      className={`rounded-2xl border shadow-sm transition-all overflow-hidden ${theme.bgCard} ${
                        isRegenerating ? 'opacity-60 scale-[0.99]' : ''
                      }`}
                    >
                      <div
                        onClick={() => setExpandedMealKey(isExpanded ? null : cardKey)}
                        className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#7C5841]/[0.03] transition"
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Checkbox Zjedzone */}
                          <button
                            type="button"
                            onClick={(e) => toggleMealEaten(selectedDay, slotKey, e)}
                            className={`mt-1 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition ${
                              isEaten
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : `${theme.bgSubtle} hover:border-[#7C5841]`
                            }`}
                            title="Oznacz posiłek jako zjedzony"
                          >
                            {isEaten ? <Check className="w-5 h-5" /> : <span className="text-base">{slotMeta.icon}</span>}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#7C5841]">
                                {slotMeta.label} • {slotMeta.time}
                              </span>
                              <span className={`text-xs flex items-center gap-1 ${theme.textMuted}`}>
                                <Clock className="w-3 h-3" /> {meal.prepTime}
                              </span>
                              {isEaten && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600">
                                  ✓ Zjedzone
                                </span>
                              )}
                              {meal.portionMultiplier === 2 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#7C5841]/20 text-[#7C5841]">
                                  Gotujesz 2 porcje (2x)
                                </span>
                              )}
                            </div>

                            <h4 className={`font-bold text-base sm:text-lg leading-snug ${isEaten ? 'line-through opacity-70' : ''}`}>
                              {meal.name}
                            </h4>

                            {/* Pigułki Makro */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#7C5841] text-[#F7F4EF]">
                                {meal.macros.kcal} kcal
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${theme.bgSubtle}`}>
                                B: <strong>{meal.macros.p}g</strong>
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${theme.bgSubtle}`}>
                                T: <strong>{meal.macros.f}g</strong>
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${
                                  trainingDays[selectedDay] ? theme.badgeTraining : theme.bgSubtle
                                }`}
                              >
                                W: <strong>{meal.macros.c}g</strong>
                              </span>
                              <span className={`text-xs ${theme.textMuted}`}>
                                • ~{mealTotalCost.toFixed(2)} zł
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Przyciski akcji: Mnożnik 1x/2x + Regeneruj AI */}
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => togglePortionMultiplier(selectedDay, slotKey, e)}
                            className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                              meal.portionMultiplier === 2
                                ? 'bg-[#7C5841] text-white border-[#7C5841]'
                                : `${theme.bgSubtle} hover:border-[#7C5841]`
                            }`}
                            title="Przełącz gotowanie na 1 lub 2 porcje (np. dla partnera lub na 2 dni)"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{meal.portionMultiplier}x</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleRegenerateMeal(selectedDay, slotKey, e)}
                            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition hover:border-[#7C5841] ${theme.bgSubtle}`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#7C5841] ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>Regeneruj</span>
                          </button>

                          <div className={`p-2 rounded-xl border ${theme.bgSubtle}`}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Rozwinięte szczegóły posiłku */}
                      {isExpanded && (
                        <div className={`px-4 sm:px-5 pb-5 pt-3 border-t border-[#E6DFD5]/40 grid grid-cols-1 md:grid-cols-12 gap-6 ${theme.bgSubtle}`}>
                          <div className="md:col-span-5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-[#7C5841]">
                                Składniki ({meal.portionMultiplier} {meal.portionMultiplier === 1 ? 'porcja' : 'porcje'})
                              </h5>
                              <span className="text-[11px] opacity-75">Status w spiżarni</span>
                            </div>

                            <div className="space-y-1.5">
                              {meal.ingredients.map((ing, i) => {
                                const inHome = !!pantryItems[ing.id];
                                return (
                                  <div
                                    key={i}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${theme.bgCard}`}
                                  >
                                    <div>
                                      <span className="font-semibold">{ing.name}</span>
                                      {ing.wasScaledForTraining && (
                                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7C5841]/20 text-[#7C5841]">
                                          +Trening
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <span className="font-bold text-sm">
                                        {ing.amount} {ing.unit}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => togglePantryItem(ing.id)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${
                                          inHome
                                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                            : 'opacity-60 hover:opacity-100'
                                        }`}
                                      >
                                        {inHome ? '✓ W domu' : 'Kup'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="md:col-span-7 space-y-2.5">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[#7C5841] flex items-center gap-1.5">
                              <ChefHat className="w-4 h-4" />
                              Instrukcja przygotowania krok po kroku
                            </h5>
                            <ol className="space-y-2">
                              {meal.steps.map((step, sIdx) => (
                                <li
                                  key={sIdx}
                                  className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed flex gap-3 ${theme.bgCard}`}
                                >
                                  <span className="w-6 h-6 rounded-lg bg-[#7C5841] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {sIdx + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* MODUŁ 2: ZAKUPY + TRYB SKLEPOWY + SPIŻARNIA*/}
          {/* ========================================== */}
          {activeTab === 'shopping' && (
            <div className="space-y-6">
              {/* Pasek narzędzi sklepowych: Tryb Sklepowy Focus + Udostępnianie */}
              <div className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bgCard}`}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7C5841]">
                    Asystent Zakupów na Telefonie
                  </span>
                  <h3 className="text-lg font-bold">
                    Inteligentna Lista Zakupów ({shopItemsToBuy.length - boughtCount} pozostało)
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Włącz „Tryb Sklepowy”, aby powiększyć przyciski pod obsługę jedną ręką i ukryć kupione produkty.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShopFocusMode(!shopFocusMode)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                      shopFocusMode
                        ? 'bg-[#7C5841] text-white border-[#7C5841]'
                        : `${theme.bgSubtle} hover:border-[#7C5841]`
                    }`}
                  >
                    {shopFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {shopFocusMode ? 'Tryb Sklepowy: AKTYWNY' : 'Włącz Tryb Sklepowy'}
                  </button>

                  <button
                    onClick={handleCopyShoppingList}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${theme.bgSubtle}`}
                  >
                    <Copy className="w-4 h-4 text-[#7C5841]" />
                    Kopiuj na WhatsApp
                  </button>
                </div>
              </div>

              {/* Sekcja 1: Moduł "Mam w domu (Spiżarnia)" - ukrywana w Trybie Sklepowym */}
              {!shopFocusMode && (
                <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${theme.bgCard}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7C5841] flex items-center gap-1.5">
                        <Home className="w-4 h-4" />
                        Domowy Magazyn (Spiżarnia / Lodówka)
                      </span>
                      <h3 className="text-base font-bold mt-0.5">
                        Zaznacz produkty, które masz już w domu
                      </h3>
                    </div>
                    <div className={`px-3.5 py-1.5 rounded-xl border text-right shrink-0 ${theme.bgSubtle}`}>
                      <span className={`text-[11px] block ${theme.textMuted}`}>Oszczędność ze spiżarni:</span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        -{aggregatedShoppingData.savedByPantryCost.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {aggregatedShoppingData.allItems.map((item) => {
                      const isOwned = item.inPantry;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => togglePantryItem(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                            isOwned
                              ? 'bg-emerald-500/10 border-emerald-600/40'
                              : `${theme.bgSubtle} opacity-80 hover:opacity-100`
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className={`text-[10px] ${theme.textMuted}`}>
                              {item.totalAmount}{item.unit} ({item.totalCost.toFixed(1)} zł)
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                              isOwned ? 'bg-emerald-600 text-white' : 'border border-[#7C5841]/40'
                            }`}
                          >
                            {isOwned && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sekcja 2: Dodatkowe zakupy spoza diety (np. chemia, kawa) */}
              <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${theme.bgCard}`}>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#7C5841]" />
                  Dodatkowe zakupy domowe (spoza planu posiłków)
                </h4>

                <form onSubmit={handleAddCustomShopItem} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Np. Kawa ziarnista, ręcznik papierowy..."
                    value={newCustomItemName}
                    onChange={(e) => setNewCustomItemName(e.target.value)}
                    className={`flex-1 px-3.5 py-2 rounded-xl border text-xs ${theme.bgSubtle}`}
                  />
                  <input
                    type="text"
                    placeholder="Cena (np. 15 zł)"
                    value={newCustomItemPrice}
                    onChange={(e) => setNewCustomItemPrice(e.target.value)}
                    className={`w-36 px-3.5 py-2 rounded-xl border text-xs ${theme.bgSubtle}`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 ${theme.accentPrimary}`}
                  >
                    + Dodaj do listy
                  </button>
                </form>

                {customShopItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customShopItems.map((cItem) => (
                      <div
                        key={cItem.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${theme.bgSubtle}`}
                      >
                        <div
                          onClick={() =>
                            setCustomShopItems((prev) =>
                              prev.map((x) => (x.id === cItem.id ? { ...x, checked: !x.checked } : x))
                            )
                          }
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              cItem.checked ? 'bg-[#7C5841] border-[#7C5841] text-white' : 'border-[#7C5841]'
                            }`}
                          >
                            {cItem.checked && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`font-semibold ${cItem.checked ? 'line-through opacity-50' : ''}`}>
                            {cItem.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{Number(cItem.price).toFixed(2)} zł</span>
                          <button
                            onClick={() => setCustomShopItems((prev) => prev.filter((x) => x.id !== cItem.id))}
                            className="p-1 opacity-60 hover:opacity-100 text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sekcja 3: Kategorie sklepowe */}
              <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${theme.bgCard}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries(aggregatedShoppingData.byCategory).map(([category, items]) => {
                    const visibleItems = shopFocusMode
                      ? items.filter((i) => !i.inPantry && !checkedShopItems[i.id])
                      : items;

                    if (visibleItems.length === 0) return null;

                    return (
                      <div key={category} className={`p-4 rounded-2xl border space-y-3 ${theme.bgSubtle}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#7C5841] uppercase tracking-wider">
                            {category}
                          </h4>
                          <span className="text-xs font-semibold">
                            {items.filter((i) => !i.inPantry && !checkedShopItems[i.id]).length} pozostało
                          </span>
                        </div>

                        <div className="space-y-2">
                          {visibleItems.map((item) => {
                            const isBought = !!checkedShopItems[item.id];
                            if (item.inPantry) {
                              return (
                                <div
                                  key={item.id}
                                  className="px-3 py-2 rounded-xl border border-dashed border-emerald-600/30 bg-emerald-500/5 flex items-center justify-between text-xs opacity-70"
                                >
                                  <div className="flex items-center gap-2">
                                    <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="line-through">{item.name}</span>
                                  </div>
                                  <span className="text-[11px] font-semibold text-emerald-600">
                                    W domu ({item.totalAmount}{item.unit})
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                onClick={() =>
                                  setCheckedShopItems((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))
                                }
                                className={`cursor-pointer rounded-xl border transition flex items-center justify-between gap-3 ${
                                  shopFocusMode ? 'p-4' : 'p-3'
                                } ${isBought ? 'opacity-45 bg-black/5' : theme.bgCard}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`${
                                      shopFocusMode ? 'w-7 h-7' : 'w-5 h-5'
                                    } rounded-lg flex items-center justify-center border transition ${
                                      isBought
                                        ? 'bg-[#7C5841] border-[#7C5841] text-white'
                                        : 'border-[#7C5841]'
                                    }`}
                                  >
                                    {isBought && <Check className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-semibold ${isBought ? 'line-through' : ''}`}>
                                      {item.name}
                                    </p>
                                    <p className={`text-[11px] ${theme.textMuted}`}>
                                      W {item.occurrences} posiłkach tygodnia
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-sm font-extrabold block">
                                    {item.totalAmount} {item.unit}
                                  </span>
                                  <span className={`text-xs ${theme.textMuted}`}>
                                    ~{item.effectiveCost.toFixed(2)} zł
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* MODUŁ 3: BUDŻET TYGODNIOWY I ZAMIENNIKI AI */}
          {/* ========================================== */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border shadow-sm space-y-6 ${theme.bgCard}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C5841]">
                      Finanse Tygodniowe
                    </span>
                    <h3 className="text-xl font-bold mt-0.5">
                      Kontrola Budżetu i Koszyka
                    </h3>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Uwzględnia składniki diety, mnożniki porcji (2x), zasoby spiżarni oraz dodatkowe zakupy domowe.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col gap-2 min-w-[260px] ${theme.bgSubtle}`}>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>Twój Limit Tygodniowy:</span>
                      <span className="text-base text-[#7C5841]">{weeklyBudget} PLN</span>
                    </div>
                    <input
                      type="range"
                      min="180"
                      max="600"
                      step="10"
                      value={weeklyBudget}
                      onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                      className="w-full accent-[#7C5841] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-2xl border ${theme.bgSubtle}`}>
                    <span className={`text-xs ${theme.textMuted}`}>Wartość całego koszyka:</span>
                    <p className="text-2xl font-extrabold mt-1">
                      {aggregatedShoppingData.grossTotalCost.toFixed(2)} PLN
                    </p>
                    <span className="text-[11px] opacity-75">
                      W tym dodatki domowe: {aggregatedShoppingData.customItemsTotal.toFixed(2)} PLN
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${theme.bgSubtle}`}>
                    <span className={`text-xs ${theme.textMuted}`}>Odjęto dzięki „Mam w domu”:</span>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      -{aggregatedShoppingData.savedByPantryCost.toFixed(2)} PLN
                    </p>
                    <span className="text-[11px] opacity-75">Produkty z Twojej spiżarni</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      remainingBudget < 0
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-[#7C5841]/15 border-[#7C5841]/40'
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {remainingBudget >= 0 ? 'Pozostały budżet:' : 'Przekroczenie budżetu:'}
                    </span>
                    <p className={`text-2xl font-extrabold mt-1 ${remainingBudget < 0 ? 'text-rose-500' : ''}`}>
                      {remainingBudget >= 0 ? `+${remainingBudget.toFixed(2)} PLN` : `${remainingBudget.toFixed(2)} PLN`}
                    </p>
                    <span className="text-[11px] opacity-80">
                      Do zapłaty: <strong>{aggregatedShoppingData.netToPayCost.toFixed(2)} PLN</strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-4 rounded-full bg-black/10 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetRatio > 100 ? 'bg-rose-500' : budgetRatio > 85 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, budgetRatio)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Zamienniki AI */}
              <div className={`p-6 rounded-2xl border shadow-sm space-y-5 ${theme.bgCard}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      AI Smart Swaps – Tańsze zamienniki o tym samym makro
                    </h3>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Obniż rachunek jednym kliknięciem bez utraty ani jednego grama białka.
                    </p>
                  </div>
                  <button
                    onClick={applyAllBudgetOptimizations}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 transition ${theme.accentPrimary}`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Zastosuj wszystkie oszczędności AI
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: 'swapSalmonToTwarog',
                      expensive: 'Łosoś atlantycki świeży (98 zł/kg)',
                      cheaper: 'Twaróg chudy / Dorsz (21 zł/kg)',
                      estSavings: '22.40 PLN'
                    },
                    {
                      key: 'swapBeefToChicken',
                      expensive: 'Polędwica wołowa (69 zł/kg)',
                      cheaper: 'Pierś z kurczaka filet (32 zł/kg)',
                      estSavings: '14.80 PLN'
                    },
                    {
                      key: 'swapBerriesToApples',
                      expensive: 'Borówki amerykańskie świeże (56 zł/kg)',
                      cheaper: 'Jabłka polskie / mrożone jagody (9.50 zł/kg)',
                      estSavings: '16.20 PLN'
                    },
                    {
                      key: 'swapAvocadoToEggs',
                      expensive: 'Awokado Hass (58 zł/kg)',
                      cheaper: 'Orzechy włoskie łuskane',
                      estSavings: '7.50 PLN'
                    }
                  ].map((opt) => {
                    const isApplied = appliedOptimizations[opt.key];
                    return (
                      <div
                        key={opt.key}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                          isApplied ? 'bg-emerald-500/10 border-emerald-600/40' : theme.bgSubtle
                        }`}
                      >
                        <div className="space-y-1.5 text-xs">
                          <span className="font-extrabold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-600">
                            Oszczędzasz ~{opt.estSavings}
                          </span>
                          <p className="line-through opacity-60 pt-1">{opt.expensive}</p>
                          <p className="font-bold text-sm flex items-center gap-1.5">
                            <ArrowRight className="w-4 h-4 text-[#7C5841]" />
                            {opt.cheaper}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setAppliedOptimizations((prev) => ({
                              ...prev,
                              [opt.key]: !prev[opt.key]
                            }))
                          }
                          className={`w-full py-2 rounded-xl text-xs font-bold border transition ${
                            isApplied
                              ? 'border-emerald-600 text-emerald-600'
                              : 'bg-[#7C5841] text-[#F7F4EF]'
                          }`}
                        >
                          {isApplied ? '✓ Zastosowano (Kliknij, by cofnąć)' : 'Podmień w planie'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* MODUŁ 4: CHMURA & INSTRUKCJA TELEFONU PWA  */}
          {/* ========================================== */}
          {activeTab === 'architecture' && (
            <div className={`p-6 rounded-2xl border shadow-sm space-y-5 ${theme.bgCard}`}>
              <h3 className="text-xl font-bold">
                Status Chmury & Instalacja na Telefonie (iOS / Android)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className={`p-4 rounded-2xl border space-y-2 ${theme.bgSubtle}`}>
                  <h4 className="font-bold text-sm text-[#7C5841] flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Synchronizacja Firebase Cloud
                  </h4>
                  <p className="leading-relaxed">
                    Twój identyfikator sesji w chmurze: <code>{user ? user.uid : 'Tryb lokalny'}</code>. Wszystkie zmiany w planie, spiżarni oraz odznaczone zakupy zapisują się automatycznie w kolekcji Firestore.
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border space-y-2 ${theme.bgSubtle}`}>
                  <h4 className="font-bold text-sm text-[#7C5841] flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Aplikacja na Telefonie (PWA)
                  </h4>
                  <p className="leading-relaxed">
                    Wdróż aplikację na darmowym hostingu Vercel lub Firebase Hosting, otwórz link w telefonie i wybierz <strong>„Dodaj do ekranu głównego”</strong>, aby korzystać z niej w sklepie na pełnym ekranie.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DOLNY PASEK NAWIGACJI NA TELEFONIE (THUMB-FRIENDLY) */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-2 flex justify-around items-center ${theme.bgCard}`}>
        {[
          { id: 'planner', label: 'Planer AI', icon: Calendar },
          { id: 'shopping', label: `Zakupy (${shopItemsToBuy.length - boughtCount})`, icon: ShoppingBag },
          { id: 'budget', label: `${aggregatedShoppingData.netToPayCost.toFixed(0)} zł`, icon: Wallet },
          { id: 'architecture', label: 'Telefon', icon: Smartphone }
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                active ? 'bg-[#7C5841] text-[#F7F4EF]' : theme.textMuted
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL 1: GENERATOR POSIŁKÓW Z LODÓWKI (AI) */}
      {isFridgeAiOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${theme.bgCard}`}>
            <div className="flex items-center justify-between border-b border-[#E6DFD5]/40 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Refrigerator className="w-5 h-5 text-[#7C5841]" />
                Generuj posiłek z lodówki (Zero Waste AI)
              </h3>
              <button onClick={() => setIsFridgeAiOpen(false)} className="text-xs font-bold px-2 py-1 rounded-lg border">
                Zamknij
              </button>
            </div>

            <form onSubmit={handleGenerateFromFridgeAI} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Jakie produkty chcesz wykorzystać?</label>
                <input
                  type="text"
                  value={fridgePrompt}
                  onChange={(e) => setFridgePrompt(e.target.value)}
                  placeholder="np. skyr, banan, masło orzechowe..."
                  className={`w-full p-3 rounded-xl border ${theme.bgSubtle}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Który posiłek w dniu ({DAYS_OF_WEEK[selectedDay].full}) podmienić?</label>
                <select
                  value={fridgeTargetSlot}
                  onChange={(e) => setFridgeTargetSlot(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${theme.bgSubtle}`}
                >
                  <option value="breakfast">Śniadanie (08:00)</option>
                  <option value="second_breakfast">II Śniadanie (11:30)</option>
                  <option value="lunch">Obiad (15:30)</option>
                  <option value="dinner">Kolacja (19:30)</option>
                </select>
              </div>

              <button type="submit" className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${theme.accentPrimary}`}>
                <Sparkles className="w-4 h-4" />
                Ułóż przepis i dopasuj gramatury
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: JAK ZAINSTALOWAĆ NA TELEFONIE (PWA) */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 ${theme.bgCard}`}>
            <div className="flex items-center justify-between border-b border-[#E6DFD5]/40 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#7C5841]" />
                Zainstaluj aplikację na swoim telefonie
              </h3>
              <button onClick={() => setIsPwaModalOpen(false)} className="text-xs font-bold px-2.5 py-1 rounded-lg border">
                Zamknij
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className={`p-3.5 rounded-xl border ${theme.bgSubtle}`}>
                <p className="font-bold text-sm text-[#7C5841] mb-1">🍏 iPhone (iOS Safari):</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Otwórz wdrożony link do aplikacji w przeglądarce <strong>Safari</strong>.</li>
                  <li>Kliknij ikonę <strong>Udostępnij</strong> (kwadrat ze strzałką w górę na dole ekranu).</li>
                  <li>Przewiń w dół i kliknij <strong>„Do ekranu początkowego” (Add to Home Screen)</strong>.</li>
                </ol>
              </div>

              <div className={`p-3.5 rounded-xl border ${theme.bgSubtle}`}>
                <p className="font-bold text-sm text-[#7C5841] mb-1">🤖 Android (Google Chrome):</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Otwórz stronę w przeglądarce <strong>Chrome</strong> na telefonie.</li>
                  <li>Kliknij trzy kropki w prawym górnym rogu ekranu.</li>
                  <li>Wybierz <strong>„Zainstaluj aplikację”</strong> lub <strong>„Dodaj do ekranu głównego”</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KONTO UŻYTKOWNIKA I CELE MAKRO */}
      {isGoalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 ${theme.bgCard}`}>
            <div className="flex items-center justify-between border-b border-[#E6DFD5]/40 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#7C5841]" />
                Konto w Chmurze i Cele Sylwetkowe
              </h3>
              <button onClick={() => setIsGoalsModalOpen(false)} className="text-xs font-bold px-2.5 py-1 rounded-lg border">
                Zamknij
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${theme.bgSubtle}`}>
                <span>ID synchronizacji chmurowej (Firebase UID):</span>
                <code className="font-bold text-[#7C5841]">{user ? user.uid : 'Sesja lokalna'}</code>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Nazwa profilu:</label>
                  <input
                    type="text"
                    value={userGoals.userName}
                    onChange={(e) => setUserGoals({ ...userGoals, userName: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Cel sylwetkowy:</label>
                  <input
                    type="text"
                    value={userGoals.goalName}
                    onChange={(e) => setUserGoals({ ...userGoals, goalName: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Bazowe Kalorie (kcal):</label>
                  <input
                    type="number"
                    value={userGoals.baseKcal}
                    onChange={(e) => setUserGoals({ ...userGoals, baseKcal: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Docelowe Białko (g):</label>
                  <input
                    type="number"
                    value={userGoals.baseProtein}
                    onChange={(e) => setUserGoals({ ...userGoals, baseProtein: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Bonus Kcal w Trening:</label>
                  <input
                    type="number"
                    value={userGoals.trainingBonusKcal}
                    onChange={(e) => setUserGoals({ ...userGoals, trainingBonusKcal: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Bonus Węglowodanów (g):</label>
                  <input
                    type="number"
                    value={userGoals.trainingBonusCarbs}
                    onChange={(e) => setUserGoals({ ...userGoals, trainingBonusCarbs: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border ${theme.bgSubtle}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIsGoalsModalOpen(false);
                  showToast('Zapisano profil i zsynchronizowano z chmurą!');
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold ${theme.accentPrimary}`}
              >
                Zapisz w chmurze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}