<template>
    <div class="container-fluid">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{dashboard.title}}</h2>
            </div>
            <div class="col-md-12" v-for="visualization in dashboard.visualizations">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        {{visualization.title || 'No title'}}
                    </div>
                    <div class="panel-body">
                        {{visualization.data}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue';
    import {caipirinhaUrl, authToken} from '../config';

    const DashboardShowView = Vue.extend({
        store,
        mounted: function () {
            this.performLoad()
        },
        components: {
        },
        /* Data */
        data() {
            return {
                dashboard: {}
            };
        },
        /* Methods */
        methods: {
            performLoad() {
                let self = this;
                let id = this.$route.params.id;

                this.dashboard.id = id;

                let url = `${caipirinhaUrl}/dashboards/${id}`;
                let headers = {
                    'X-Auth-Token': authToken
                }
                let params = {};
                return Vue.http.get(url, {
                    params,
                    headers
                }).then(function (response) {
                    self.dashboard = response.body;
                })
            },
        },
    });
    export default DashboardShowView;
</script>
