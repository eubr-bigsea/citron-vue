import Vue from 'vue';
import { getCount } from '../../vuex/getters';
import { getOperations } from '../../vuex/getters';

const DataReaderComponent = Vue.extend({
    template: require('./data-reader-template.html')
});
const SplitComponent = Vue.extend({
    template: require('./split-template.html')
});

export {DataReaderComponent, SplitComponent};
