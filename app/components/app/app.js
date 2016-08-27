import Vue from 'vue';
import template from './app-template.html';
import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';
import store from '../vuex/store';
import { loadOperations } from '../vuex/actions';
import { getOperations } from '../vuex/getters';

const AppComponent = Vue.extend({
    template,
    vuex: {
        actions: {
            loadOperations
        },
        getters: {
            operations: getOperations
        },
    },
    components: {
        'toolbox-component': ToolbarComponent,
        'diagram-component': DiagramComponent,
    },
    data() {
        return {
            title: 'Operations',
        }
    },
    ready() {
        this.init();
    },
    events: {
        'update-operations': function (operations) {
        },
    },
    methods: {
        init() {
            this.loadOperations();
        },
    },
    store
});

export default AppComponent;
