// @ts-nocheck — source from forked jsdiff (jsdiff/src/util/string.ts)
export function longestCommonPrefix(str1: string, str2: string): string {
  let i;
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[i] != str2[i]) {
      return str1.slice(0, i);
    }
  }
  return str1.slice(0, i);
}

export function longestCommonSuffix(str1: string, str2: string): string {
  let i;
  if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
    return '';
  }
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
      return str1.slice(-i);
    }
  }
  return str1.slice(-i);
}

export function replacePrefix(string: string, oldPrefix: string, newPrefix: string): string {
  if (string.slice(0, oldPrefix.length) != oldPrefix) {
    throw Error(`string ${JSON.stringify(string)} doesn't start with prefix ${JSON.stringify(oldPrefix)}; this is a bug`);
  }
  return newPrefix + string.slice(oldPrefix.length);
}

export function replaceSuffix(string: string, oldSuffix: string, newSuffix: string): string {
  if (!oldSuffix) {
    return string + newSuffix;
  }
  if (string.slice(-oldSuffix.length) != oldSuffix) {
    throw Error(`string ${JSON.stringify(string)} doesn't end with suffix ${JSON.stringify(oldSuffix)}; this is a bug`);
  }
  return string.slice(0, -oldSuffix.length) + newSuffix;
}

export function removePrefix(string: string, oldPrefix: string): string {
  return replacePrefix(string, oldPrefix, '');
}

export function removeSuffix(string: string, oldSuffix: string): string {
  return replaceSuffix(string, oldSuffix, '');
}

export function maximumOverlap(string1: string, string2: string): string {
  return string2.slice(0, overlapCount(string1, string2));
}

function overlapCount(a: string, b: string): number {
  let startA = 0;
  if (a.length > b.length) { startA = a.length - b.length; }
  let endB = b.length;
  if (a.length < b.length) { endB = a.length; }
  const map = Array(endB);
  let k = 0;
  map[0] = 0;
  for (let j = 1; j < endB; j++) {
    if (b[j] == b[k]) { map[j] = map[k]; } else { map[j] = k; }
    while (k > 0 && b[j] != b[k]) { k = map[k]; }
    if (b[j] == b[k]) { k++; }
  }
  k = 0;
  for (let i = startA; i < a.length; i++) {
    while (k > 0 && a[i] != b[k]) { k = map[k]; }
    if (a[i] == b[k]) { k++; }
  }
  return k;
}

export function segment(string: string, segmenter: Intl.Segmenter): string[] {
  const parts: string[] = [];
  for (const segmentObj of Array.from(segmenter.segment(string))) {
    const seg = segmentObj.segment;
    if (parts.length && (/\s/).test(parts[parts.length - 1]) && (/\s/).test(seg)) {
      parts[parts.length - 1] += seg;
    } else {
      parts.push(seg);
    }
  }
  return parts;
}

export function trailingWs(string: string, segmenter?: Intl.Segmenter): string {
  if (segmenter) { return leadingAndTrailingWs(string, segmenter)[1]; }
  let i;
  for (i = string.length - 1; i >= 0; i--) {
    if (!string[i].match(/\s/)) { break; }
  }
  return string.substring(i + 1);
}

export function leadingWs(string: string, segmenter?: Intl.Segmenter): string {
  if (segmenter) { return leadingAndTrailingWs(string, segmenter)[0]; }
  const match = string.match(/^\s*/);
  return match ? match[0] : '';
}

export function leadingAndTrailingWs(string: string, segmenter?: Intl.Segmenter): [string, string] {
  if (!segmenter) { return [leadingWs(string), trailingWs(string)]; }
  if (segmenter.resolvedOptions().granularity != 'word') {
    throw new Error('The segmenter passed must have a granularity of "word"');
  }
  const segments = segment(string, segmenter);
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const head = (/\s/).test(firstSeg) ? firstSeg : '';
  const tail = (/\s/).test(lastSeg) ? lastSeg : '';
  return [head, tail];
}
