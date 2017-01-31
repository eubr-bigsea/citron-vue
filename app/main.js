import Vue from 'vue';
import VueResource from 'vue-resource';
import AppComponent from './components/app/app';
import WorkflowListComponent from './components/app/workflow-list.vue';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
import './components/diagram/diagram.scss';
import "bootstrap-sass/assets/stylesheets/_bootstrap.scss";
import './components/app/app.scss';
import store from './components/vuex/store'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
Vue.use(VueResource);
Vue.config.async = false;

const Bar = { template: '<div>bar</div>' }
const Foo = { template: '<div>foo</div>' }

const routes = [
  { path: '/workflows/editor/:id', component: AppComponent, name: 'editor'},
  { path: '/workflows/list/:page', component: WorkflowListComponent, name: 'workflow-page' },
  { path: '/workflows/list', component: WorkflowListComponent, name: 'workflow-list' },
  { path: '/jobs/list', component: Bar },
  { path: '/data-sources/list', component: Foo },
  {path: '*', redirect: '/workflows/list'} 
]

const router = new VueRouter({
  routes,
  mode: 'hash',
})
new Vue({
    el: '#app',
    components: {
        'app-component': AppComponent,
        'toolbox-component': ToolboxComponent,
    },
    router,
    store,
}).$mount('#app');
