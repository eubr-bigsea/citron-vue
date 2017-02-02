<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <div class="panel  panel-primary panel-inverse">
                    <div class="panel-heading">
                        Add Workflow
                    </div>
                    <div class="panel-content">
                        <div class="container">
                        <div class="row">
                            <div class="col-md-6">
                                <label>Name:</label>
                                <input type="text" class="form-control">
                            </div>
                            <div class="col-md-3">
                                <label>Platform:</label>
                                <select class="form-control">
                                    <option value="spark">Spark</option>
                                </select>    
                            </div>
                            <div class="col-md-3">
                                <label>Your name:</label>
                                <input type="text" class="form-control">  
                            </div>
                            <hr/>
                            <div style="margin-top:30px" class="col-md-12">
                                <button class="btn btn-success"><span class="fa fa-save"></span> Create</button>
                                <a href="#/workflow/list" class="btn btn-danger">Cancel</a>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import moment from 'moment';

    const fields = 'id, name, user_name, updated';
    const WorkflowAddComponent = Vue.extend({
        data() {
            return {
                page: 1,
                platform: 'spark',
                asc: 'true',
                orderBy: 'name',
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
            formatDate(date, format) {
                return moment(date).format(format);
            },
            changePlatform() {
                this.performLoad(true)
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
    export default WorkflowAddComponent;
</script>