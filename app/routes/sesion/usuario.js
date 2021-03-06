import Route from '@ember/routing/route';
import { inject as Service } from '@ember/service';
export default Route.extend({
  session: Service('session'),
  beforeModel: function() {
    return this.get('session').fetch().catch(function() {});
  },
  model() {
    return this.get('store').findRecord('usuario', this.get('session').get('uid'));
  }
});
