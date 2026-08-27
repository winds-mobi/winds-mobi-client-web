import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { concat, fn } from '@ember/helper';
import type Owner from '@ember/owner';
import { Button, ButtonGroup } from '@frontile/buttons';
import { Modal } from '@frontile/overlays';
import { t } from 'ember-intl';
import eq from 'ember-truth-helpers/helpers/eq';
import not from 'ember-truth-helpers/helpers/not';
import AlarmCompassRose from 'winds-mobi-client-web/components/alarm/compass-rose';
import type AlarmsService from 'winds-mobi-client-web/services/alarms';
import type { AlarmConfig } from 'winds-mobi-client-web/services/alarms';
import type { Station } from 'winds-mobi-client-web/services/store';

export interface AlarmSettingsModalSignature {
  Args: {
    station: Station;
    isOpen: boolean;
    onClose: () => void;
  };
  Element: HTMLDivElement;
}

// Editing surface for one station's alarm (see app/services/alarms.ts). Only
// ever rendered while `@isOpen` is true (see station/header.gts), so a fresh
// instance is created each time it opens and reading the existing config in
// the constructor is safe — no stale-args tracking needed.
export default class AlarmSettingsModal extends Component<AlarmSettingsModalSignature> {
  @service declare alarms: AlarmsService;

  @tracked directionBands: (number | null)[];
  @tracked metric: 'wind' | 'gusts';

  // Captured once at open time: "Delete" only appears once a config already
  // existed for this station when the modal opened (per the issue) — not
  // whenever the in-progress edit happens to be armed.
  existingConfigAtOpen: AlarmConfig | undefined;

  constructor(owner: Owner, args: AlarmSettingsModalSignature['Args']) {
    super(owner, args);

    const existing = this.alarms.get(args.station.id);

    this.existingConfigAtOpen = existing;
    this.directionBands = existing
      ? [...existing.directionBands]
      : new Array<number | null>(8).fill(null);
    this.metric = existing?.metric ?? 'gusts';
  }

  get canSave(): boolean {
    return this.directionBands.some((band) => band !== null);
  }

  @action
  updateDirectionBands(next: (number | null)[]): void {
    this.directionBands = next;
  }

  // ToggleButtons toggle independently rather than as a mutually exclusive
  // group, so a press on the already-selected one fires `isSelected: false`
  // — ignore that instead of letting it clear `metric` back to nothing.
  @action
  setMetric(metric: 'wind' | 'gusts', isSelected: boolean): void {
    if (isSelected) {
      this.metric = metric;
    }
  }

  @action
  save(): void {
    this.alarms.save({
      stationId: this.args.station.id,
      directionBands: this.directionBands,
      metric: this.metric,
      createdAt: this.existingConfigAtOpen?.createdAt ?? Date.now(),
    });
    this.args.onClose();
  }

  @action
  delete(): void {
    this.alarms.delete(this.args.station.id);
    this.args.onClose();
  }

  <template>
    <Modal
      @isOpen={{@isOpen}}
      @onClose={{@onClose}}
      @size="md"
      data-test-alarm-modal
      as |modal|
    >
      {{! @glint-expect-error: @frontile/overlays@0.17.1's Modal signature types
        its yielded block params' Header/Body/Footer against an older
        ember-modifier ModifierLike shape that no longer structurally matches
        ember-source 7's InvokableInstance -- a Frontile/ember-source-7 type
        gap, not a real bug here (see the same workaround on Drawer/Popover). }}
      <modal.Header>
        <h2 class="pr-6 text-base font-semibold text-slate-950">
          {{t "alarms.modal.title" name=@station.name}}
        </h2>
      </modal.Header>

      {{! @glint-expect-error: same Frontile/ember-source-7 type gap as above }}
      <modal.Body>
        <div class="flex flex-col gap-4">
          <AlarmCompassRose
            @directionBands={{this.directionBands}}
            @onChange={{this.updateDirectionBands}}
            @currentDirection={{@station.last.direction}}
            @currentSpeed={{@station.last.speed}}
            @currentGusts={{@station.last.gusts}}
          />

          {{! The trailing (○)/(●) mirror the compass rose's own
            current-reading marks (see compass-rose.gts's
            currentReadingMarks) -- same symbol, same meaning, so the two
            controls read as one system. }}
          <ButtonGroup
            data-test-alarm-metric-switch
            @intent="primary"
            class="self-center"
            aria-label={{t "alarms.modal.metric.label"}}
            as |g|
          >
            <g.ToggleButton
              data-test-alarm-metric="wind"
              @isSelected={{eq this.metric "wind"}}
              @onChange={{fn this.setMetric "wind"}}
            >
              {{concat (t "alarms.metric.wind") " (○)"}}
            </g.ToggleButton>
            <g.ToggleButton
              data-test-alarm-metric="gusts"
              @isSelected={{eq this.metric "gusts"}}
              @onChange={{fn this.setMetric "gusts"}}
            >
              {{concat (t "alarms.metric.gusts") " (●)"}}
            </g.ToggleButton>
          </ButtonGroup>
        </div>
      </modal.Body>

      {{! @glint-expect-error: same Frontile/ember-source-7 type gap as above }}
      <modal.Footer>
        <div class="flex w-full items-center justify-end gap-2">
          {{#if this.existingConfigAtOpen}}
            <Button
              data-test-alarm-delete
              @appearance="minimal"
              @intent="danger"
              class="mr-auto"
              @onPress={{this.delete}}
            >
              {{t "alarms.modal.delete"}}
            </Button>
          {{/if}}

          <Button
            data-test-alarm-save
            @intent="primary"
            disabled={{not this.canSave}}
            @onPress={{this.save}}
          >
            {{t "alarms.modal.save"}}
          </Button>
        </div>
      </modal.Footer>
    </Modal>
  </template>
}
