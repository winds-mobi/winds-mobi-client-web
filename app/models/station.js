import Model, { attr } from '@ember-data/model';

export default class StationModel extends Model {
  @attr alt;
  @attr loc;
  @attr peak;
  @attr pvName;
  @attr short;
  @attr status;
  @attr last;
}
