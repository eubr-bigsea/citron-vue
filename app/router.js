import Vue from 'vue';
import VueRouter from 'vue-router';

import WorkflowListView from './views/workflow-list.vue';
import JobListView from './views/job-list.vue';
import DataSourceListView from './views/data-source-list.vue';
import DataSourceDetailView from './views/data-source-detail.vue';
import DataSourceUploadView from './views/data-source-upload.vue';
import DataSourcePrivacyView from './views/data-source-privacy.vue';


import JobDetailView from './views/job-detail.vue';
import JobResultComponent from './views/job-result.vue';
import WorkflowAddComponent from './views/workflow-add.vue';
import LoginComponent from './views/login.vue';

import PrivacyPolicyListComponent from './views/privacy-policy-list.vue';

import AppComponent from './components/app/app';
import eventHub from './components/app/event-hub';

import DiagramComponent from './components/diagram/diagram.vue';

const Dashboard = { template: '<div>Dashboard Page!!!!</div>' }

Vue.use(VueRouter)
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
        component: WorkflowListView,
        name: 'workflow-page',
        meta: { title: 'Workflow list' }
    },
    {
        path: '/workflows/list',
        component: WorkflowListView,
        name: 'workflow-list',
        meta: { title: 'Workflow list' }
    },

    {
        path: '/jobs/list/:page',
        component: JobListView,
        name: 'job-page',
        query: { sort: 'id' },
        meta: { title: 'Job list' }
    },
    {
        path: '/jobs/list',
        component: JobListView,
        name: 'job-list',
        meta: { title: 'Job list' }
    },
    {
        path: '/jobs/:id',
        component: JobDetailView,
        name: 'job-detail',
        meta: { title: 'Job result' },
        children: [
            {
                path: 'diagram',
                name: 'job-child-diagram',
                component: DiagramComponent
            },
            {
                path: 'result/:visualizationId',
                component: JobResultComponent,
            }
        ]
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
        component: DataSourceListView,
        meta: { title: 'Data sources' }
    },
    {
        path: '/data-source/add',
        name: 'data-source-add',
        component: DataSourceUploadView,
        meta: { title: 'Upload data source' }
    },
    {
        path: '/data-source/:id',
        component: DataSourceDetailView,
        name: 'data-source-detail',
        meta: { title: 'Data sources' }
    },
    {
        path: '/data-source/:id/privacy',
        component: DataSourcePrivacyView,
        name: 'data-source-privacy',
        meta: { title: 'Data sources' }
    },
    {
        path: '/data-source/list/:page',
        component: DataSourceListView,
        name: 'data-source-page',
        query: { sort: 'id' },
        meta: { title: 'Data sources' }
    },
    {
        path: '/privacy-policy/list',
        component: PrivacyPolicyListComponent,
        name: 'privacy-policy-list',
        meta: { title: 'Private policies' }
    },
    { path: '*', redirect: '/login' }
]

const router = new VueRouter({
    routes,
    mode: 'hash',
});
router.beforeEach(function(to, from, next) {
    if (eventHub)
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
export default router;