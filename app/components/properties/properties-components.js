import Vue from 'vue';
import vSelect from "vue-select";

import _ from 'lodash'

import ExpressionEditorComponent from '../expression-editor/expression-editor';
import ModalComponent from '../modal/modal-component.js';
import Css from './properties.scss';
import eventHub from '../app/event-hub';

const PropertyDescriptionComponent = Vue.extend({
    props: { task: null },
    template: require('./property-description-template.html')
});

const fieldIsRequiredSymbol = '<span class="fa fa-asterisk" v-show="field.required"></span>'
const baseLabel = '<p>{{field.label}} ' + fieldIsRequiredSymbol +
    '<span class="fa fa-question-circle-o pull-right" :title="field.help"></span></p>';

const DecimalComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="number" maxlenght="10" step="0.01" class="form-control" :value="value" @input="updated" pattern="\\d*\\.\\d{2}"/></div>',
});
const IntegerComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="number" maxlenght="10" class="form-control" :value="value" pattern="\\d*" @input="updated"/></div>',
});

const TextComponent = Vue.extend({
    methods: {
        updated: _.debounce(function (e) { eventHub.$emit('update-form-field-value', this.field, e.target.value); }, 500)
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="text" maxlenght="100" class="form-control" :value="value" @input="updated" v-bind:required="field.required"/></div>',
});


const TextAreaComponent = Vue.extend({
    methods: {
        updated: _.debounce(function (e) { eventHub.$emit('update-form-field-value', this.field, e.target.value); }, 500)
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<textarea class="form-control" @keyup="updated">{{value}}</textarea></div>',

});

const CheckboxComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, 
                this.checked ? '1' : '0');
        }
    },
    computed: {
        xchecked(){
            return this.value === 1 || this.value === '1';
        },
    },
    data(){
        return {
            checked: '0',
            id: '',
        };
    },
    mounted() {
        let input = this.$el.querySelector('input[type="checkbox"]');
        input.id = `checkboxComponentInput-${this.field.name}`;
        this.checked = this.value === 1 || this.value === '1';
        this.id = `check_${this._uid}`;
    },
    props: { value: 0, field: null},
    template: '<div class="checkbox"><input type="checkbox" v-model="checked" @change="updated" value="1" :id="id" data-algo="true"/> ' +
    '<label :for="id">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></div>'
});

const IndeterminatedCheckboxComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    ready: function () {
        let checkbox = this.$el.querySelector('input');
        checkbox.indeterminate = true;
    },
    template: '<div class="checkbox"><input type="checkbox" :value="value" @input="updated" value="Y"/> ' +
    '<label for="checkboxComponentInput">{{field.label}}</label> <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></div>'
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
            eventHub.$emit('update-form-field-value', this.field, val);
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
        selected() {
            return this.value;
        }
    },
    methods: {
        updated(e) {
            this.selected = e.target.value;
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null, },
    ready: function () {
        //console.debug(this.field, this.field['default'], this.value)
        if (this.field['default'] && (this.value === null || this.value === '')) {
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
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {
        value: String,
        field: Object
    },
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
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: {
        value: String,
        field: Object
    },
    template: '<div>' + baseLabel +
    '<input type="" class="form-control" :value="value" @input="updated" min=".1" max="99.9" step="0.1"/>' +
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
            eventHub.$emit('update-form-field-value', this.field, value);
        }
    },
    props: { value: '', field: null },
    template: '<div>' + baseLabel +
    '<div v-for="opt in pairOptionValueList" @click="doUpdate(opt)" class="color-item" :class="{active: value && opt && opt.background === value.background && opt.foreground == value.foreground}" :style="{background: opt.background}"></div>' +
    '</div>',
});
const LookupComponent = Vue.extend({
    methods: {
        updated(e) {
            this.selected = e.target.value;
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: null, field: null },
    data() {
        return {
            selected: null,
            options: [],
        }
    },
    mounted() {
        if (this.field.values_url) {
            let self = this;
            this.$http.get(this.field.values_url).then(function (response) {
                self.selected = self.value;
                this.options = response.data.map((v) => {
                    return { "key": v.id, "value": v.name };
                });
            });
        }
    },
    template: '<div>' + baseLabel +
    '<select class="form-control" v-model.lazy="selected" @change="updated"><option></option><option v-for="opt in options" :value="opt.key">{{opt.key}} - {{opt.value}}</option></select>' +
    '</div>',
    xwatch: {
        selected() {
            console.debug('SElecionando ', this.selected)
            eventHub.$emit('update-form-field-value', this.field, this.selected);
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
            eventHub.$emit('update-form-field-value', this.field, val);
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
    data() {
        return {
            currentTab: 'editor',
            showModal: false,
            valueList: JSON.parse(JSON.stringify(this.value || [])),
            ok: this.okClicked,
            cancel: this.cancelClicked
        }
    },
    methods: {
        updated(e, row, attr) {
            row[attr] = e.target.value;
            /*eventHub.$emit('update-form-field-value', this.field, 
                this.valueValue);*/
        },
        add(e) {
            if (this.valueList === null) {
                this.valueList = [];
            }
            this.valueList.push({ alias: '', attribute: '', f: '' })
            eventHub.$emit('update-form-field-value', this.field,
                this.valueList);
        },
        remove(e, index) {
            this.valueList.splice(index, 1);
            e.stopPropagation();
            return false;
        },
        moveUp(e, index) {
            let tmp = this.valueList.splice(index, 1)[0];
            this.valueList.splice(index - 1, 0, tmp)
            e.stopPropagation();
            return false;
        },
        moveDown(e, index) {
            let tmp = this.valueList.splice(index, 1)[0]
            this.valueList.splice(index + 1, 0, tmp)
            e.stopPropagation();
            return false;
        },
        selectTab(tab) {
            this.currentTab = tab;
        },
        okClicked(ev) {
            eventHub.$emit('update-form-field-value', this.field,
                this.valueList);
            this.showModal = false;
        },
        cancelClicked(ev) {
            this.showModal = false;
        }
    },
    props: ['value', 'field', 'options'],
    template: require('./function-template.html')

});
const SortSelectorComponent = Vue.extend({
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
            eventHub.$emit('update-form-field-value', this.field, val);
        }
    },
    props: [
        'value',
        'field'
    ],
    template: require('./projection-template.html')
});

const ExpressionComponent = Vue.extend({
    computed: {
        categories() {
            return JSON.parse(this.field.values);
        },
        expression() {
            debugger
            if (this.value) {
                return JSON.parse(this.value)['expression'];
            } else {
                return "";
            }
        }
    },
    components: {
        'expression-editor-component': ExpressionEditorComponent
    },
    created() {
        eventHub.$on('update-expression', (expression, tree) => {
            let value = JSON.stringify({ expression, tree });
            eventHub.$emit('update-form-field-value', this.field, value);
        });
    },
    props: {
        field: {},
        value: {},
    },
    template: require('./transformation-template.html')
});


export {
    PropertyDescriptionComponent,

    DecimalComponent,
    IntegerComponent,
    CheckboxComponent,
    DropDownComponent,
    RangeComponent,
    TextComponent,
    TextAreaComponent,
    ColorComponent,
    IndeterminatedCheckboxComponent,
    LookupComponent,
    AttributeSelectorComponent,
    PercentageComponent,
    SortSelectorComponent,
    ExpressionComponent,
    AttributeFunctionComponent,
    MultiSelectDropDownComponent
};