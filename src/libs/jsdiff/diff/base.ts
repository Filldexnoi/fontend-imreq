// @ts-nocheck — source from forked jsdiff (jsdiff/src/diff/base.ts)
import type { ChangeObject, AllDiffOptions, AbortableDiffOptions, DiffCallbackNonabortable, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackAbortable, TimeoutOption, MaxEditLengthOption } from '../types';

interface DraftChangeObject {
  added: boolean;
  removed: boolean;
  count: number;
  previousComponent?: DraftChangeObject;
  value?: any;
}

interface Path {
  oldPos: number;
  lastComponent: DraftChangeObject | undefined
}

export default class Diff<
  TokenT,
  ValueT extends Iterable<TokenT> = Iterable<TokenT>,
  InputValueT = ValueT
> {
  diff(oldStr: InputValueT, newStr: InputValueT, options: DiffCallbackNonabortable<ValueT>): undefined;
  diff(oldStr: InputValueT, newStr: InputValueT, options: AllDiffOptions & AbortableDiffOptions & CallbackOptionAbortable<ValueT>): undefined
  diff(oldStr: InputValueT, newStr: InputValueT, options: AllDiffOptions & CallbackOptionNonabortable<ValueT>): undefined
  diff(oldStr: InputValueT, newStr: InputValueT, options: AllDiffOptions & AbortableDiffOptions): ChangeObject<ValueT>[] | undefined
  diff(oldStr: InputValueT, newStr: InputValueT, options?: AllDiffOptions): ChangeObject<ValueT>[]
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options: DiffCallbackNonabortable<ValueT> | AllDiffOptions & Partial<CallbackOptionNonabortable<ValueT>> = {}
  ): ChangeObject<ValueT>[] | undefined {
    let callback: DiffCallbackAbortable<ValueT> | DiffCallbackNonabortable<ValueT> | undefined;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if ('callback' in options) {
      callback = options.callback;
    }
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }

  private diffWithOptionsObj(
    oldTokens: TokenT[],
    newTokens: TokenT[],
    options: AllDiffOptions & Partial<TimeoutOption> & Partial<MaxEditLengthOption>,
    callback: DiffCallbackAbortable<ValueT> | DiffCallbackNonabortable<ValueT> | undefined
  ): ChangeObject<ValueT>[] | undefined {
    const done = (value: ChangeObject<ValueT>[]) => {
      value = this.postProcess(value, options);
      if (callback) { setTimeout(function() { callback(value); }, 0); return undefined; }
      else { return value; }
    };

    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) { maxEditLength = Math.min(maxEditLength, options.maxEditLength); }
    const maxExecutionTime = options.timeout ?? Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath: Path[] = [{ oldPos: -1, lastComponent: undefined }];

    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }

    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;

    const execEditLength = () => {
      for (
        let diagonalPath = Math.max(minDiagonalToConsider, -editLength);
        diagonalPath <= Math.min(maxDiagonalToConsider, editLength);
        diagonalPath += 2
      ) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) { (bestPath as any)[diagonalPath - 1] = undefined; }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) { (bestPath as any)[diagonalPath] = undefined; continue; }
        if (!canRemove || (canAdd && removePath.oldPos < addPath.oldPos)) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) { maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1); }
          if (newPos + 1 >= newLen) { minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1); }
        }
      }
      editLength++;
    };

    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return (callback as DiffCallbackAbortable<ValueT>)(undefined);
          }
          if (!execEditLength()) { exec(); }
        }, 0);
      }());
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) { return ret as ChangeObject<ValueT>[]; }
      }
    }
  }

  private addToPath(path: Path, added: boolean, removed: boolean, oldPosInc: number, options: AllDiffOptions): Path {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return { oldPos: path.oldPos + oldPosInc, lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent } };
    } else {
      return { oldPos: path.oldPos + oldPosInc, lastComponent: { count: 1, added, removed, previousComponent: last } };
    }
  }

  private extractCommon(basePath: Path, newTokens: TokenT[], oldTokens: TokenT[], diagonalPath: number, options: AllDiffOptions): number {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++; oldPos++; commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }

  equals(left: TokenT, right: TokenT, options: AllDiffOptions): boolean {
    if (options.comparator) { return options.comparator(left, right); }
    return left === right || (!!options.ignoreCase && (left as string).toLowerCase() === (right as string).toLowerCase());
  }

  removeEmpty(array: TokenT[]): TokenT[] {
    const ret: TokenT[] = [];
    for (let i = 0; i < array.length; i++) { if (array[i]) { ret.push(array[i]); } }
    return ret;
  }

  castInput(value: InputValueT, _options: AllDiffOptions): ValueT { return value as unknown as ValueT; }
  tokenize(value: ValueT, _options: AllDiffOptions): TokenT[] { return Array.from(value); }
  join(chars: TokenT[]): ValueT { return (chars as string[]).join('') as unknown as ValueT; }
  postProcess(changeObjects: ChangeObject<ValueT>[], _options: AllDiffOptions): ChangeObject<ValueT>[] { return changeObjects; }
  get useLongestToken(): boolean { return false; }

  private buildValues(lastComponent: DraftChangeObject | undefined, newTokens: TokenT[], oldTokens: TokenT[]): ChangeObject<ValueT>[] {
    const components: DraftChangeObject[] = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (; componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value, i) {
            const oldValue = oldTokens[oldPos + i];
            return (oldValue as string).length > (value as string).length ? oldValue : value;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) { oldPos += component.count; }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components as ChangeObject<ValueT>[];
  }
}
