import i18next, { TFunction, TOptionsBase } from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { crc32 } from 'crc';

i18next.use(Backend).init({
  // initImmediate: false,
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  preload: ['zh-CN', 'en-US'],
  ns: ['translation'],
  defaultNS: 'translation',
  backend: {
    loadPath: path.resolve(__dirname, '../../', 'locales/{{lng}}/{{ns}}.json'),
  },
});

/**
 * 国际化翻译
 */
export const t: TFunction = (
  key: string,
  defaultValue?: string,
  options?: TOptionsBase
) => {
  try {
    const hashKey = `k${crc32(key).toString(16)}`;
    let words = i18next.t(hashKey, defaultValue, options);
    if (words === hashKey) {
      words = key;
      console.info(`[i18n] 翻译缺失: [${hashKey}]${key}`);
    }
    return words;
  } catch (err) {
    console.error(err);
    return key;
  }
};
