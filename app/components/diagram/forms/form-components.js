import Vue from 'vue';
import vSelect from "vue-select";

import { getCount } from '../../vuex/getters';
import { getOperations } from '../../vuex/getters';

const DataReaderComponent = Vue.extend({
    template: require('./data-reader-template.html')
});
const CleanMissingComponent = Vue.extend({
    components: {
        vSelect
    },
    data() {
      return {
        selected: null,
        options: ['foo','bar','baz']
      }
    },
    template: require('./clean-missing-template.html')
});
const SplitComponent = Vue.extend({
    data(){
        return {
            split: 50,
            seed: 0,
        };
    },
    template: require('./split-template.html')
});

export {DataReaderComponent, SplitComponent, CleanMissingComponent};
