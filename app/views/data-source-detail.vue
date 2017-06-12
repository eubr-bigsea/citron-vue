<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Data source - {{dataSource.name}}</h2>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        Basic information
                    </div>
                    <div class="panel-body">
                            <div class="col-md-4">
                                <label>Description:</label> {{dataSource.description}}<br/>
                                <label>Format: </label> {{dataSource.format}}
                            </div>
                            <div class="col-md-4">
                                <label>Created: </label> {{dataSource.created}}<br/>
                                <label>Owner: </label> {{dataSource.user_name}} (id: {{dataSource.user_id}})
                            </div>
                            <div class="col-md-4">
                                <label>Rows (est.): </label> {{dataSource.estimated_rows}}<br/>
                                <label>Size (est.): </label> {{dataSource.estimated_size_in_mega_bytes}} MB
                            </div>
                        </div>
                </div>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        Attributes
                    </div>
                    <div class="panel-body">
                        <table class="table table-bordered table-stripped" v-if="dataSource.attributes && dataSource.attributes.length > 0">
                            <thead>
                                <tr>
                                    <th class="primary text-center">Name</th>
                                    <th class="primary text-center">Type</th>
                                    <th class="primary text-center">Nullable</th>
                                    <th class="primary text-center">Size</th>
                                    <th class="primary text-center">Precision</th>
                                    <th class="primary text-center">Scale</th>
                                    <th class="primary text-center">Is feature?</th>
                                    <th class="primary text-center">Is label</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="attr in dataSource.attributes">
                                    <td>{{attr.name}}</td>
                                    <td>{{attr.type}}</td>
                                    <td>{{attr.nullable}}</td>
                                    <td>{{attr.size}}</td>
                                    <td>{{attr.precision}}</td>
                                    <td>{{attr.scale}}</td>
                                    <td>{{attr.feature}}</td>
                                    <td>{{attr.label}}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-else>
                            No attributes defined.
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        Permissions
                    </div>
                    <div class="panel-body">
                        <table class="table table-bordered table-stripped" v-if="dataSource.permissions && dataSource.permissions.length > 0">
                            <thead>
                                <tr>
                                    <th class="primary col-md-1 text-center">User Id</th>
                                    <th class="primary text-center">User name</th>
                                    <th class="primary text-center">Login</th>
                                    <th class="primary text-center">Permission</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in dataSource.permissions">
                                    <td class="text-center">{{p.user_id}}</td>
                                    <td>{{p.user_name}}</td>
                                    <td>{{p.login}}</td>
                                    <td>{{p.permission}}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-else>
                            No permissions defined.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
</style>
<script>
    import Vue from 'vue';
    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, limoneroUrl} from '../config';
    const DataSourceDetailComponent = Vue.extend({
        store,
        mounted: function () {
            this.performLoad()
        },
        components: {
        },
        /* Data */
        data() {
            return {
                dataSource: {}
            };
        },
        /* Methods */
        methods: {
            performLoad() {
                let self = this;
                let id = this.$route.params.id;

                this.dataSource.id = id;

                let url = `${limoneroUrl}/datasources/${id}?token=${authToken}`;
                return Vue.http.get(url).then(function (response) {
                    self.dataSource = response.body;
                })
            },
        },
        mixins: [],
    });
    export default DataSourceDetailComponent;
</script>
