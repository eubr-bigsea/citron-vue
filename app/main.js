import Vue from 'vue';
import VueResource from 'vue-resource';
import AppComponent from './components/app/app';
import DiagramComponent from './components/diagram/diagram';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
//import $http from "./customAjax";
import './components/diagram/diagram.scss';
import "bootstrap-sass/assets/stylesheets/_bootstrap.scss";
//import "bootstrap-sass/assets/javascripts/bootstrap";
//import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.scss'
import './components/app/app.scss';

Vue.use(VueResource);
Vue.config.async = false;

new Vue({
    el: '#app',
    data: {
        title: 'Toolbox',
        operations: [],
        currentComponent: null,
    },
    components: {
        'app-component': AppComponent,
        'toolbox-component': ToolboxComponent,
        'diagram-component': DiagramComponent,
    },
    ready() {

    },
    events: {
    
    }
});
