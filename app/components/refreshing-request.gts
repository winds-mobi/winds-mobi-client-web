import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import type { Future } from '@warp-drive/core/request';
import { Request } from '@warp-drive/ember';
import { modifier } from 'ember-modifier';

export interface RefreshingRequestSignature<T> {
  Args: {
    request: Future<{ data: T }> | undefined;
    // Called with each resolved response, including every refresh -- for a
    // page that keeps the last loaded data on screen while a new request
    // loads.
    onResolve?: (data: T) => void;
  };
}

// Runs its callback after render, so the callback can write tracked state.
const afterRender = modifier<{
  Element: Element;
  Args: { Positional: [() => void] };
}>((_element, [run]) => {
  run();
});

// Keeps a request on screen fresh: when a refresh invalidates it (see
// app/services/refresh.ts), it re-fetches in place. Renders nothing itself;
// the page reads the request's own state, and `@onResolve` hands it each
// response.
export default class RefreshingRequest<T> extends Component<
  RefreshingRequestSignature<T>
> {
  resolved = (data: T) => {
    this.args.onResolve?.(data);
  };

  <template>
    <Request
      @request={{@request}}
      @autorefresh="invalid"
      @autorefreshBehavior="refresh"
    >
      <:content as |result|>
        {{#if @onResolve}}
          <div
            class="contents"
            {{afterRender (fn this.resolved result.data)}}
          ></div>
        {{/if}}
      </:content>
      <:idle></:idle>
      <:loading></:loading>
      <:error></:error>
    </Request>
  </template>
}
