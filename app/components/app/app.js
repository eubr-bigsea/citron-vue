import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';

import template from './app-template.html';
import store from '../vuex/store';

import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';

import { loadOperations, updateNodeFormField } from '../vuex/actions';
import { getOperations, getGroupedOperations } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, 
    EmptyPropertiesComponent, ProjectionComponent, 
    PropertyDescriptionComponent, PublishAsVisualizationComponent, 
    SplitComponent,
    TransformationComponent,

    IntegerComponent, DecimalComponent, CheckboxComponent, DropDownComponent, RangeComponent,
    TextComponent, TextAreaComponent
 } 
    from '../properties/properties-components.js';

const slug2Component = {
    'data-reader': DataReaderComponent,
    'split': SplitComponent,
    'clean-missing': CleanMissingComponent,
    'projection': ProjectionComponent,
    'publish-as-visualization': PublishAsVisualizationComponent,
    'transformation': TransformationComponent
};

const AppComponent = Vue.extend({
    template,
    vuex: {
        actions: {
            loadOperations,
            updateNodeFormField,
        },
        getters: {
            operations: getOperations,
            groupedOperations: getGroupedOperations,
        },
    },
    components: {
        'toolbox-component': ToolbarComponent,
        'diagram-component': DiagramComponent,
        'property-description-component': PropertyDescriptionComponent,
        
        'attribute-selector-component': ProjectionComponent,
        'integer-component': IntegerComponent,
        'decimal-component': DecimalComponent,
        'checkbox-component': CheckboxComponent,
        'dropdown-component': DropDownComponent,
        'range-component': RangeComponent, 
        'text-component': TextComponent,
        'textarea-component': TextAreaComponent

        /*
        'empty-properties-component': EmptyPropertiesComponent,
        'no-properties-component': {template: '', props: {node: null},},
        'publish-as-visualization-component': PublishAsVisualizationComponent,
        'transformation-component': TransformationComponent
        */

    },
    data() {
        return {
            currentComponent: 'no-properties-component',
            forms: [],
            filled: {},
            node: {operation: ''},
            title: 'Operations',
        }
    },
    ready() {
        this.init();
    },
    events: {
        'update-operations': function (operations) {
        },
        'update-form-field-value': function (field, value) {
            //console.debug(value, this.node);
            //console.debug(this.node.forms[field.name])
            let filled = this.node.forms[field.name];
            if (filled) {
                filled.value = value;
            }
        },
        'onclick-task': function (task) {
            /* An task (operation instance) was clicked in the diagram */ 
            this.node = task.node;
            //console.debug('Slug:', task.node.operation.slug, 
            //    slug2Component[task.node.operation.slug])
            // this.currentComponent = slug2Component[task.node.operation.slug];
            this.filled = task.node.forms;
            this.forms = task.node.operation.forms;
        },
    },
    methods: {
        init() {
            this.loadOperations();
            let elem = document.getElementById('menu-operations');
            PerfectScrollbar.initialize(elem, {
                wheelSpeed: 2,
                wheelPropagation: true,
                minScrollbarLength: 20
            });
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
