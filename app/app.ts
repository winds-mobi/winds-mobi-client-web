import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import './styles/app.css';
import '@glint/ember-tsc/types';
import { setBuildURLConfig } from '@warp-drive/utilities/json-api';
import '@warp-drive/ember/install';

setBuildURLConfig({
  host: 'https://winds.mobi/api',
  // host: 'http://localhost:8001/api',
  namespace: '2.3',
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
}

loadInitializers(App, config.modulePrefix, compatModules);
