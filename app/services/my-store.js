// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import Store from 'ember-data/store';
import { service } from '@ember/service';

export default class MyStoreService extends Store {
  @service requestManager;
}

// // Don't remove this declaration: this is what enables TypeScript to resolve
// // this service using `Owner.lookup('service:my-store')`, as well
// // as to check when you pass the service name as an argument to the decorator,
// // like `@service('my-store') declare altName: MyStoreService;`.
// declare module '@ember/service' {
//   interface Registry {
//     'my-store': MyStoreService;
//   }
// }
