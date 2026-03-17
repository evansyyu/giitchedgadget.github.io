/**
 * Japanese conjugation engine.
 */

// ── Types ────────────────────────────────────────────────────────

export interface Word {
  kanji: string;
  type: "ru" | "u" | "exv" | "i" | "na" | "exa";
  eng: string;
  kana: string;
}

export interface ConjugationRequest {
  form?: "potential" | "passive" | "causative" | "causativePassive" | "imperative" | "volitional" | null;
  te?: boolean;
  tense?: "present" | "past" | null;
  polarity?: "affirmative" | "negative" | null;
  formality?: "formal" | "casual" | null;
}

// ── Godan helpers ────────────────────────────────────────────────

type Vowel = "a" | "i" | "e" | "o";

const GODAN_TABLE: Record<string, Record<Vowel, string>> = {
  す: { a: "さ", i: "し", e: "せ", o: "そ" },
  つ: { a: "た", i: "ち", e: "て", o: "と" },
  う: { a: "わ", i: "い", e: "え", o: "お" },
  る: { a: "ら", i: "り", e: "れ", o: "ろ" },
  く: { a: "か", i: "き", e: "け", o: "こ" },
  ぐ: { a: "が", i: "ぎ", e: "げ", o: "ご" },
  ぶ: { a: "ば", i: "び", e: "べ", o: "ぼ" },
  ぬ: { a: "な", i: "に", e: "ね", o: "の" },
  む: { a: "ま", i: "み", e: "め", o: "も" },
};

type GodanGroup = "す" | "く" | "む" | "う";
const GODAN_GROUPS: Record<string, GodanGroup> = {
  す: "す",
  く: "く",
  ぐ: "く",
  む: "む",
  ぶ: "む",
  ぬ: "む",
  う: "う",
  る: "う",
  つ: "う",
};

const TE_SUFFIX: Record<GodanGroup, string> = { す: "して", く: "いて", む: "んで", う: "って" };
const TE_SUFFIX_VOICED: Record<string, string> = { ぐ: "いで" };
const TA_SUFFIX: Record<GodanGroup, string> = { す: "した", く: "いた", む: "んだ", う: "った" };
const TA_SUFFIX_VOICED: Record<string, string> = { ぐ: "いだ" };

function lastChar(s: string): string {
  return s[s.length - 1];
}
function chopLast(s: string): string {
  return s.slice(0, -1);
}

function inflect(kana: string, vowel: Vowel): string {
  const last = lastChar(kana);
  return GODAN_TABLE[last]?.[vowel] ?? last;
}

function ichidanStem(kana: string): string {
  return chopLast(kana);
}
function godanStem(kana: string, vowel: Vowel): string {
  return chopLast(kana) + inflect(kana, vowel);
}

// ── Te-form / ta-form builders (godan) ──────────────────────────

function godanTe(kana: string): string {
  const last = lastChar(kana);
  const base = chopLast(kana);
  if (TE_SUFFIX_VOICED[last]) return base + TE_SUFFIX_VOICED[last];
  const group = GODAN_GROUPS[last];
  return base + TE_SUFFIX[group];
}
function godanTa(kana: string): string {
  const last = lastChar(kana);
  const base = chopLast(kana);
  if (TA_SUFFIX_VOICED[last]) return base + TA_SUFFIX_VOICED[last];
  const group = GODAN_GROUPS[last];
  return base + TA_SUFFIX[group];
}

// ── Regular verb conjugation ─────────────────────────────────────

function conjugateRegular(w: Word, c: ConjugationRequest): string {
  const k = w.kana;
  const isRu = w.type === "ru";

  const stem = isRu ? ichidanStem(k) : godanStem(k, "i");
  const aStem = isRu ? ichidanStem(k) : godanStem(k, "a");
  const eStem = isRu ? ichidanStem(k) : godanStem(k, "e");

  if (c.form === "volitional") {
    if (c.formality === "formal") return stem + "ましょう";
    return isRu ? ichidanStem(k) + "よう" : chopLast(k) + inflect(k, "o") + "う";
  }

  if (c.form === "imperative") {
    if (c.polarity === "negative") return k + "な";
    return isRu ? ichidanStem(k) + "ろ" : chopLast(k) + inflect(k, "e");
  }

  if (c.te) {
    if (c.polarity === "negative") return aStem + "なくて";
    return isRu ? ichidanStem(k) + "て" : godanTe(k);
  }

  let dStem: string;
  switch (c.form) {
    case "potential":
      dStem = isRu ? ichidanStem(k) + "られ" : eStem;
      break;
    case "passive":
      dStem = isRu ? ichidanStem(k) + "られ" : aStem + "れ";
      break;
    case "causative":
      dStem = isRu ? ichidanStem(k) + "させ" : aStem + "せ";
      break;
    case "causativePassive":
      dStem = isRu ? ichidanStem(k) + "させられ" : aStem + "せられ";
      break;
    default:
      dStem = "";
  }

  if (c.form && dStem) {
    return finishIchidan(dStem, c);
  }

  // Plain verb (no special form)
  if (c.polarity === "negative") {
    const negStem = isRu ? ichidanStem(k) : chopLast(k) + inflect(k, "a");
    if (c.formality === "formal") {
      return stem + (c.tense === "past" ? "ませんでした" : "ません");
    }
    return negStem + (c.tense === "past" ? "なかった" : "ない");
  }

  // Affirmative
  if (c.formality === "formal") {
    return stem + (c.tense === "past" ? "ました" : "ます");
  }
  if (c.tense === "present") return k;
  // Past casual
  return isRu ? ichidanStem(k) + "た" : godanTa(k);
}

function finishIchidan(stem: string, c: ConjugationRequest): string {
  if (c.polarity === "negative") {
    if (c.formality === "formal") return stem + (c.tense === "past" ? "ませんでした" : "ません");
    return stem + (c.tense === "past" ? "なかった" : "ない");
  }
  if (c.formality === "formal") return stem + (c.tense === "past" ? "ました" : "ます");
  if (c.tense === "present") return stem + "る";
  return stem + "た";
}

// ── Exception verb conjugation ───────────────────────────────────

interface ExvEntry {
  stem: string; // masu-stem
  aStem: string; // negative stem (a-row equivalent)
  te: string;
  teNeg: string;
  ta: string;
  potential: string;
  passive: string;
  causative: string;
  imperative: string;
  volitionalCasual: string;
}

const EXV: Record<string, ExvEntry> = {
  する: {
    stem: "し",
    aStem: "し",
    te: "して",
    teNeg: "しなくて",
    ta: "した",
    potential: "でき",
    passive: "され",
    causative: "させ",
    imperative: "しろ",
    volitionalCasual: "しよう",
  },
  くる: {
    stem: "き",
    aStem: "こ",
    te: "きて",
    teNeg: "こなくて",
    ta: "きた",
    potential: "こられ",
    passive: "こられ",
    causative: "こさせ",
    imperative: "こい",
    volitionalCasual: "こよう",
  },
  いく: {
    stem: "いき",
    aStem: "いか",
    te: "いって",
    teNeg: "いかなくて",
    ta: "いった",
    potential: "いけ",
    passive: "いかれ",
    causative: "いかせ",
    imperative: "いけ",
    volitionalCasual: "いこう",
  },
  ある: {
    stem: "あり",
    aStem: "",
    te: "あって",
    teNeg: "なくて",
    ta: "あった",
    potential: "",
    passive: "",
    causative: "",
    imperative: "",
    volitionalCasual: "",
  },
};

function conjugateExv(w: Word, c: ConjugationRequest): string {
  const e = EXV[w.kana];
  if (!e) return w.kana;

  if (c.form === "volitional") {
    return c.formality === "formal" ? e.stem + "ましょう" : e.volitionalCasual;
  }
  if (c.form === "imperative") {
    if (c.polarity === "negative") return w.kana + "な";
    return e.imperative;
  }
  if (c.te) {
    return c.polarity === "negative" ? e.teNeg : e.te;
  }

  // Voice forms
  let dStem = "";
  switch (c.form) {
    case "potential":
      dStem = e.potential;
      break;
    case "passive":
      dStem = e.passive;
      break;
    case "causative":
      dStem = e.causative;
      break;
    case "causativePassive":
      dStem = e.causative + "られ";
      break;
  }
  if (c.form && dStem) return finishIchidan(dStem, c);

  // Plain conjugation
  if (c.polarity === "negative") {
    const neg = w.kana === "ある" ? "" : e.aStem;
    if (c.formality === "formal") {
      return (w.kana === "ある" ? "あり" : e.stem) + (c.tense === "past" ? "ませんでした" : "ません");
    }
    return neg + (c.tense === "past" ? "なかった" : "ない");
  }
  if (c.formality === "formal") {
    return (w.kana === "ある" ? "あり" : e.stem) + (c.tense === "past" ? "ました" : "ます");
  }
  if (c.tense === "present") return w.kana;
  return e.ta;
}

// ── Adjective conjugation ────────────────────────────────────────

function conjugateAdj(w: Word, c: ConjugationRequest): string {
  const k = w.kana;
  const isI = w.type === "i";
  const iStem = isI ? chopLast(k) : k;

  if (c.form === ("adverb" as any)) {
    return isI ? iStem + "く" : k + "に";
  }
  if (c.form === ("nominalized" as any)) {
    return isI ? iStem + "さ" : k + "さ";
  }
  if (c.te) {
    if (c.polarity === "negative") {
      return isI ? iStem + "くなくて" : k + "じゃなくて";
    }
    return isI ? iStem + "くて" : k + "で";
  }

  let base: string;
  if (c.polarity === "negative") {
    if (c.tense === "past") {
      base = isI ? iStem + "くなかった" : k + "じゃなかった";
    } else {
      base = isI ? iStem + "くない" : k + "じゃない";
    }
  } else {
    if (c.tense === "past") {
      if (c.formality === "formal") {
        return isI ? iStem + "かったです" : k + "でした";
      }
      base = isI ? iStem + "かった" : k + "だった";
    } else {
      base = k;
    }
  }
  return c.formality === "formal" ? base + "です" : base;
}

// ── Exception adjective (いい / かっこいい) conjugation ─────────

function conjugateExa(w: Word, c: ConjugationRequest): string {
  const k = w.kana;
  // Replace the second-to-last char with よ for non-present-affirmative forms
  const yoStem = k.slice(0, -2) + "よ" + k.slice(-1);
  const yoIStem = yoStem.slice(0, -1);

  if (c.form === ("adverb" as any)) return yoIStem + "く";
  if (c.form === ("nominalized" as any)) return yoIStem + "さ";
  if (c.te) {
    return c.polarity === "negative" ? yoIStem + "くなくて" : yoIStem + "くて";
  }

  let base: string;
  if (c.polarity === "negative") {
    base = c.tense === "past" ? yoIStem + "くなかった" : yoIStem + "くない";
  } else if (c.tense === "past") {
    if (c.formality === "formal") return yoIStem + "かったです";
    base = yoIStem + "かった";
  } else {
    base = k;
  }
  return c.formality === "formal" ? base + "です" : base;
}

// ── Public API ───────────────────────────────────────────────────

export function conjugate(word: Word, request: ConjugationRequest): string {
  switch (word.type) {
    case "ru":
    case "u":
      return conjugateRegular(word, request);
    case "exv":
      return conjugateExv(word, request);
    case "i":
    case "na":
      return conjugateAdj(word, request);
    case "exa":
      return conjugateExa(word, request);
  }
}

// ── Conjugation generation (which forms to quiz) ─────────────────

export type VerbForm = "potential" | "passive" | "causative" | "causativePassive" | "imperative" | "volitional";
export type AdjForm = "te" | "adverb" | "nominalized";

export interface QuizConfig {
  verbTypes: string[];
  verbForms: VerbForm[];
  verbTenses: ("present" | "past" | "te")[];
  verbPolarity: ("affirmative" | "negative")[];
  verbFormality: ("formal" | "casual")[];
  adjTypes: string[];
  adjForms: AdjForm[];
  adjTenses: ("present" | "past" | "te")[];
  adjPolarity: ("affirmative" | "negative")[];
  adjFormality: ("formal" | "casual")[];
  furigana: boolean;
}

export function defaultQuizConfig(): QuizConfig {
  return {
    verbTypes: ["verbIchidan", "verbす", "verbく", "verbむ", "verbう", "verbException"],
    verbForms: ["potential", "passive", "causative", "causativePassive", "imperative", "volitional"],
    verbTenses: ["present", "past", "te"],
    verbPolarity: ["affirmative", "negative"],
    verbFormality: ["formal", "casual"],
    adjTypes: ["adjい", "adjな", "adjException"],
    adjForms: ["te", "adverb", "nominalized"],
    adjTenses: ["present", "past", "te"],
    adjPolarity: ["affirmative", "negative"],
    adjFormality: ["formal", "casual"],
    furigana: true,
  };
}

function rng(n: number): boolean {
  return Math.floor(Math.random() * n) + 1 === n;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateVerbConjugation(config: QuizConfig): ConjugationRequest {
  const req: ConjugationRequest = { form: null, te: false, tense: null, polarity: null, formality: null };

  const hasTeOption = config.verbTenses.includes("te");
  const hasTense = config.verbTenses.some((t) => t === "present" || t === "past");
  const hasForms = config.verbForms.length > 0;

  // Decide if te-form
  if (hasTeOption && rng(5)) {
    req.te = true;
    if (config.verbPolarity.includes("negative") && (!config.verbPolarity.includes("affirmative") || rng(2))) {
      req.polarity = "negative";
    }
    return req;
  }

  // Pick a special form if available
  if (hasForms && rng(2)) {
    req.form = pick(config.verbForms);
    if (req.form === "imperative") {
      req.polarity = config.verbPolarity.length === 1 ? config.verbPolarity[0] : pick(config.verbPolarity);
      return req;
    }
    if (req.form === "volitional") {
      req.formality = config.verbFormality.length === 1 ? config.verbFormality[0] : pick(config.verbFormality);
      return req;
    }
  }

  // Tense
  if (hasTense) {
    const tenses = config.verbTenses.filter((t) => t !== "te") as ("present" | "past")[];
    req.tense = tenses.length === 1 ? tenses[0] : pick(tenses);
  }

  // Polarity
  req.polarity = config.verbPolarity.length === 1 ? config.verbPolarity[0] : pick(config.verbPolarity);

  // Formality
  req.formality = config.verbFormality.length === 1 ? config.verbFormality[0] : pick(config.verbFormality);

  return req;
}

export function generateAdjConjugation(config: QuizConfig): ConjugationRequest {
  const req: ConjugationRequest = { form: null, te: false, tense: null, polarity: null, formality: null };

  const hasTeOption = config.adjTenses.includes("te");
  const hasAdverb = config.adjForms.includes("adverb");
  const hasNominalized = config.adjForms.includes("nominalized");
  const specialForms = [...(hasAdverb ? ["adverb"] : []), ...(hasNominalized ? ["nominalized"] : [])];

  // Special forms
  if (specialForms.length > 0 && rng(5)) {
    (req as any).form = pick(specialForms);
    return req;
  }

  // Te-form
  if (hasTeOption && rng(5)) {
    req.te = true;
    if (config.adjPolarity.includes("negative") && (!config.adjPolarity.includes("affirmative") || rng(2))) {
      req.polarity = "negative";
    }
    return req;
  }

  // Tense
  const tenses = config.adjTenses.filter((t) => t !== "te") as ("present" | "past")[];
  if (tenses.length > 0) {
    req.tense = tenses.length === 1 ? tenses[0] : pick(tenses);
  }

  req.polarity = config.adjPolarity.length === 1 ? config.adjPolarity[0] : pick(config.adjPolarity);

  req.formality = config.adjFormality.length === 1 ? config.adjFormality[0] : pick(config.adjFormality);

  return req;
}

export function describeConjugation(c: ConjugationRequest): string {
  const parts: string[] = [];
  if (c.te) parts.push("て-form");
  if (c.form === "potential") parts.push("Potential");
  if (c.form === "passive") parts.push("Passive");
  if (c.form === "causative") parts.push("Causative");
  if (c.form === "causativePassive") parts.push("Causative-Passive");
  if (c.form === "imperative") parts.push("Imperative");
  if (c.form === "volitional") parts.push("Volitional");
  if ((c.form as string) === "adverb") parts.push("Adverb");
  if ((c.form as string) === "nominalized") parts.push("Nominalized");
  if (c.formality === "formal") parts.push("Formal");
  if (c.formality === "casual") parts.push("Casual");
  if (c.tense === "present") parts.push("Present");
  if (c.tense === "past") parts.push("Past");
  if (c.polarity === "affirmative") parts.push("Affirmative");
  if (c.polarity === "negative") parts.push("Negative");
  return parts.join("　");
}

export function describeType(word: Word): string {
  const map: Record<string, string> = {
    ru: "Ichidan Verb",
    u: "Godan Verb",
    exv: "Exception Verb",
    i: "い-adjective",
    na: "な-adjective",
    exa: "Exception Adjective",
  };
  return map[word.type] ?? "";
}
