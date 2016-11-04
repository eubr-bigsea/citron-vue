import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';

import template from './app-template.html';
import store from '../vuex/store';

import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';
import LoadWorkflowComponent from '../load-workflow/load-workflow';

import { loadOperations, updateNodeFormField } from '../vuex/actions';
import { getOperations, getGroupedOperations, getLanguage, getUser } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, 
    EmptyPropertiesComponent, ProjectionComponent, 
    PropertyDescriptionComponent, PublishAsVisualizationComponent, 
    SplitComponent,
    TransformationComponent,

    IntegerComponent, DecimalComponent, CheckboxComponent, DropDownComponent, RangeComponent,
    TextComponent, TextAreaComponent, ColorComponent, LookupComponent
 } 
    from '../properties/properties-components.js';

const slug2Component = {
    /*
    'data-reader': DataReaderComponent,
    'split': SplitComponent,
    'clean-missing': CleanMissingComponent,
    'projection': ProjectionComponent,
    'publish-as-visualization': PublishAsVisualizationComponent,
    'transformation': TransformationComponent,
    'lookup': LookupComponent
    */
};

const AppComponent = Vue.extend({
    template,
    vuex: {
        actions: {
            loadOperations,
            updateNodeFormField,
        },
        getters: {
            groupedOperations: getGroupedOperations,
            language: getLanguage,
            user: getUser
        },
    },
    components: {
        'toolbox-component': ToolbarComponent,
        'diagram-component': DiagramComponent,
        'property-description-component': PropertyDescriptionComponent,
        
        'color-component': ColorComponent,
        'attribute-selector-component': ProjectionComponent,
        'integer-component': IntegerComponent,
        'decimal-component': DecimalComponent,
        'checkbox-component': CheckboxComponent,
        'dropdown-component': DropDownComponent,
        'range-component': RangeComponent, 
        'text-component': TextComponent,
        'textarea-component': TextAreaComponent,
        'lookup-component': LookupComponent,

        /*
        'empty-properties-component': EmptyPropertiesComponent,
        'no-properties-component': {template: '', props: {task: null},},
        'publish-as-visualization-component': PublishAsVisualizationComponent,
        'transformation-component': TransformationComponent
        */

    },
    data() {
        return {
            currentComponent: 'no-properties-component',
            forms: [],
            filled: {},
            task: {operation: ''},
            title: 'Operations',
            username: '', passwd: '', 
            showModalLoadWorkflow: false
        }
    },
    ready() {
        console.debug(LoadWorkflowComponent)
        this.init();
    },
    events: {
        'update-operations': function (operations) {
        },
        'load-workflow': function(){
            this.showModalLoadWorkflow = true;
        },
        'update-form-field-value': function (field, value) {
            //console.debug(value, this.node);
            //console.debug(this.node.forms[field.name])
            let filled = this.node.forms[field.name];
            if (filled) {
                filled.value = value;
            }
        },
        /*
        'onclick-task': function (task) {
            debugger
            this.node = task.node;
            this.filled = task.node.forms;
            this.forms = task.node.operation.forms;
        },
        */
        'update-form-field-value': function (field, value) {
            //console.debug(value, this.task);
            //console.debug(this.task.forms[field.name])
            let filled = this.task.forms[field.name];
            if (filled) {
                filled.value = value;
            }
        },
        'onclick-task-in-diagram': function (task) {
            /* An task (operation instance) was clicked in the diagram */
            //this.operation = task.operation;
            //console.debug('Slug:', task.task.operation.slug, 
            //    slug2Component[task.task.operation.slug])
            // this.currentComponent = slug2Component[task.task.operation.slug];
            this.task = task;
            this.filledForm = task.forms;
            this.forms = task.operation.forms.sort((a, b) => {
                return a.order - b.order;
            });
        },
        'onclear-selection': function(){
            this.task = null;
            this.filledForm = null;
            this.forms = null;
        }
    },
    methods: {
        init() {
            if (this.user) {
                this.loadOperations();
                let elem = document.getElementById('menu-operations');
                PerfectScrollbar.initialize(elem, {
                    wheelSpeed: 2,
                    wheelPropagation: true,
                    minScrollbarLength: 20
                });
            }
        },
        getValue(name){
            return this.task && this.task.forms && this.task.forms[name] ? this.task.forms[name].value: null;
        },
        doLogin(ev){
            console.debug(this.username, this.passwd);
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
        }
    },
    store
});

export default AppComponent;
