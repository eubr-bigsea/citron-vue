import Vue from 'vue';
import vSelect from "vue-select";

import { getCount } from '../vuex/getters';
import { getOperations } from '../vuex/getters';
import Css from './properties.scss';

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
    props: {node: null},
    template: require('./clean-missing-template.html')
});
const DataReaderComponent = Vue.extend({
    props: {node: null},
    template: require('./data-reader-template.html')
});
const EmptyPropertiesComponent = Vue.extend({
    props: {node: null},
    template: require('./empty-properties-template.html')
});
const PropertyDescriptionComponent = Vue.extend({
    props: {node: null},
    template: require('./property-description-template.html')
});
const SplitComponent = Vue.extend({
    data(){
        return {
            split: 50,
            seed: 0,
        };
    },
    props: {node: null},
    template: require('./split-template.html')
});

export {DataReaderComponent, EmptyPropertiesComponent, 
        SplitComponent, CleanMissingComponent, PropertyDescriptionComponent};
