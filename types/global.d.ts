import '@glint/environment-ember-loose';
import type EmberConcurrencyRegistry from 'ember-concurrency/template-registry';
import type EmberPhosphorIconsRegistery from 'ember-phosphor-icons/template-registry';
import type EmberIntlRegistry from 'ember-intl/template-registry';
import type EmberTruthRegistry from 'ember-truth-helpers/template-registry';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry
    extends EmberPhosphorIconsRegistery /* ... */ {
    // local entries
  }

  export default interface Registry
    extends EmberConcurrencyRegistry /* other addon registries */ {
    // local entries
  }

  export default interface Registry
    extends EmberIntlRegistry /* other addon registries */ {
    // local entries
  }

  export default interface Registry {
    'page-title': HelperLike<{
      Args: { Positional: [title: string] };
      Return: void;
    }>;
  }

  export default interface Registry
    extends EmberTruthRegistry /* other addon registries */ {
    // local entries
  }
}
