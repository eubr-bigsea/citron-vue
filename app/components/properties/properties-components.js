import Vue from 'vue';
import vSelect from "vue-select";

import { getCount } from '../vuex/getters';
import { getOperations } from '../vuex/getters';
import ExpressionEditorComponent from '../expression-editor/expression-editor';
import Css from './properties.scss';

const CleanMissingComponent = Vue.extend({
    components: {
        vSelect
    },
    data() {
      return {
        selected: null,
        options: ['line','vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
      }
    },
    props: {node: null},
    template: require('./clean-missing-template.html')
});

const ProjectionComponent = Vue.extend({
    data() {
      return {
        selected: null,
        options: ['line','vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
      }
    },
    props: {node: null},
    template: require('./projection-template.html')
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

const PublishAsVisualizationComponent = Vue.extend({
    components: {
        vSelect
    },
    data() {
      return {
        selected: null,
        options: ['line','vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
      }
    },
    props: {node: null},
    template: require('./publish-as-visualization-template.html')
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

const TransformationComponent = Vue.extend({
    components: {
        'expression-editor-component': ExpressionEditorComponent
    },
    data(){
        return {
            split: 50,
            seed: 0,
        };
    },
    props: {node: null},
    template: require('./transformation-template.html')
});


export {DataReaderComponent, EmptyPropertiesComponent, 
        SplitComponent, CleanMissingComponent, 
        ProjectionComponent, PropertyDescriptionComponent,
        PublishAsVisualizationComponent,
        TransformationComponent,
};
