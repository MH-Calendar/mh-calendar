import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'mh-calendar-core',
  outputTargets: [
    reactOutputTarget({
      outDir: './mh-calendar-react',
    }),
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'dist',
      // esmLoaderPath: '../loader',
      esmLoaderPath: 'loader',
      copy: [
        { src: 'global/dark-theme.css', dest: 'themes/darktheme.css' },
        // Add more themes as needed
        // { src: 'global/light-theme.css', dest: 'themes/lighttheme.css' }
      ],
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers for development
    },
  ],
  globalStyle: 'src/global/global.css',
};
