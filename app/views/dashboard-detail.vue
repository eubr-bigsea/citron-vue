<template>
    <div class="container-fluid">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{ dashboard.title }}</h2>
            </div>
            <div class="col-md-12" v-for="visualization in dashboard.visualizations">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        {{visualization.title}}
                    </div>
                    <div class="panel-body">
                        {{visualization}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
    .vue-switcher--bold div {
        top: 0 !important;
    }
    .margin-top-10 {
        margin-top: 10px;
    }
</style>
<script>
    import Vue from 'vue';
    import {authToken, caipirinhaUrl} from '../config';
    import Switches from 'vue-switches';
    const DashboardComponent = Vue.extend({
        store,
        mounted: function () {
            this.performLoad()
        },
        components: {
            Switches
        },
        /* Data */
        data() {
            return {
                dashboard: {},
                dataTypes: ['CHARACTER', 'DOUBLE', 'DECIMAL', 'DATE',
                            'DATETIME', 'FLOAT','INTEGER', 'LONG',
                            'TEXT', 'TIME', 'TIMESTAMP', 'VECTOR'],
                formats: ['XML_FILE','NETCDF4','HDF5','SHAPEFILE','TEXT',
                        'CUSTOM','JSON','CSV','PICKLE']
            };
        },
        /* Methods */
        methods: {
            performLoad() {
                let self = this;
                let id = this.$route.params.id;

                this.dashboard.id = id;

                let url = `${caipirinhaUrl}/dashboards/${this.dashboard.id}`;
                let headers = {'X-Auth-Token': authToken};

                return Vue.http.get(url, {headers}).then(function (response) {
                    self.dashboard = response.body;
                })
            },
            save() {
                let self = this;
                let url = `${caipirinhaUrl}/dashboards/${this.dashboard.id}`;
                let headers = {'X-Auth-Token': authToken};
                
                return Vue.http.patch(url, self.dashboard, headers).then(
                    (response) =>{
                        //self.dashboard = response.body;
                        self.$root.$refs.toastr.s('Success');
                    },
                    (error) => {
                       self.$root.$refs.toastr.e(error);
                    });
            }
        },
        mixins: [],
    });
    export default DashboardComponent;
</script>
