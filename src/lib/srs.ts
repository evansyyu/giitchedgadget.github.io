/**
 * anki-inspired leitner-box SRS engine (session-only, non persistent)
 *
 * cards move through boxes 0-3, correct answers advance the box,
 * wrong answers reset to box 0. cards at box 4+ are "graduated"
 * and leave the review queue. the scheduler picks the most overdue
 * review card, falling back to a new unseen card when nothing is due.
 */

const INTERVALS = [1, 3, 7, 15] as const;
const GRADUATE_BOX = 4;

export interface ReviewCard<T> {
  item: T;
  box: number;
  dueAt: number;
}

export class SRSEngine<T> {
  private reviews: ReviewCard<T>[] = [];
  private seen = new Set<T>();
  private questionNum = 0;

  get currentQuestion(): number {
    return this.questionNum;
  }

  // pick the next card to show. returns a review card if one is overdue, otherwise a new unseen item
  pick(pool: T[]): T | null {
    this.questionNum++;

    const due = this.reviews
      .filter((r) => r.dueAt <= this.questionNum)
      .sort((a, b) => a.box - b.box || a.dueAt - b.dueAt);

    if (due.length > 0) {
      return due[0].item;
    }

    const unseen = pool.filter((w) => !this.seen.has(w));
    if (unseen.length === 0) {
      if (this.reviews.length > 0) {
        const next = this.reviews.sort(
          (a, b) => a.box - b.box || a.dueAt - b.dueAt,
        )[0];
        return next.item;
      }
      this.seen.clear();
      this.reviews = [];
      const fresh = pool[Math.floor(Math.random() * pool.length)];
      return fresh ?? null;
    }
    const pick = unseen[Math.floor(Math.random() * unseen.length)];
    this.seen.add(pick);
    return pick;
  }

  // record a correct answer. advances the box or graduates the card
  correct(item: T): void {
    const idx = this.reviews.findIndex((r) => r.item === item);
    if (idx === -1) return;
    const card = this.reviews[idx];
    card.box++;
    if (card.box >= GRADUATE_BOX) {
      this.reviews.splice(idx, 1);
    } else {
      card.dueAt = this.questionNum + INTERVALS[card.box];
    }
  }

  // record a wrong answer. adds or resets the card to box 0
  wrong(item: T): void {
    this.seen.add(item);
    const existing = this.reviews.find((r) => r.item === item);
    if (existing) {
      existing.box = 0;
      existing.dueAt = this.questionNum + 1;
    } else {
      this.reviews.push({ item, box: 0, dueAt: this.questionNum + 1 });
    }
  }

  // resets all state
  reset(): void {
    this.reviews = [];
    this.seen.clear();
    this.questionNum = 0;
  }
}
