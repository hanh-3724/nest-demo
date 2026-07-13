import { Inject } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { I18N_LOADER_OPTIONS, I18nJsonLoader } from 'nestjs-i18n';
import type { I18nAbstractLoaderOptions, I18nTranslation } from 'nestjs-i18n';

export class FlatEnglishJsonLoader extends I18nJsonLoader {
  constructor(
    @Inject(I18N_LOADER_OPTIONS)
    private readonly flatLoaderOptions: I18nAbstractLoaderOptions,
  ) {
    super(flatLoaderOptions);
  }

  protected async parseLanguages(): Promise<string[]> {
    return Promise.resolve(['en']);
  }

  protected async parseTranslations(): Promise<I18nTranslation> {
    const translations: I18nTranslation = {};
    const files = await readdir(this.flatLoaderOptions.path, {
      withFileTypes: true,
    });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.json')) {
        continue;
      }

      const contents = await readFile(
        join(this.flatLoaderOptions.path, file.name),
        'utf8',
      );
      const group = basename(file.name, '.json');
      translations[group] = this.formatData(contents) as I18nTranslation;
    }

    return { en: translations };
  }
}
