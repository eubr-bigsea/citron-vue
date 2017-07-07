<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{$tc('dataSource.privacy', 2)}}</h2>
            </div>
            <div class="col-md-12">
                <div class="panel panel-primary">
                    <div class="panel-body">
                        <div class="col-md-9">
                            <label>{{$tc('titles.dataSource')}}: </label>
                                {{dataSource.name}}
                        </div>
                        <div class="col-md-3 text-right">
                            <small>{{ $t('dataSource.privacyAware') }}</small>
                            <switches v-model="dataSource.privacy_aware" type-bold="true" theme="bootstrap" color="primary"></switches>
                        </div>

                        <table class="table table-bordered table-stripped" v-if="dataSource.attributes && dataSource.attributes.length > 0">
                            <thead>
                                <tr>
                                    <th class="primary text-center col-md-1">{{$tc('common.attribute')}}</th>
                                    <th class="primary text-center col-md-3">{{ $tc('privacy.anonymizationTechnique') }}</th>
                                    <th class="primary text-center col-md-2">{{ $tc('privacy.privacyType') }}</th>
                                    <th class="primary text-center col-md-2">{{ $tc('privacy.attributePrivacyGroup') }}</th>
                                    <th class="primary text-center col-md-4">{{ $tc('privacy.hierarchy') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(attr, index) in dataSource.attributes" track-by="attr.id">
                                    <td>{{attr.name}}</td>
                                    <td>
                                        <select class="form-control" v-model="attr.attribute_privacy.anonymization_technique">
                                            <option v-for="t in anonymization_technique">
                                                {{t}}
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <select class="form-control" v-model="attr.attribute_privacy.privacy_type">
                                            <option v-for="t in privacy_type">
                                                {{t}}
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <select class="form-control" v-model="attr.attribute_privacy.attribute_privacy_group_id">
                                            <option v-for="t in attributeGroups" :value="t.id">
                                                {{t.name}}
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <textarea class="form-control" v-model="attr.attribute_privacy.hierarchy"></textarea>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="pull-right">
                            <button class="btn btn-primary" @click.stop="save"><span class="fa fa-save"></span> {{$tc('actions.save')}}</button>
                            <router-link :to="{name: 'data-source-list'}" class="btn btn-default">{{$tc('actions.cancel')}}</router-link>
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
    .privacy-item{
        padding-bottom: 10px;
        margin: 20px 0px;
        overflow: auto;
        border-bottom: 1px solid #ccc;
    }
</style>
<script>
    import Vue from 'vue';
    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, limoneroUrl} from '../config';
    import Switches from 'vue-switches';
    const DataSourcePrivacyComponent = Vue.extend({
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
                current: {},
                anonymization_technique: ['ENCRYPTION', 'GENERALIZATION', 'MASK', 
                    'SUPPRESSION', 'NO_TECHNIQUE'],
                privacy_type: ['SENSITIVE', 'IDENTIFIER', 'NON_SENSITIVE', 
                    'QUASI_IDENTIFIER'],
                attributeGroups: {},
            };
        },
        /* Methods */
        methods: {
            select(attr) {
                this.current = attr;
            },
            performLoad() {
                let self = this;
                let id = this.$route.params.id;

                this.dataSource.id = id;

                let url = `${limoneroUrl}/datasources/${id}/privacy?token=${authToken}`;
                return Vue.http.get(url).then(function (response) {
                    response.body.data.attributes.forEach((attr) => {
                        if (attr.attribute_privacy === null) {
                            attr.attribute_privacy = {
                                anonymization_technique: 'NO_TECHNIQUE',
                                privacy_type: 'NON_SENSITIVE',
                                hierarchy: '*',
                            };
                        }
                        attr.attribute_privacy.attribute_name = attr.name;
                    });
                    self.dataSource = response.body.data;

                    let urlGroups = `${limoneroUrl}/privacy/attribute-groups?token=${authToken}`;
                    Vue.http.get(urlGroups).then((responseGroups) => {
                        self.attributeGroups = responseGroups.body;
                    });
                })
            },
            save() {
                let self = this;
                let url = `${limoneroUrl}/datasources/${this.dataSource.id}/privacy?token=${authToken}`;
                let headers = {};
                
                return Vue.http.patch(url, self.dataSource, headers).then(
                     (response) =>{
                        //self.dataSource = response.body;
                        self.$root.$refs.toastr.s('Success');
                    },
                    (error) => {
                       self.$root.$refs.toastr.e(error.body.message);
                    });
            }
        },
        mixins: [],
    });
    export default DataSourcePrivacyComponent;
</script>
