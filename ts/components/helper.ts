import type {
    ICUStringMessageParamsByKeyType,
  } from '../../build/ICUMessageParams';
  
  export function t<K extends keyof ICUStringMessageParamsByKeyType>(
    i18n: (key: K, params: ICUStringMessageParamsByKeyType[K]) => string,
    key: K,
    params: ICUStringMessageParamsByKeyType[K],
  ): string {
    return i18n(key, params);
  }