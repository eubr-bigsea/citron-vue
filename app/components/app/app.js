import Vue from 'vue';
import template from './app-template.html';
import DiagramComponent from '../diagram/diagram';
import ToolbarComponent from '../toolbox/toolbox';
import store from '../vuex/store';
import { loadOperations } from '../vuex/actions';
import { getOperations, getGroupedOperations } from '../vuex/getters';
import PerfectScrollbar from 'perfect-scrollbar';

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
        'onclick-operation': function (x) {
            console.debug('Operation clicked', x, y)
        }
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
