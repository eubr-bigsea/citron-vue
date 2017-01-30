import Vue from 'vue';
import VueResource from 'vue-resource';
import AppComponent from './components/app/app';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
import './components/diagram/diagram.scss';
import "bootstrap-sass/assets/stylesheets/_bootstrap.scss";
import './components/app/app.scss';
import store from './components/vuex/store'

Vue.use(VueResource);
Vue.config.async = false;

new Vue({
    el: '#app',
    components: {
        'app-component': AppComponent,
        'toolbox-component': ToolboxComponent,
    },
    store
});
