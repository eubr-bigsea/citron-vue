import Vue from 'vue';
import VueResource from 'vue-resource';

import AppComponent from './components/app/app';
import WorkflowListComponent from './components/app/workflow-list.vue';
import JobListComponent from './components/app/job-list.vue';
import DataSourceListComponent from './components/app/data-source-list.vue';

import JobDetailComponent from './components/app/job-detail.vue';
import WorkflowAddComponent from './components/app/workflow-add.vue';
import LoginComponent from './components/app/login.vue';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
import eventHub from './components/app/event-hub';

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
let requestCounter = 0;

Vue.http.interceptors.push((request, next) => {
    /*if (requestCounter === 0){
        Vue.prototype.$Progress.start(1000*30);
    } else {
        Vue.prototype.$Progress.increase(100);
    }*/
    document.querySelector('.page-overlay').style.visibility = 'visible';
    requestCounter++;
    next((response) => {
        requestCounter--;
        if (requestCounter === 0) {
            //Vue.prototype.$Progress.finish();
            document.querySelector('.page-overlay').style.visibility = 'hidden';
        }
    });
});

Vue.component('vue-toastr', Toastr);
Vue.config.async = false;

const Bar = { template: '<div>bar</div>' }
const Foo = { template: '<div>foo</div>' }
const Dashboard = { template: '<div>Dashboard Page!!!!</div>' }

/* Routes configuration */
const routes = [{
        path: '/workflows/add',
        component: WorkflowAddComponent,
        name: 'add-workflow',
        meta: { title: 'New workflow' }
    },
    {
        path: '/workflows/editor/:id',
        component: AppComponent,
        name: 'editor',
        meta: { title: 'Edit workflow' }
    },
    {
        path: '/workflows/list/:page',
        component: WorkflowListComponent,
        name: 'workflow-page',
        meta: { title: 'Workflow list' }
    },
    {
        path: '/workflows/list',
        component: WorkflowListComponent,
        name: 'workflow-list',
        meta: { title: 'Workflow list' }
    },

    {
        path: '/jobs/list/:page',
        component: JobListComponent,
        name: 'job-page',
        query: { sort: 'id' },
        meta: { title: 'Job list' }
    },
    {
        path: '/jobs/list',
        component: JobListComponent,
        name: 'job-list',
        meta: { title: 'Job list' }
    },
    {
        path: '/jobs/:id',
        component: JobDetailComponent,
        name: 'job-detail',
        meta: { title: 'Job result' }
    },


    {
        path: '/login',
        component: LoginComponent,
        name: 'login',
        meta: { title: 'Login' }
    },
    {
        path: '/dashboard',
        component: Dashboard,
        name: 'dashboard',
        meta: { title: 'Dashboard' }
    },

    {
        path: '/data-source/list',
        name: 'data-source-list',
        component: DataSourceListComponent,
        meta: { title: 'Data sources' }
    },
    {
        path: '/data-source/:id',
        component: DataSourceListComponent,
        name: 'data-source-detail',
        meta: { title: 'Data sources' }
    },
    {
        path: '/data-source/list/:page',
        component: DataSourceListComponent,
        name: 'data-source-page',
        query: { sort: 'id' },
        meta: { title: 'Data sources' }
    },
    { path: '*', redirect: '/workflows/list' }
]

const router = new VueRouter({
    routes,
    mode: 'hash',
});
router.beforeEach(function(to, from, next) {
    eventHub.$emit('route-change', to, from);
    if (to.meta.title) {
        document.title = to.meta.title;
    }
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

Vue.config.errorHandler = function(err, vm) {
    console.debug('Erro no VUE', err, vm);
    return false;
}