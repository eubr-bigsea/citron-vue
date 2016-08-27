import Vue from 'vue';
import template from './subscription-component-template.html';

const SubscriptionComponent = Vue.extend({
  template,
  props: [
    'channel',
    'pusher'
  ],
  data() {
    return {
      tweets: []
    }
  },

  // component methods and definitions here
});

export default SubscriptionComponent;
