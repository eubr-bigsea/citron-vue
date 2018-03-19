<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Workflows </h2>
                <hr/>
            </div>
            <div class="col-md-3">
                <label>Working on platform:</label>
                <p>
                    <select class="form-control" v-model="platform" v-on:change="changePlatform">
                        <option value="spark">Spark</option>
                        <option value="mj">MJ</option>
                        <option value="compss">COMPSs</option>
                    </select>
                </p>
            </div>
            <div class="col-md-6">
                <label>Name</label>
                <p>
                    <input type="text" class="form-control" ref="workflowName" v-model="name" v-on:keyup="filterByName"/>
                </p>
            </div>
            <div class="col-md-3 pull-right text-right">
                <a href="#/workflows/add" class="btn btn-primary" role="button">
                    <span class="fa fa-plus"></span> Add workflow</a>
            </div>
            <hr/>
            <div class="col-md-12">
                <table class="table table-hover table-bordered table-condensed">
                    <thead>
                        <tr>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                Id
                                <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-6" @click="sort('name')">
                                Name
                                <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]"
                                    v-show="orderBy === 'name'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('user_name')">
                                Owner
                            </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('updated')">
                                Updated
                                <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]"
                                    v-show="orderBy === 'updated'"></span>
                            </th>
                            <th class="col-md-2 primary text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="wf in pageData.data" :key="wf.id">
                            <td class="text-center">
                                <router-link :to="{name: 'editor', params: {id: wf.id }}">{{wf.id}}</router-link>
                            </td>
                            <td>{{wf.name}}</td>
                            <td>{{wf.user_name}}</td>
                            <td class="text-center">{{ formatDate(wf.updated, 'DD-MM-YYYY HH:mm:ss') }}</td>
                            <td class="text-center">
                                <dropdown-component variant="btn-default" label="Edit" :link="resolve( {name: 'editor', params: {id: wf.id }})">
                                    <li>
                                        <a href="" title="Remove" @click.prevent="remove(wf.id)">
                                            <span class="fa fa-trash-o"></span>
                                            </span> Remove
                                        </a>
                                    </li>
                                    <li>
                                        <a href="" title="Execute" @click="">
                                            <span class="fa fa-play-circle-o"></span> Execute
                                        </a>
                                    </li>
                                </dropdown-component>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-center">Showing {{pageData.pagination.page}} of {{pageData.pagination.pages}} pages</p>
                <nav>
                    <ul class="pager">
                        <li>
                            <router-link :to="{name: 'workflow-page', params: {page: page - 1, sort: orderBy, asc: asc, name: name}}" v-show="pageData.pagination.page !== 1">Previous</router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'workflow-page', params: {page: page + 1, sort: orderBy, asc: asc, name: name }}" v-show="pageData.pagination.page !== pageData.pagination.pages">Next</router-link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import moment from 'moment';
    import DropdownComponent from '../components/ui/dropdown.vue';
    import { standUrl, tahitiUrl, authToken, caipirinhaUrl } from '../config';

    const fields = 'id, name, user_name, updated';
    const WorkflowListComponent = Vue.extend({
        data() {
            return {
                page: 1,
                platform: 'spark',
                asc: 'true',
                orderBy: 'name',
                name: '%%%'
            }
        },
        components: {
            'dropdown-component': DropdownComponent,
        },
        computed: {
            pageData: function () {
                return this.$store.getters.getWorkflowPage;
            },
        },
        mounted: function () {
            this.page = parseInt(this.$route.params.page);
            this.orderBy = this.$route.params.sort;
            this.asc = this.$route.params.asc;

            this.performLoad();
            this.$refs.workflowName.focus();
        },
        methods: {
            filterByName: _.debounce(function(e){
                this.$router.replace({
                    name: 'workflow-page',
                    params: { page: 1, sort: this.orderBy || 'id', 
                    asc: this.asc || 'true', name: this.name || '%'}
                })}, 500),
            resolve(route) {
                let r = this.$router.resolve(route);
                return r ? r.href : '';
            },
            formatDate(date, format) {
                return moment(date).format(format);
            },
            changePlatform() {
                this.performLoad(true)
            },
            remove(id) {
                if (confirm(`Remove workflow ${id}?`)) {
                    let self = this;
                    let url = `${tahitiUrl}/workflows/${id}`;
                    let headers = {
                        'X-Auth-Token': authToken,
                        'Content-Type': 'text/html'
                    }
                    Vue.http.delete(url, { headers }).then(response => {
                        self.performLoad();
                    });
                }
                return false;
            },
            sort(orderBy) {
                this.asc = (this.asc === 'true') ? 'false' : 'true';
                this.$router.replace({
                    name: 'workflow-page',
                    params: { page: 1, sort: orderBy, asc: this.asc, name: this.name }
                })
                this.orderBy = orderBy;
                // this.performLoad(true);
            },
            load(parameters) {
                this.$store.dispatch('updatePageParameters', {
                    page: 'workflow-list',
                    parameters
                });
                this.$store.dispatch('loadWorkflowPage', parameters);
            },
            performLoad(reload) {
                let saved = this.$store.getters.getPageParameters['workflow-list'];
                if (this.$route.params.page || !saved || reload) {
                    if (!reload) {
                        this.page = parseInt(this.$route.params.page) || 1;
                    } else {
                        this.page = 1;
                    }
                    if (this.orderBy) {
                        // this.asc = (this.asc === 'true') ? 'false' : 'true';
                    }
                    let data = {
                        fields,
                        page: this.page,
                        size: 10,
                        platform: this.platform,
                        sort: this.orderBy || '',
                        asc: this.asc,
                    }
                    this.load(data);
                } else {
                    this.page = saved.page;
                    this.platform = saved.platform || 'spark';
                    this.load(saved);
                }
            }
        },
        watch: {
            '$route': function () {
                if (this.$route.params.page) {
                    this.page = parseInt(this.$route.params.page);
                    this.orderBy = this.$route.params.sort;
                    this.asc = this.$route.params.asc;
                    this.name = this.$route.params.name;
                    let data = {
                        fields,
                        page: this.page,
                        size: 10,
                        platform: this.platform,
                        sort: this.orderBy,
                        asc: this.asc,
                        name: this.name
                    };
                    this.load(data);
                }
            }
        }
    });
    export default WorkflowListComponent;
</script>