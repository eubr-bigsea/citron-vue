<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{$tc('titles.globalPrivacyPolicy', 2)}}</h2>
            </div>
            <div class="col-md-12">
                <div class="pull-right">
                    <button class="btn btn-primary" @click.stop="add" :disabled="editing"><span class="fa fa-plus"></span> 
                        {{$t('actions.add', {type: $tc('titles.globalPrivacyPolicy').toLowerCase() })}}
                    </button>
                </div>
                <table class="table table-bordered table-stripped" v-if="attributes && attributes.length > 0">
                    <thead>
                        <tr>
                            <th class="primary text-center col-md-2">{{ $tc('common.attribute')}}</th>
                            <th class="primary text-center col-md-2">{{ $t('privacy.anonymizationTechnique') }}</th>
                            <th class="primary text-center col-md-2">{{ $tc('privacy.privacyType') }}</th>
                            <th class="primary text-center col-md-3">{{ $tc('privacy.hierarchy') }}</th>
                            <th class="primary text-center col-md-2">{{ $tc('titles.action', 2) }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(attr, index) in attributes" track-by="attr.id">
                            <td v-if="attr.editing"><input class="form-control" v-model="attr.attribute_name" maxlength="100"/></td>
                            <td v-if="attr.editing">
                                <select class="form-control" v-model="attr.anonymization_technique">
                                    <option v-for="t in anonymization_technique">
                                        {{t}}
                                    </option>
                                </select>
                            </td>
                            <td v-if="attr.editing">
                                <select class="form-control" v-model="attr.privacy_type">
                                    <option v-for="t in privacy_type">
                                        {{t}}
                                    </option>
                                </select>
                            </td>
                            <td v-if="attr.editing">
                                <textarea class="form-control" v-model="attr.hierarchy"></textarea>
                            </td>
                            <td v-if="attr.editing" class="text-center">
                                <button class="btn btn-xs btn-primary" @click.stop="save(attr)"><span class="fa fa-save"></span> {{ $tc('actions.save') }}</button>
                                <button class="btn btn-xs btn-default" @click.stop="cancel(attr)">{{ $tc('actions.cancel') }}</button>
                            </td>
                            <td v-if="!attr.editing">{{attr.attribute_name}}</td>
                            <td v-if="!attr.editing">{{attr.anonymization_technique}}</td>
                            <td v-if="!attr.editing">{{attr.privacy_type}}</td>
                            <td v-if="!attr.editing">{{attr.hierarchy}}</td>
                            <td v-if="!attr.editing" class="text-center">
                                <button class="btn btn-xs btn-success" @click.stop="edit(attr)"><span class="fa fa-edit"></span> {{ $tc('actions.edit') }}</button>
                                <button class="btn btn-xs btn-danger" @click.stop="remove(attr)">{{ $tc('actions.delete') }}</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
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
    const PrivacyPolicyListComponent = Vue.extend({
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
                editing: false,
                attributes: {},
                current: {},
                anonymization_technique: ['ENCRYPTION', 'GENERALIZATION', 'MASK', 
                    'SUPPRESSION', 'NO_TECHNIQUE'],
                privacy_type: ['SENSITIVE', 'IDENTIFIER', 'NON_SENSITIVE', 
                    'QUASI_IDENTIFIER'],
            };
        },
        /* Methods */
        methods: {
            select(attr) {
                this.current = attr;
            },
            performLoad() {
                let self = this;

                let url = `${limoneroUrl}/privacy?token=${authToken}`;
                return Vue.http.get(url).then(function (response) {
                    response.body.data.forEach((attr) => {
                        attr.editing = false;
                    });
                    self.attributes = response.body.data;
                })
            },
            add(){
                let pos = this.attributes.push(
                    {id: 0, attribute_name: '', 
                        anonymization_technique: '', privacy_type: '',
                        hierarchy: ''});
                this.edit(this.attributes[pos - 1]);
            },
            cancel(attr){
                if (this.current){
                    if (this.current.id === 0){  //new
                        this.attributes.splice(this.attributes.length - 1, 1);
                    } else {
                        Object.assign(attr, attr.original);
                        delete attr.original;
                    }
                    this.current.editing = false;
                    this.current = null;
                }
                this.editing = false;
            },
            remove(attr){
                let self = this;
                
                if (confirm(this.$t('messages.confirmRemove'))){
                    let url = `${limoneroUrl}/privacy?token=${authToken}`;
                    let headers = {};

                    return Vue.http.delete(url, {body: attr}, headers).then(
                        (response) =>{
                            let inx = self.attributes.indexOf(attr);
                            self.attributes.splice(inx, 1);
                            attr.editing = false;
                            self.editing = false;
                        },
                        (error) => {
                            console.debug(error);
                        });
                }
            },
            edit(attr){
                this.editing = true;
                if (this.current){
                    this.current.editing = false;
                }
                this.current = attr;
                this.current.editing = true;
                attr.original = Object.assign({}, attr);
            },
            save(attr) {
                let self = this;
                
                let url = `${limoneroUrl}/privacy?token=${authToken}`;
                let headers = {};

                return Vue.http.patch(url, attr, headers).then(
                    (response) =>{
                        Object.assign(attr, response.data);
                        attr.editing = false;
                        self.editing = false;
                    },
                    (error) => {
                        console.debug(error);
                    });
            }
        },
        mixins: [],
    });
    export default PrivacyPolicyListComponent;
</script>
