import { romajiToHiraganaMap } from "../data/romajiMap";

export function convertToHiragana(romaji: string): string {
  let hiragana = "";
  let i = 0;
  while (i < romaji.length) {
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      const chunk = romaji.substring(i, i + len);
      if (romajiToHiraganaMap[chunk]) {
        hiragana += romajiToHiraganaMap[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      hiragana += romaji[i];
      i++;
    }
  }
  return hiragana;
}

export function kataToHira(text: string): string {
  return text
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6
        ? String.fromCharCode(code - 0x60)
        : c;
    })
    .join("");
}
