import Vue from 'vue';
import VueResource from 'vue-resource';
import AppComponent from './components/app/app';
import WorkflowListComponent from './components/app/workflow-list.vue';
import JobListComponent from './components/app/job-list.vue';
import JobDetailComponent from './components/app/job-detail.vue';
import WorkflowAddComponent from './components/app/workflow-add.vue';
import LoginComponent from './components/app/login.vue';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
import './components/diagram/diagram.scss';
import "bootstrap-sass/assets/stylesheets/_bootstrap.scss";
import './components/app/app.scss';
import store from './components/vuex/store'
import VueRouter from 'vue-router'
import VueProgressBar from 'vue-progressbar'
import Toastr from 'vue-toastr';

Vue.use(VueRouter)
Vue.use(VueResource);
Vue.use(VueProgressBar, {
    color: '#ed8',
    failedColor: '#874b4b',
    thickness: '5px',
    transition: {
        speed: '0.2s',
        opacity: '0.6s'
    },
    autoRevert: true,
    inverse: false
})
Vue.http.interceptors.push((request, next) => {
    Vue.prototype.$Progress.finish();
    Vue.prototype.$Progress.start();
    next((response) => {
        Vue.prototype.$Progress.finish();
    });
});

Vue.component('vue-toastr', Toastr);
Vue.config.async = false;

const Bar = { template: '<div>bar</div>' }
const Foo = { template: '<div>foo</div>' }
const Dashboard = { template: '<div>Dashboard Page!!!!</div>' }

/* Routes configuration */
const routes = [
    { path: '/workflows/add', component: WorkflowAddComponent, name: 'add-workflow' },
    { path: '/workflows/editor/:id', component: AppComponent, name: 'editor' },
    { path: '/workflows/list/:page', component: WorkflowListComponent, name: 'workflow-page' },
    { path: '/workflows/list', component: WorkflowListComponent, name: 'workflow-list' },

    { path: '/jobs/list/:page', component: JobListComponent, name: 'job-page',
        query: {sort: 'id'}},
    { path: '/jobs/list', component: JobListComponent, name: 'job-list' },
    { path: '/jobs/:id', component: JobDetailComponent, name: 'job-detail' },


    { path: '/login', component: LoginComponent, name: 'login' },
    { path: '/dashboard', component: Dashboard, name: 'dashboard' },

    { path: '/data-sources/list', component: Foo },
    { path: '*', redirect: '/workflows/list' }
]

const router = new VueRouter({
    routes,
    mode: 'hash',
});
router.beforeEach(function (to, from, next) {
    next();
    return 
    let auth = { state: { token: null } };
    if (to.name !== 'login' || true) {
        if (!auth.state.token) {
            next({ name: 'login' });
        }

        if (to.to.path === '/logout') {
            auth.actions.logout();
            next({ name: 'login' });
        }

        if (to.to.path === '/' || to.to.path === '/login') {
            next({ name: 'dashboard' });
        }
    }
    next();
});
/** */
new Vue({
    el: '#app',
    components: {
        'app-component': AppComponent,
        'toolbox-component': ToolboxComponent,
    },
    router,
    store,
}).$mount('#app');

Vue.config.errorHandler = function (err, vm) {
    console.debug('Erro no VUE', err, vm);
    return false;
}