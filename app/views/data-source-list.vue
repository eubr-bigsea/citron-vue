<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Data Sources</h2>
            </div>
            <hr/>
            <div class="col-md-12">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                 Id <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-1" @click="sort('name')">
                                 Name <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('created')">
                                Created <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'updated'"></span>
                                </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ds in dataSources">
                            <td class="text-center">
                                <router-link :to="{name: 'data-source-detail', params: {id: ds.id }}">{{ds.id}}</router-link>
                            </td>
                            <td class="text-center">{{ds.name}}</td>
                            <td class="text-center">{{ formatDate(ds.created, 'DD-MM-YYYY HH:mm:ss') }}</td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-center">Showing {{pageData.pagination.page}} of {{pageData.pagination.pages}} pages</p>
                <nav>
                    <ul class="pager">
                        <li>
                            <router-link :to="{name: 'data-source-page', params: {page: page - 1 }, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== 1">Previous</router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'data-source-page', params: {page: page + 1}, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== pageData.pagination.pages">Next</router-link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import ListingMixin from '../components/mixins/listing-mixin';
    import MomentMixin from '../components/mixins/moment-mixin';
    import {
        limoneroUrl
    } from '../config';

    const DataSourceListComponent = Vue.extend({
        data() {
            return {
                dataSources: []
            };
        },
        /* Life-cycle */
        mounted: function() {
            this.performLoad();
        },
        /* Methods */
        methods: {
            getData(data) {
                //data['platform'] = this.platform;
            },
            paginate(ev) {
                ev.stopPropagation();
                return false;
            },
            load(parameters) {
                let self = this;
                this.$store.dispatch('updatePageParameters', {
                    page: 'data-source-list',
                    parameters
                });
                let url = `${limoneroUrl}/datasources?enabled=true`;
                let headers = {
                    'X-Auth-Token': '123456'
                }

                Vue.http.get(url, {
                    parameters,
                    headers
                }).then(response => {
                    self.dataSources = response.data;
                });
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
        mixins: [ListingMixin, MomentMixin],
        /* Events */
        watch: {
            '$route': function() {
                if (this.$route.params.page) {
                    this.page = parseInt(this.$route.params.page);
                    let data = {
                        fields: this.fields,
                        page: this.page,
                        size: 20,
                        platform: this.platform
                    };
                    this.load(data);
                }
            }
        }
    });
    export default DataSourceListComponent;
</script>