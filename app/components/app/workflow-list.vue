<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Workflows </h2>
                <hr/>
            </div>
            <div class="col-md-3">
                <label>Filter by platform:</label>
                <p>
                    <select class="form-control" v-model="platform" v-on:change="changePlatform">
                    <option value="spark">Spark</option>
                    <option value="mj">MJ</option>
                </select>
                </p>
            </div>
            <hr/>
            <div class="col-md-12">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Owner</th>
                            <th>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="wf in pageData.data">
                            <td>
                                <router-link :to="{name: 'editor', params: {id: wf.id }}">{{wf.id}}</router-link>
                            </td>
                            <td>{{wf.name}}</td>
                            <td>{{wf.user_name}}</td>
                            <td>{{wf.updated}} {{ moment() }}</td>
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
            }
        },
        computed: {
            pageData: function() {
                return this.$store.getters.getWorkflowPage;
            },
        },
        mounted: function() {
            this.performLoad();
        },
        methods: {
            moment,
            changePlatform() {
                this.performLoad(true)
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
                    let data = {
                        fields,
                        page: this.page,
                        size: 20,
                        platform: this.platform
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
            '$route': function() {
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