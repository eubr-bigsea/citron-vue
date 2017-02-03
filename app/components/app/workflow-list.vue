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
                </select>
                </p>
            </div>
            <div class="col-md-9 pull-right text-right">
                <a href="#/workflows/add" class="btn btn-primary" role="button"><span class="fa fa-plus"></span> Add workflow</a>
            </div>
            <hr/>
            <div class="col-md-12">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th class="col-md-1 primary text-center">Options</th>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                Id <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-6" @click="sort('name')">
                                Name <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]"
                                    v-show="orderBy === 'name'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-3" @click="sort('user_name')">
                                Owner <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]"
                                    v-show="orderBy === 'user_name'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('updated')">
                                Updated <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]"
                                    v-show="orderBy === 'updated'"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="wf in pageData.data" :key="wf.id">
                            <td class="text-center">
                                <a href="" title="Remove" @click="remove">
                                    <span class="fa-stack fa-lg">
                                        <span class="fa fa-circle fa-stack-2x"></span>
                                        <span class="fa fa-trash-o fa-stack-1x  fa-inverse"></span>
                                    </span>
                                </a>
                                <router-link :to="{name: 'editor', params: {id: wf.id }}">
                                    <span class="fa-stack fa-lg">
                                        <span class="fa fa-circle fa-stack-2x"></span>
                                        <span class="fa fa-pencil fa-stack-1x fa-inverse"></span>
                                    </span>
                                </router-link>
                            </td>
                            <td class="text-center">
                                <router-link :to="{name: 'editor', params: {id: wf.id }}">{{wf.id}}</router-link>
                            </td>
                            <td>{{wf.name}}</td>
                            <td>{{wf.user_name}}</td>
                            <td class="text-center">{{ formatDate(wf.updated, 'DD-MM-YYYY HH:mm:ss') }}</td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-center">Showing {{pageData.pagination.page}} of {{pageData.pagination.pages}} pages</p>
                <nav>
                    <ul class="pager">
                        <li>
                            <router-link :to="{name: 'workflow-page', params: {page: page - 1 }}" v-show="pageData.pagination.page !== 1">Previous</router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'workflow-page', params: {page: page + 1 }}" v-show="pageData.pagination.page !== pageData.pagination.pages">Next</router-link>
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

    const fields = 'id, name, user_name, updated';
    const WorkflowListComponent = Vue.extend({
        data() {
            return {
                page: 1,
                platform: 'spark',
                asc: 'true',
                orderBy: 'name',
            }
        },
        computed: {
            pageData: function () {
                return this.$store.getters.getWorkflowPage;
            },
        },
        mounted: function () {
            this.performLoad();
        },
        methods: {
            formatDate(date, format) {
                return moment(date).format(format);
            },
            changePlatform() {
                this.performLoad(true)
            },
            remove() {
                console.debug('teste');
            },
            sort(orderBy) {
                this.orderBy = orderBy;
                this.performLoad(true, orderBy);
            },
            load(parameters) {
                this.$store.dispatch('updatePageParameters', {
                    page: 'workflow-list',
                    parameters
                });
                this.$store.dispatch('loadWorkflowPage', parameters);
            },
            performLoad(reload, orderBy) {
                let saved = this.$store.getters.getPageParameters['workflow-list'];
                if (this.$route.params.page || !saved || reload) {
                    if (!reload) {
                        this.page = parseInt(this.$route.params.page) || 1;
                    } else {
                        this.page = 1;
                    }
                    if (orderBy) {
                        this.asc = (this.asc === 'true') ? 'false' : 'true';
                    }
                    let data = {
                        fields,
                        page: this.page,
                        size: 20,
                        platform: this.platform,
                        sort: orderBy || '',
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
                    let data = {
                        fields,
                        page: this.page,
                        size: 20,
                        platform: this.platform
                    };
                    this.load(data);
                }
            }
        }
    });
    export default WorkflowListComponent;
</script>