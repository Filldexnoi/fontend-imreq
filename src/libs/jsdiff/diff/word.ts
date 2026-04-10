import Diff from './base';
import type { ChangeObject, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackNonabortable, DiffWordsOptionsAbortable, DiffWordsOptionsNonabortable } from '../types';
import { longestCommonPrefix, longestCommonSuffix, replacePrefix, replaceSuffix, removePrefix, removeSuffix, maximumOverlap, leadingWs, trailingWs, leadingAndTrailingWs, segment } from '../util/string';

const extendedWordChars = 'a-zA-Z0-9_\\u{AD}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}';
const tokenizeIncludingWhitespace = new RegExp(`[${extendedWordChars}]+|\\s+|[^${extendedWordChars}]`, 'ug');

class WordDiff extends Diff<string, string> {
  equals(left: string, right: string, options: DiffWordsOptionsAbortable | DiffWordsOptionsNonabortable) {
    if (options.ignoreCase) { left = left.toLowerCase(); right = right.toLowerCase(); }
    return left.trim() === right.trim();
  }

  tokenize(value: string, options: DiffWordsOptionsAbortable | DiffWordsOptionsNonabortable = {}) {
    let parts;
    if (options.intlSegmenter) {
      const segmenter: Intl.Segmenter = options.intlSegmenter;
      if (segmenter.resolvedOptions().granularity != 'word') {
        throw new Error('The segmenter passed must have a granularity of "word"');
      }
      parts = segment(value, segmenter);
    } else {
      parts = value.match(tokenizeIncludingWhitespace) || [];
    }
    const tokens: string[] = [];
    let prevPart: string | null = null;
    parts.forEach(part => {
      if ((/\s/).test(part)) {
        if (prevPart == null) { tokens.push(part); }
        else { tokens.push(tokens.pop() + part); }
      } else if (prevPart != null && (/\s/).test(prevPart)) {
        if (tokens[tokens.length - 1] == prevPart) { tokens.push(tokens.pop() + part); }
        else { tokens.push(prevPart + part); }
      } else {
        tokens.push(part);
      }
      prevPart = part;
    });
    return tokens;
  }

  join(tokens: string[]) {
    return tokens.map((token, i) => i == 0 ? token : token.replace((/^\s+/), '')).join('');
  }

  postProcess(changes: ChangeObject<string>[], options: any) {
    if (!changes || options.oneChangePerToken) { return changes; }
    let lastKeep: ChangeObject<string> | null = null;
    let insertion: ChangeObject<string> | null = null;
    let deletion: ChangeObject<string> | null = null;
    changes.forEach(change => {
      if (change.added) { insertion = change; }
      else if (change.removed) { deletion = change; }
      else {
        if (insertion || deletion) {
          dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change, options.intlSegmenter);
        }
        lastKeep = change; insertion = null; deletion = null;
      }
    });
    if (insertion || deletion) {
      dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null, options.intlSegmenter);
    }
    return changes;
  }
}

export const wordDiff = new WordDiff();

export function diffWords(oldStr: string, newStr: string, options: DiffCallbackNonabortable<string>): undefined;
export function diffWords(oldStr: string, newStr: string, options: DiffWordsOptionsAbortable & CallbackOptionAbortable<string>): undefined
export function diffWords(oldStr: string, newStr: string, options: DiffWordsOptionsNonabortable & CallbackOptionNonabortable<string>): undefined
export function diffWords(oldStr: string, newStr: string, options: DiffWordsOptionsAbortable): ChangeObject<string>[] | undefined
export function diffWords(oldStr: string, newStr: string, options?: DiffWordsOptionsNonabortable): ChangeObject<string>[]
export function diffWords(oldStr: string, newStr: string, options?: any): undefined | ChangeObject<string>[] {
  return wordDiff.diff(oldStr, newStr, options);
}

function dedupeWhitespaceInChangeObjects(
  startKeep: ChangeObject<string> | null,
  deletion: ChangeObject<string> | null,
  insertion: ChangeObject<string> | null,
  endKeep: ChangeObject<string> | null,
  segmenter?: Intl.Segmenter
) {
  if (deletion && insertion) {
    const [oldWsPrefix, oldWsSuffix] = leadingAndTrailingWs(deletion.value, segmenter);
    const [newWsPrefix, newWsSuffix] = leadingAndTrailingWs(insertion.value, segmenter);
    if (startKeep) {
      const commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      const commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    if (startKeep) {
      const ws = leadingWs(insertion.value, segmenter);
      insertion.value = insertion.value.substring(ws.length);
    }
    if (endKeep) {
      const ws = leadingWs(endKeep.value, segmenter);
      endKeep.value = endKeep.value.substring(ws.length);
    }
  } else if (startKeep && endKeep) {
    const newWsFull = leadingWs(endKeep.value, segmenter),
      [delWsStart, delWsEnd] = leadingAndTrailingWs(deletion!.value, segmenter);
    const newWsStart = longestCommonPrefix(newWsFull, delWsStart);
    deletion!.value = removePrefix(deletion!.value, newWsStart);
    const newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
    deletion!.value = removeSuffix(deletion!.value, newWsEnd);
    endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
    startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
  } else if (endKeep) {
    const endKeepWsPrefix = leadingWs(endKeep.value, segmenter);
    const deletionWsSuffix = trailingWs(deletion!.value, segmenter);
    const overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
    deletion!.value = removeSuffix(deletion!.value, overlap);
  } else if (startKeep) {
    const startKeepWsSuffix = trailingWs(startKeep.value, segmenter);
    const deletionWsPrefix = leadingWs(deletion!.value, segmenter);
    const overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
    deletion!.value = removePrefix(deletion!.value, overlap);
  }
}
