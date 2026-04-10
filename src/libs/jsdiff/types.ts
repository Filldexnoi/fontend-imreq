export interface ChangeObject<ValueT> {
  value: ValueT;
  added: boolean;
  removed: boolean;
  count: number;
}

export type Change = ChangeObject<string>;
export type ArrayChange<T> = ChangeObject<T[]>;

export interface CommonDiffOptions {
  oneChangePerToken?: boolean,
}

export interface TimeoutOption {
  timeout: number;
}

export interface MaxEditLengthOption {
  maxEditLength: number;
}

export type AbortableDiffOptions = TimeoutOption | MaxEditLengthOption;

export type DiffCallbackNonabortable<T> = (result: ChangeObject<T>[]) => void;
export type DiffCallbackAbortable<T> = (result: ChangeObject<T>[] | undefined) => void;

export interface CallbackOptionNonabortable<T> {
  callback: DiffCallbackNonabortable<T>
}
export interface CallbackOptionAbortable<T> {
  callback: DiffCallbackAbortable<T>
}

interface DiffWordsOptions extends CommonDiffOptions {
  ignoreCase?: boolean
  intlSegmenter?: any,
}
export interface DiffWordsOptionsNonabortable extends DiffWordsOptions {
  callback?: DiffCallbackNonabortable<string>
}
export type DiffWordsOptionsAbortable = DiffWordsOptions & AbortableDiffOptions & Partial<CallbackOptionAbortable<string>>

export type AllDiffOptions = DiffWordsOptions & { comparator?: (a: any, b: any) => boolean }
