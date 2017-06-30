<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{$tc('titles.dataSource', 2)}}</h2>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        Basic information
                    </div>
                    <div class="panel-body">
                            <div class="col-md-6">
                                <label>{{$tc('common.name')}}: </label>
                                <input type="text" class="form-control" v-model="dataSource.name"/>
                            </div>
                            <div class="col-md-3">
                                <label>{{$tc('common.format')}}: </label>
                                <select class="form-control" v-model="dataSource.format">
                                    <option v-for="fmt in formats" v-bind:value="fmt">{{fmt}}</option>
                                </select>
                            </div>
                            <div class="col-md-3 text-right">
                                <small>{{ $t('common.enabled', {gender: 'male'}) }}</small>
                                <switches v-model="dataSource.enabled" type-bold="true" theme="bootstrap" color="primary"></switches>
                            </div>
                            <div class="col-md-12">
                                <label>{{$tc('common.description')}}:</label>
                                <textarea class="form-control" v-model="dataSource.description"></textarea>
                            </div>
                            <div class="col-md-3">
                                <label>Attribute delimiter (CSV only): </label>
                                <input type="text" class="form-control" style="width: 60px" v-model="dataSource.attribute_delimiter"/>
                            </div>
                            <div class="col-md-3">
                                <label>Record delimiter (CSV only): </label>
                                <input type="text" class="form-control" style="width: 60px" v-model="dataSource.record_delimiter"/>
                            </div>
                            <div class="col-md-12">
                                <button class="btn btn-primary" @click.stop="save"><span class="fa fa-save"></span> {{$tc('actions.save')}}</button>
                            </div>
                        </div>
                </div>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        {{$tc('common.attribute', 2)}}
                    </div>
                    <div class="panel-body">
                        <table class="table table-bordered table-stripped" v-if="dataSource.attributes && dataSource.attributes.length > 0">
                            <thead>
                                <tr>
                                    <th class="primary text-center">{{$tc('common.name')}}</th>
                                    <th class="primary text-center">{{$tc('common.type')}}</th>
                                    <th class="primary text-center">{{$tc('common.nullable')}}</th>
                                    <th class="primary text-center">{{$tc('common.size')}}</th>
                                    <th class="primary text-center">{{$tc('common.precision')}}</th>
                                    <th class="primary text-center">{{$tc('common.scale')}}</th>
                                    <th class="primary text-center">{{$tc('dataSourceDetail.missingRepresentation')}}</th>
                                    <th class="primary text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(attr, index) in dataSource.attributes" track-by="attr.id">
                                    <td><input v-model="attr.name" class="form-control"/></td>
                                    <td>
                                        <select class="form-control" v-model="attr.type">
                                            <option v-for="dt in dataTypes" v-bind:value="dt">{{dt}}</option>
                                        </select>
                                    </td>
                                    <td><switches v-model="attr.nullable" type-bold="true" theme="bootstrap" color="primary"></switches></td>
                                    <td class="col-xs-1"><input type="number" class="form-control" maxlenght="2" v-model="attr.size" min="0"/></td>
                                    <td class="col-xs-1"><input type="number" class="form-control" maxlenght="2" v-model="attr.precision" min="0"/></td>
                                    <td class="col-xs-1"><input type="number" class="form-control" maxlenght="2" v-model="attr.scale" min="0"/></td>
                                    <td><input class="form-control" v-model="attr.missing_representation" maxlength="200"/></td>
                                    <td>
                                        <button class="btn btn-xs" v-show="index !== 0"><span class="fa fa-chevron-up"></span></button>
                                        <button class="btn btn-xs" v-show="index !== dataSource.attributes.length -1"><span class="fa fa-chevron-down"></span></button>
                                        <button class="btn btn-xs"><span class="fa fa-remove"></span></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-else>
                           {{ $t("dataSourceDetail.noAttributes") }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        {{ $tc("common.permission", 2) }}
                    </div>
                    <div class="panel-body">
                        <table class="table table-bordered table-stripped" v-if="dataSource.permissions && dataSource.permissions.length > 0">
                            <thead>
                                <tr>
                                    <th class="primary col-md-1 text-center">{{ $t("common.userId") }}</th>
                                    <th class="primary text-center">{{ $t("common.userName") }}</th>
                                    <th class="primary text-center">{{ $t("common.userLogin") }}</th>
                                    <th class="primary text-center">{{ $tc("common.permission", 1) }}</th>
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
                            {{ $t("dataSourceDetail.noPermissions") }}
                        </div>
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
</style>
<script>
    import Vue from 'vue';
    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, limoneroUrl} from '../config';
    import Switches from 'vue-switches';
    const DataSourceDetailComponent = Vue.extend({
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
                dataSource: {},
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

                this.dataSource.id = id;

                let url = `${limoneroUrl}/datasources/${id}?token=${authToken}`;
                return Vue.http.get(url).then(function (response) {
                    self.dataSource = response.body;
                })
            },
            save() {
                let self = this;
                let url = `${limoneroUrl}/datasources/${this.dataSource.id}?token=${authToken}`;
                let headers = {};
                
                return Vue.http.patch(url, self.dataSource, headers).then(
                    (error) => {
                        console.debug(error);
                    },
                    (response) =>{
                        self.dataSource = response.body;
                    });
            }
        },
        mixins: [],
    });
    export default DataSourceDetailComponent;
</script>
