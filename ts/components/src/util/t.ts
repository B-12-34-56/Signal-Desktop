// src/util/t.ts
import type {
    ICUStringMessageParamsByKeyType,
  } from '../../../../build/ICUMessageParams.d.ts';
  
  /**
   * Narrowed helper for i18n calls that take exactly {} params.
   */
  export function t<K extends keyof ICUStringMessageParamsByKeyType>(
    i18n: (key: K, params: ICUStringMessageParamsByKeyType[K]) => string,
    key: K,
    params: ICUStringMessageParamsByKeyType[K],
  ): string {
    return i18n(key, params);
  }
  