import Vue from 'vue';
import vSelect from "vue-select";

import { getCount } from '../vuex/getters';
import { getOperations } from '../vuex/getters';
import ExpressionEditorComponent from '../expression-editor/expression-editor';
import ModalComponent from '../modal/modal-component.js';
import Css from './properties.scss';

const CleanMissingComponent = Vue.extend({
    components: {
        vSelect
    },
    data() {
        return {
            selected: null,
            options: ['line', 'vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
        }
    },
    props: { task: null },
    template: require('./clean-missing-template.html')
});

const ProjectionComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    data() {
        return {
            selected: null,
            options: ['line', 'vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
        }
    },
    props: { value: 0, field: null },
    template: require('./projection-template.html')
});

const DataReaderComponent = Vue.extend({
    props: { task: null },
    template: require('./data-reader-template.html')
});
const EmptyPropertiesComponent = Vue.extend({
    props: { task: null },
    template: require('./empty-properties-template.html')
});
const PropertyDescriptionComponent = Vue.extend({
    props: { task: null },
    template: require('./property-description-template.html')
});

const PublishAsVisualizationComponent = Vue.extend({
    components: {
        vSelect
    },
    data() {
        return {
            selected: null,
            options: ['line', 'vehicle', 'date_time', 'latitude', 'longitude', 'card_id', 'travel', 'bus_origin', 'bus_destination']
        }
    },
    props: { task: null },
    template: require('./publish-as-visualization-template.html')
});

const SplitComponent = Vue.extend({

    data() {
        return {
            split: 50,
            seed: 0,
        };
    },
    props: { task: null },
    template: require('./split-template.html')
});
/*
const TransformationComponent = Vue.extend({
    components: {
        'expression-editor-component': ExpressionEditorComponent
    },
    data() {
        return {
            split: 50,
            seed: 0,
        };
    },
    props: { task: null },
    template: require('./transformation-template.html')
});
*/
const fieldIsRequiredSymbol = '<span class="fa fa-asterisk" v-show="field.required"></span>'
const baseLabel = '<p>{{field.label}} ' + fieldIsRequiredSymbol
    + '<span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></p>';

const DecimalComponent = Vue.extend({
    methods: {
        updated(e) {
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="number" maxlenght="10" step="0.01" class="form-control" :value="value" @input="updated" pattern="\\d*\\.\\d{2}"/></div>',
});
const IntegerComponent = Vue.extend({
    methods: {
        updated(e) {
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="number" maxlenght="10" class="form-control" :value="value" pattern="\\d*" @input="updated"/></div>',
});

const TextComponent = Vue.extend({
    methods: {
        updated(e) {
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="text" maxlenght="100" class="form-control" :value="value" @input="updated" v-bind:required="field.required"/></div>',
});


const TextAreaComponent = Vue.extend({
    methods: {
        updated(e) {
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<textarea class="form-control" @keyUp="updated | debounce 500">{{value}}</textarea></div>',

});

const CheckboxComponent = Vue.extend({
    methods: {
        updated(e) {
            this.checked = e.target.checked;
            this.$dispatch('update-form-field-value', this.field, this.checked ? '1' : '0');
        }
    },
    props: { value: 0, field: null, checked: '0' },
    ready() {
        this.checked = this.value === '1';
    },
    template: '<div class="checkbox"><input type="checkbox" @change="updated" checked="{{checked}}" id="checkboxComponentInput-{{field.name}}" value="1"/> ' +
    '<label for="checkboxComponentInput">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></div>'
});

const IndeterminatedCheckboxComponent = Vue.extend({
    methods: {
        updated(e) {
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    ready: function () {
        let checkbox = this.$el.querySelector('input');
        checkbox.indeterminate = true;
    },
    template: '<div class="checkbox"><input type="checkbox" :value="value" @input="updated" value="Y"/> ' +
    '<label for="checkboxComponentInput">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" title="{{field.help}}"></span></div>'
});

const MultiSelectDropDownComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    data() {
        return {
            options: JSON.parse(this.field.values).map((x) => x['key'])
        }
    },
    methods: {
        updated(val) {
            this.$dispatch('update-form-field-value', this.field, val);
        }
    },
    props: { value: "", field: null },
    template: require('./projection-template.html')
});

const DropDownComponent = Vue.extend({
    computed: {
        pairOptionValueList() {
            return JSON.parse(this.field.values);
        },
        selected(){
            return this.value;
        }
    },
    methods: {
        updated(e) {
            this.selected = e.target.value;
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null, },
    ready: function(){
        //console.debug(this.field, this.field['default'], this.value)
        if (this.field['default'] && (this.value === null || this.value === '')){
            this.value = this.field['default'];
        }
    },
    template: '<div>' + baseLabel +
    '<select class="form-control" v-model="selected" @change="updated"><option></option><option v-for="opt in pairOptionValueList" :value="opt.key">{{opt.value}}</option></select>' +
    '</div>',
});

const RangeComponent = Vue.extend({
    data() {
        return {
            split: 50,
        };
    },
    methods: {
        updated(e) {
            this.split = parseInt(e.target.value);
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 50, field: null },
    template: '<div>' + baseLabel +
    '<input type="range" class="form-control" :value="value" @input="updated" min="1" max="99"/>' +
    '<span class="tag tag-pill tag-info">{{value}}% - {{100-value}}%</span>' +
    '</div>',
});

const PercentageComponent = Vue.extend({
    data() {
        return {
            //percentage: 1,
        };
    },
    methods: {
        updated(e) {
            //this.percentage = parseFloat(e.target.value);
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 50, field: null },
    template: '<div>' + baseLabel +
    '<input type="range" class="form-control" :value="value" @input="updated" min=".1" max="99.9" step="0.1"/>' +
    '<span class="tag tag-pill tag-info">{{value}}%</span>' +
    '</div>',
});

const ColorComponent = Vue.extend({
    computed: {
        pairOptionValueList() {
            return JSON.parse(this.field.values);
        }
    },
    methods: {
        doUpdate(value) {
            this.$dispatch('update-form-field-value', this.field, value);
        }
    },
    props: { value: 'rgb(255, 255, 165)', field: null },
    template: '<div>' + baseLabel +
    '<div v-for="opt in pairOptionValueList" @click="doUpdate(opt)" class="color-item" :class="{active: value && opt && opt.background === value.background && opt.foreground == value.foreground}" :style="{background: opt.background}"></div>' +
    '</div>',
});
const LookupComponent = Vue.extend({
    methods: {
        updated(e) {
            this.selected = e.target.value;
            this.$dispatch('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: null, field: null, options: [], selected: null, },
    ready() {
        if (this.field.values_url) {
            this.$http.get(this.field.values_url).then(function (response) {
                this.options = response.data.map((v) => {
                    return { "key": v.id, "value": v.name };
                });
            });
        }
        this.selected = this.value;
    },
    template: '<div>' + baseLabel +
    '<select class="form-control" v-model="selected" @change="updated"><option></option><option v-for="opt in options" :value="opt.key">{{opt.key}} - {{opt.value}}</option></select>' +
    '</div>',
    watch: {
        value() {
            this.selected = this.value;
        }
    },
});
const AttributeSelectorComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    data() {
        return {
            options: ['line (ASC)', 'line (DESC)', 'vehicle (ASC)', 'vehicle (DESC)', 'date_time (ASC)', 'date_time (DESC)', 'latitude (ASC)', 'latitude (DESC)', 'longitude (ASC)', 'longitude (DESC)', 'card_id (ASC)', 'card_id (DESC)', 'travel (ASC)', 'travel (DESC)', 'bus_origin (ASC)', 'bus_origin (DESC)', 'bus_destination (ASC)', 'bus_destination (DESC)']
        }
    },
    methods: {
        updated(val) {
            this.$dispatch('update-form-field-value', this.field, val);
        }
    },
    props: { value: "", field: null },
    template: require('./projection-template.html')
});

const AttributeFunctionComponent = Vue.extend({
    computed: {
        pairOptionValueList() {
            return JSON.parse(this.field.values);
        },
    },
    components: {
        'modal-component': ModalComponent
    },
    data(){
        return {currentTab: 'editor'}
    },
    methods: {
        updated(e, row, attr) {
            row[attr] = e.target.value;
            this.$dispatch('update-form-field-value', this.field, this.value);
        },
        add(e){
            if (this.value === null){
                this.value = [];
            } 
            this.value.push({alias: '', attribute: '', f: ''})
            this.$dispatch('update-form-field-value', this.field, this.value);
        },
        remove(e, index){
            this.value.splice(index, 1);
            e.stopPropagation();
            return false;
        },
        moveUp(e, index){
            let tmp = this.value.splice(index, 1)[0];
            this.value.splice(index - 1, 0, tmp)
            e.stopPropagation();
            return false;
        },
        moveDown(e, index){
            let tmp = this.value.splice(index, 1)[0]
            this.value.splice(index + 1, 0, tmp)
            e.stopPropagation();
            return false;
        },
        selectTab(tab){
            this.currentTab = tab;
        }
    },
    props: { value: [{attribute: '', f: '', alias: ''}], field: null, options: [], showModal: false,
            },
    ready() {
    },
    template: require('./function-template.html')

});
const SortSelectorComponent  = Vue.extend({
    components: {
        'v-select': vSelect
    },
    data() {
        return {
            options: ['line (ASC)', 'line (DESC)', 'vehicle (ASC)', 'vehicle (DESC)', 'date_time (ASC)', 'date_time (DESC)', 'latitude (ASC)', 'latitude (DESC)', 'longitude (ASC)', 'longitude (DESC)', 'card_id (ASC)', 'card_id (DESC)', 'travel (ASC)', 'travel (DESC)', 'bus_origin (ASC)', 'bus_origin (DESC)', 'bus_destination (ASC)', 'bus_destination (DESC)']
        }
    },
    methods: {
        updated(val) {
            this.$dispatch('update-form-field-value', this.field, val);
        }
    },
    props: { value: "", field: null },
    template: require('./projection-template.html')
});

const ExpressionComponent = Vue.extend({
    computed: {
        categories() {
            return JSON.parse(this.field.values);
        },
        expression() {
            if (this.value){
                return JSON.parse(this.value)['expression'];
            } else {
                return "";
            }
        }
    },
    components: {
        'expression-editor-component': ExpressionEditorComponent
    },
    data() {
        return {
            split: 50,
            seed: 0,
        };
    },
    events: {
        'update-expression': function (expression, tree) {
            let value = JSON.stringify({expression, tree})
            this.$dispatch('update-form-field-value', this.field, value);
        },
    },
    props: { value: {expression: ""}, field: null },
    template: require('./transformation-template.html')
});


export {
    /*
    DataReaderComponent, EmptyPropertiesComponent,
    SplitComponent, CleanMissingComponent,
    ProjectionComponent, 
    PublishAsVisualizationComponent,
    TransformationComponent,
    */
    PropertyDescriptionComponent,

    DecimalComponent, IntegerComponent, CheckboxComponent, DropDownComponent, RangeComponent, TextComponent,
    TextAreaComponent, ColorComponent, IndeterminatedCheckboxComponent, LookupComponent, AttributeSelectorComponent,
    PercentageComponent, SortSelectorComponent, ExpressionComponent, AttributeFunctionComponent, MultiSelectDropDownComponent
};
