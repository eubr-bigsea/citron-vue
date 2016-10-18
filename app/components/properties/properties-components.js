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
    props: {task: null},
    template: require('./clean-missing-template.html')
});

const ProjectionComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    data() {
      return {
        selected: null,
        options: ['line','vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
      }
    },
    props: {value: 0, field: null},
    template: require('./projection-template.html')
});

const DataReaderComponent = Vue.extend({
    props: {task: null},
    template: require('./data-reader-template.html')
});
const EmptyPropertiesComponent = Vue.extend({
    props: {task: null},
    template: require('./empty-properties-template.html')
});
const PropertyDescriptionComponent = Vue.extend({
    props: {task: null},
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
    props: {task: null},
    template: require('./publish-as-visualization-template.html')
});

const SplitComponent = Vue.extend({
    
    data(){
        return {
            split: 50,
            seed: 0,
        };
    },
    props: {task: null},
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
    props: {task: null},
    template: require('./transformation-template.html')
});

const fieldIsRequiredSymbol = '<span class="fa fa-asterisk" v-show="field.required"></span>'
const baseLabel = '<p>{{field.label}} ' + fieldIsRequiredSymbol 
    + '<span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></p>';

const DecimalComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    template: '<div>' + baseLabel + 
        '<input type="number" maxlenght="10" step="0.01" class="form-control" :value="value" @input="updated" pattern="\\d*\\.\\d{2}"/></div>',
});
const IntegerComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    template: '<div>' + baseLabel + 
        '<input type="number" maxlenght="10" class="form-control" :value="value" pattern="\\d*" @input="updated"/></div>',
});

const TextComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    template: '<div>' + baseLabel + 
        '<input type="text" maxlenght="100" class="form-control" :value="value" @input="updated"/></div>',
});


const TextAreaComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    template: '<div>' + baseLabel + 
        '<textarea class="form-control" @keyUp="updated | debounce 500">{{value}}</textarea></div>',

});

const CheckboxComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    template: '<div class="checkbox"><input type="checkbox" :value="value" @input="updated" value="Y" id="checkboxComponentInput"/> '+
        '<label for="checkboxComponentInput">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></div>'
});

const IndeterminatedCheckboxComponent = Vue.extend({
    methods:{
        updated(e){
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 0, field: null},
    ready: function(){
        let checkbox = this.$el.querySelector('input');
        checkbox.indeterminate = true;
        console.debug(checkbox);
    },
    template: '<div class="checkbox"><input type="checkbox" :value="value" @input="updated" value="Y"/> '+
        '<label for="checkboxComponentInput">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></div>'
});


const DropDownComponent = Vue.extend({
    computed: {
        pairOptionValueList(){
            return JSON.parse(this.field.values);
        }
    },
    methods:{
        updated(e){
            console.debug(e.target.value, e.target.checked);
        }
    },
    props: {value: 0, field: null},
     template: '<div>' + baseLabel +
        '<select class="form-control"><option v-for="opt in pairOptionValueList" :value="opt.key">{{opt.value}}</option></select>' +  
        '</div>',
});

const RangeComponent = Vue.extend({
    data(){
        return {
            split: 50,
        };
    },
    methods:{
        updated(e){
            this.split = parseInt(e.target.value);
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {value: 50, field: null},
     template: '<div>' + baseLabel +
        '<input type="range" class="form-control" :value="value" @input="updated" min="1" max="99"/>' +
        '<span class="tag tag-pill tag-info">{{value}}% - {{100-value}}%</span>' +  
        '</div>',
});
const ColorComponent = Vue.extend({
    computed: {
        pairOptionValueList(){
            return JSON.parse(this.field.values);
        }
    },
    methods:{
        doUpdate(value){
            this.$dispatch('update-form-field-value', this.field, value);
        }
    },
    props: {value: 'rgb(255, 255, 165)', field: null},
     template: '<div>' + baseLabel + 
        '<div v-for="opt in pairOptionValueList" @click="doUpdate(opt.value)" class="color-item" :class="{active: opt.value === value}" :style="{background: opt.value}"></div>' +  
        '</div>',
});
export {DataReaderComponent, EmptyPropertiesComponent, 
        SplitComponent, CleanMissingComponent, 
        ProjectionComponent, PropertyDescriptionComponent,
        PublishAsVisualizationComponent,
        TransformationComponent,

        DecimalComponent, IntegerComponent, CheckboxComponent, DropDownComponent, RangeComponent, TextComponent,
        TextAreaComponent, ColorComponent, IndeterminatedCheckboxComponent
};
