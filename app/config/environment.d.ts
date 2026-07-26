/**
 * Type declarations for
 *    import config from 'winds-mobi-client-web/config/environment'
 */
declare const config: {
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: 'history' | 'hash' | 'none';
  rootURL: string;
  version: string;
  APP: Record<string, unknown>;
};

export default config;
