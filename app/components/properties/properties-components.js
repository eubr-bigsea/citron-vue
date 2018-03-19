import Vue from 'vue';
import vSelect from "vue-select";

import _ from 'lodash';
import Prism from 'prismjs';
import prismCSS from 'prismjs/themes/prism.css';

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

const projectionTemplate = `
<div>
    <p>{{field.label}} <span class="fa fa-asterisk" v-show="field.required"></span> 
        <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></p>
    <div>
    <v-select multiple :value.sync="value" :options="suggestions" :multiple="(!params || params.multiple)"
        :on-change="updated" :taggable="true"></v-select>
    </div>
</div>
`
const tagTemplate = `
<div>
    <p>{{field.label}} <span class="fa fa-asterisk" v-show="field.required"></span> 
        <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></p>
    <div>
    <v-select multiple :value.sync="value" 
        :on-change="updated" :taggable="true"></v-select>
    </div>
</div>`

const DecimalComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: `
    <div>${baseLabel}
        <input type="number" maxlenght="10" step="0.01" class="form-control input-sm" :value="value === null ? field['default']: value" @input="updated" pattern="\\d*\\.\\d{2}"/>
    </div>`,
});
const IntegerComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, e.target.value);
        }
    },
    props: { value: 0, field: null },
    template: `
        <div>${baseLabel}
            <input type="number" maxlenght="10" class="form-control input-sm" :value="value === null ? field['default']: value" pattern="\\d*" @input="updated"/>
        </div>
    `,
});

const TextComponent = Vue.extend({
    methods: {
        updated: _.debounce(function (e) { eventHub.$emit('update-form-field-value', this.field, e.target.value); }, 500)
    },
    props: { value: 0, field: null },
    template: '<div>' + baseLabel +
    '<input type="text" maxlenght="100" class="form-control input-sm" :value="value === null ? field.default: value" @input="updated" v-bind:required="field.required"/></div>',
});


const TextAreaComponent = Vue.extend({
    methods: {
        updated: _.debounce(function (e) { eventHub.$emit('update-form-field-value', this.field, e.target.value); }, 500)
    },
    computed: {
        normalizedValue: () => {
            return this.field.value || this.field.default;
        }
    },
    props: {value: '', field: null },
    template: '<div>' + baseLabel +
    '<textarea class="form-control input-sm" @keyup="updated" :value="value === null ? field.default: value"></textarea></div>',

});

const CodeComponent = Vue.extend({
    methods: {
        updated: _.debounce(function (e) { 
            let content = e.target.value || e.target.textContent;
            eventHub.$emit('update-form-field-value', this.field, content); 
        }, 500)
    },
    props: { value: 0, field: null },
    template: 
        `<div>${baseLabel}
        <textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" 
            class="form-control input-sm code" @keyup="updated" :value="value === null ? field.default: value"></textarea>
        </div>`,
    xtemplate: 
    `<div>${baseLabel}
        <pre ref="editor" contenteditable @input="updated" class="language-sql">{{value === null ? field.default: value}}</pre> 
        <textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" 
            class="form-control input-sm code" @keyup="updated" 
            :value="value === null ? field.default: value"></textarea></div>`,

});

const CheckboxComponent = Vue.extend({
    methods: {
        updated(e) {
            eventHub.$emit('update-form-field-value', this.field, 
                ! this.checked ? '1' : '0');
        }
    },
    computed: {
        checked(){
            return (this.value === 1 || this.value === '1')
                || (!this.value && 
                    (this.field['default'] === 1 || 
                        this.field['default'] === '1'));
        },
    },
    data(){
        return {
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
    template: `
        <div class="checkbox"> 
            <input type="checkbox" v-model="checked" @change="updated" value="1" :id="id" data-algo="true"/>
            <label :for="id">{{field.label}}</label>
            <span class="fa fa-question-circle-o pull-right" :title="field.help"></span>
        </div>`,
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
    template: projectionTemplate,
});

const DropDownComponent = Vue.extend({
    mounted(){
        eventHub.$emit('update-form-field-value', 
            this.field, this.value || this.field.default);
    },
    computed: {
        pairOptionValueList() {
            return JSON.parse(this.field.values);
        },
        selected() {
            return this.value || this.field.default;
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
    template: `
        <div>${baseLabel}
            <select class="form-control input-sm" v-bind:data-field="field.name" v-model="selected" @change="updated">
                <option v-if="!field.default"></option>
                <option v-for="opt in pairOptionValueList" :value="opt.key">
                    {{opt.value}}
                </option>
            </select>
        </div>`,
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
    '<input type="range" class="form-control input-sm" :value="value" @input="updated" min="1" max="99"/>' +
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
    '<input type="" class="form-control input-sm" :value="value" @input="updated" min=".1" max="99.9" step="0.1"/>' +
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
        },
        replacer(tpl, data) {
            let re = /(\$\{(.+)\})/g;
            let match = null;
            while(match = re.exec(tpl)) {
                if (data[match[2]]){
                    tpl = tpl.replace(match[1], data[match[2]])
                }
                re.lastIndex = 0;
            }
            return tpl;
        }
    },
    props: { value: null, field: null, context: {}},
    data() {
        return {
            options: [],
        }
    },
    computed: {
        selected() {
            return this.value || this.field.default;
        }
    },
    mounted() {
        if (this.field.values_url) {
            let self = this;
            let url = self.field.values_url;
            if (url.startsWith('`')){
                url = self.replacer(url.substring(1, url.length -1), self.context);
            }
            self.$http.get(url, {headers: {'X-Auth-Token': '123456'}}).then(function (response) {
                self.selected = self.value;
                let data = response.data.data || response.data
                this.options = data.map((v) => {
                    return { "key": v.id, "value": v.name };
                });
            });
        } else {
            JSON.parse(this.field.values).forEach((opt) => {
                this.options.push(opt);
            });
        }
    },
    template: 
    `<div>
        ${baseLabel}
        <select class="form-control input-sm" v-model.lazy="selected" @change="updated">
            <option></option>
            <option v-for="opt in options" :value="opt.key">{{opt.key}} - {{opt.value}}</option>
        </select>
    </div>`,
    
});
const AttributeSelectorComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    computed: {
        params() {
            let result = null;
            if (this.field.values){
                result = JSON.parse(this.field.values);
            }
            return result;
        }
    },
    methods: {
        updated(val) {
            eventHub.$emit('update-form-field-value', this.field, val);
        }
    },
    props: { value: "", field: null, suggestions: { required: true} },
    template: projectionTemplate
});

const TagComponent = Vue.extend({
    components: {
        'v-select': vSelect
    },
    methods: {
        updated(val) {
            eventHub.$emit('update-form-field-value', this.field, val);
        }
    },
    props: { value: "", field: null },
    template: tagTemplate
});

const Select2Component = Vue.extend({
    components: {
        'v-select': vSelect
    },
    methods: {
        updated(val) {
            eventHub.$emit('update-form-field-value', this.field, val);
        }
    },
    computed: {
        suggestions() {
            let obj = JSON.parse(this.field.values);
            return obj;
        }
    },
    props: { value: "", field: null, },
    template: `
    <div>
        <p>{{field.label}} <span class="fa fa-asterisk" v-show="field.required"></span> 
            <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></p>
        <div>
        <v-select :value.sync="value" :options="suggestions" label="key" 
            :on-change="updated" :taggable="true"></v-select>
        </div>
    </div>`
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
            e.preventDefault();
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
    template: projectionTemplate
});

const MultipleExpressionsComponent = Vue.extend({
    computed: {
        expression() {
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
    template: `
    <div>
        <p>{{field.label}} <span class="fa fa-asterisk" v-show="field.required"></span> 
        <span class="fa fa-question-circle-o pull-right" :title="field.help"></span></p>

        <expression-editor-component :expression="value">
        </expression-editor-component>
    </div>
    `
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
    CodeComponent,
    ColorComponent,
    IndeterminatedCheckboxComponent,
    LookupComponent,
    AttributeSelectorComponent,
    PercentageComponent,
    SortSelectorComponent,
    ExpressionComponent,
    MultipleExpressionsComponent,
    AttributeFunctionComponent,
    MultiSelectDropDownComponent,
    Select2Component,
    TagComponent
};