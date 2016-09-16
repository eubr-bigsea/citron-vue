import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';

import template from './app-template.html';
import store from '../vuex/store';

import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';

import { loadOperations } from '../vuex/actions';
import { getOperations, getGroupedOperations } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, 
    EmptyPropertiesComponent, ProjectionComponent, 
    PropertyDescriptionComponent, PublishAsVisualizationComponent, 
    SplitComponent,
    TransformationComponent } 
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
            loadOperations
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
        'empty-properties-component': EmptyPropertiesComponent,
        'no-properties-component': {template: '', props: {node: null},},
        'publish-as-visualization-component': PublishAsVisualizationComponent,
        'transformation-component': TransformationComponent
    },
    data() {
        return {
            title: 'Operations',
            node: {operation: ''},
            currentComponent: 'no-properties-component'
        }
    },
    ready() {
        this.init();
    },
    events: {
        'update-operations': function (operations) {
        },
        'onclick-operation': function (operationComponent) {
            this.node = operationComponent.node;
            console.debug('Slug:', operationComponent.node.operation.slug, 
                slug2Component[operationComponent.node.operation.slug])
            this.currentComponent = slug2Component[operationComponent.node.operation.slug];
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
