import '@glint/environment-ember-loose';
import type EmberConcurrencyRegistry from 'ember-concurrency/template-registry';
import type EmberPhosphorIconsRegistery from 'ember-phosphor-icons/template-registry';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry
    extends EmberPhosphorIconsRegistery /* ... */ {
    // local entries
  }

  export default interface Registry
    extends EmberConcurrencyRegistry /* other addon registries */ {
    // local entries
  }
}
