import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';

import template from './app-template.html';
import store from '../vuex/store';

import eventHub from './event-hub';
import html2canvas from 'html2canvas';

import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';
import LoadWorkflowComponent from '../load-workflow/load-workflow';

//import { loadOperations, updateTaskFormField, changeLanguage, login, connectWebSocket } from '../vuex/actions';
//import { getGroupedOperations, getLanguage, getUser } from '../vuex/getters';


import {
    EmptyPropertiesComponent,
    PropertyDescriptionComponent,
    IntegerComponent, DecimalComponent, CheckboxComponent, DropDownComponent, RangeComponent,
    TextComponent, TextAreaComponent, ColorComponent, IndeterminatedCheckboxComponent, LookupComponent,
    AttributeSelectorComponent, PercentageComponent, 
    ExpressionComponent, AttributeFunctionComponent, MultiSelectDropDownComponent
}
    from '../properties/properties-components.js';

const AppComponent = Vue.extend({
    template,
    /*
    vuex: {
        actions: {
            loadOperations,
            updateTaskFormField,
            changeLanguage,
            login,
            connectWebSocket,
        },
        getters: {
            groupedOperations: getGroupedOperations,
            language: getLanguage,
            user: getUser
        },
    },*/
    computed: {
        groupedOperations: function(){
            return this.$store.getters.getGroupedOperations;
        },
        language: 'en', //this.$store.getters.language,
        user: function(){
            return this.$store.getters.getUser;
        },
    },
    created(){
        eventHub.$on('onclick-task', (taskComponent) => {
            let task = taskComponent.task;
            /* An task (operation instance) was clicked in the diagram */
            this.task = task;
            this.filledForm = task.forms;
            this.forms = task.operation.forms.sort((a, b) => {
                return a.order - b.order;
            });
            // Reverse association between field and form. Used to retrieve category
            this.forms.forEach((f, i) => {
                f.fields.forEach((field, j) => {
                    field.category = f.category;
                });
            });
        });
        eventHub.$on('update-form-field-value',(field, value) => {
            //console.debug(this.task.forms[field.name])
            let filled = this.task.forms[field.name];
            if (filled) {
                filled.value = value;
                filled.category = field.category;
            } else {
                let category = field.category;
                this.task.forms[field.name] = { value, category };
            }
            //this.task.forms[field.name]['category'] = 
        });
    },
    components: {
        'toolbox-component': ToolbarComponent,
        'diagram-component': DiagramComponent,
        'property-description-component': PropertyDescriptionComponent,

        'attribute-selector-component': AttributeSelectorComponent,
        'checkbox-component': CheckboxComponent,
        'color-component': ColorComponent,
        'decimal-component': DecimalComponent,
        'dropdown-component': DropDownComponent,
        'indeterminated-checkbox-component': IndeterminatedCheckboxComponent,
        'integer-component': IntegerComponent,
        'load-workflow-component': LoadWorkflowComponent,
        'lookup-component': LookupComponent,
        'range-component': RangeComponent,
        'text-component': TextComponent,
        'textarea-component': TextAreaComponent,
        'percentage-component': PercentageComponent,
        'expression-component': ExpressionComponent,
        'attribute-function-component': AttributeFunctionComponent,
        'multi-select-dropdown-component': MultiSelectDropDownComponent
    },
    data() {
        return {
            currentComponent: 'no-properties-component',
            forms: [],
            filled: {},
            task: { operation: '' },
            title: 'Operations',
            username: '', passwd: '',
            showModalLoadWorkflow: false
        }
    },
    events: {
        'update-operations': function (operations) {
        },
        'load-workflow': function () {
            this.showModalLoadWorkflow = true;
        },
        'update-form-field-value': function (field, value) {
            //console.debug(this.task.forms[field.name])
            let filled = this.task.forms[field.name];
            if (filled) {
                filled.value = value;
                filled.category = field.category;
            } else {
                let category = field.category;
                this.task.forms[field.name] = { value, category };
            }
            //this.task.forms[field.name]['category'] = 
        },
        'onclick-task-in-diagram': function (task) {
            // /* An task (operation instance) was clicked in the diagram */
            // this.task = task;
            // this.filledForm = task.forms;
            // this.forms = task.operation.forms.sort((a, b) => {
            //     return a.order - b.order;
            // });
            // // Reverse association between field and form. Used to retrieve category
            // this.forms.forEach((f, i) => {
            //     f.fields.forEach((field, j) => {
            //         field.category = f.category;
            //     });
            // });
        },
        'onclear-selection': function () {
            this.task = null;
            this.filledForm = null;
            this.forms = null;
        },
        'onselect-tasks-in-diagram': function(coords) {
            this['onclear-selection']();
            console.debug(coords, this)
        }, 

    },
    mounted() {
        //this.connectWebSocket();
        if (true || this.user) {
            this.loadOperations();
            let elem = document.getElementById('menu-operations');
            PerfectScrollbar.initialize(elem, {
                wheelSpeed: 2,
                wheelPropagation: true,
                minScrollbarLength: 20
            });
        }
    },
    methods: {
        getValue(name) {
            return this.task && this.task.forms && this.task.forms[name] ? this.task.forms[name].value : null;
        },
        doLogin(ev) {
            //console.debug(this.username, this.passwd);
            this.login(this.username, this.passwd)
            return false;
        },
        toggle(ev) {
            let ul = ev.target.parentElement.querySelector('ul.tree');
            if (ul.classList.contains('slide-up')) {
                ul.classList.remove('slide-up');
                ul.classList.add('slide-down');
            } else {
                ul.classList.add('slide-up');
                ul.classList.remove('slide-down');
            }
        },
        minimap(ev) {
            html2canvas(document.getElementById('lemonade-diagram'),
                {
                    onrendered(canvas){
                        canvas.style.zoom = .15;
                        let minimap = document.getElementById('minimap');
                        minimap.innerHTML = "";
                        minimap.appendChild(canvas);
                    }, 
                });
        },
        loadOperations(){
            this.$store.dispatch('loadOperations');
        }
    },
    store
});

export default AppComponent;
