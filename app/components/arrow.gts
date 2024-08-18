import Component from "@glimmer/component";

export interface ArrowSignature {
  Args: {};
  Blocks: {
    default: [];
  };
  Element: null;
}

export default class Arrow extends Component<ArrowSignature> {
  <template>
    {{yield}}
  </template>
}
