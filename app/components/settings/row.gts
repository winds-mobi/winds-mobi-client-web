import Component from '@glimmer/component';
import { action } from '@ember/object';
import { concat, hash } from '@ember/helper';
import { t } from 'ember-intl';
import { Switch } from '@frontile/forms';
import type SettingsService from 'winds-mobi-client-web/services/settings';
import type { BooleanSettingKey } from 'winds-mobi-client-web/services/settings';

export interface SettingsRowSignature {
  Args: {
    settings: SettingsService;
    name: BooleanSettingKey;
  };
  Blocks: {
    // The live preview for this setting, handed the current value and the same
    // persist action the switch uses (graph-sync's preview drives it too).
    default: [{ enabled: boolean; update: (value: boolean) => void }];
  };
  Element: HTMLDivElement;
}

// One settings row: the labelled switch on the left and the yielded showcase on
// the right. Every preference flows through this single component, so the switch
// state (`@isSelected`), the persisted write (`@onChange`), the label, the
// description, and the test hook all derive from one `@name` and cannot drift
// apart — the failure mode where a switch toggled but never persisted.
export default class SettingsRow extends Component<SettingsRowSignature> {
  get enabled(): boolean {
    return this.args.settings[this.args.name];
  }

  @action
  update(value: boolean): void {
    this.args.settings[this.args.name] = value;
  }

  <template>
    <div
      class="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_14rem]"
      ...attributes
    >
      <div>
        <Switch
          data-test-setting={{@name}}
          @isSelected={{this.enabled}}
          @onChange={{this.update}}
          @intent="success"
          @label={{t (concat "settings." @name ".label")}}
          @description={{t (concat "settings." @name ".description")}}
        />
      </div>
      {{yield (hash enabled=this.enabled update=this.update)}}
    </div>
  </template>
}
