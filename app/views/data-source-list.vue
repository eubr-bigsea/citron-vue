<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Data Sources</h2>
            </div>
            <div class="col-md-12" v-if="dataSources.pagination && dataSources.pagination.total > 0">
                <div class="pull-right">
                    <a href="#/data-source/add" class="btn btn-primary" role="button"><span class="fa fa-plus"></span> Upload a new data set</a>
                </div>

                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                 Id <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-1" @click="sort('name')">
                                 Name <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'name'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('user_name')">
                                 Owner <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'user_name'"></span>
                            </th>
                            <th class="primary text-center col-md-4">
                                Description
                            </th>
                            <th class="primary text-center col-md-1">
                                Permissions
                            </th>
                            <th class="primary text-center col-md-1">
                                Created
                            </th>
                            <th class="col-md-1 primary text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ds in dataSources.data">
                            <td class="text-center">
                                <router-link :to="{name: 'data-source-detail', params: {id: ds.id }}">{{ds.id}}</router-link>
                            </td>
                            <td class="text-center">{{ds.name}}</td>
                            <td class="text-center">{{ds.user_name}}</td>
                            <td class="text-center">{{ds.description}}</td>
                            <td class="text-center">
                                {{getPermissions(ds.permissions)}}
                            </td>
                            <td class="text-center">{{ formatDate(ds.created, 'DD-MM-YYYY HH:mm:ss') }}</td>
                            <td class="text-center">
                                <dropdown-component variant="btn-default" label="Edit" :link="resolve( {name: 'data-source-detail', params: {id: ds.id }})">
                                    <li>
                                        <a href="" title="Remove" @click.prevent="remove(ws.id)">
                                            <span class="fa fa-trash-o"></span>
                                            </span> Remove
                                        </a>
                                    </li>
                                    <li>
                                        <a href="" title="Execute" @click="">
                                            <span class="fa fa-play-circle-o"></span> Execute
                                        </a>
                                    </li>
                                </dropdown-component>
                            </td>
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
            <div v-else>
                <p>No data sources found.</p>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import ListingMixin from '../components/mixins/listing-mixin';
    import MomentMixin from '../components/mixins/moment-mixin';
    import DropdownComponent from '../components/ui/dropdown.vue';
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
        components: {
            'dropdown-component': DropdownComponent,
        },
        /* Methods */
        methods: {
            getPermissions(permissions){
                return permissions.map((p) => {
                    return p.permission;
                }).join(', ') || 'ALL';
            },
            resolve(route){
                let r = this.$router.resolve(route);
                return r ? r.href : '';
            },
            getData(data) {
                //data['platform'] = this.platform;
            },
            paginate(ev) {
                ev.stopPropagation();
                return false;
            },
            load(params) {
                let self = this;
                this.$store.dispatch('updatePageParameters', {
                    page: 'data-source-list',
                    params
                });
                let url = `${limoneroUrl}/datasources?enabled=true&simple=true`;
                let headers = {
                    'X-Auth-Token': '123456'
                }
                Vue.http.get(url, {
                    params,
                    headers
                }).then(response => {
                    self.dataSources = response.data;
                }).catch((response) => {
                    self.$root.$refs.toastr.defaultPosition = 'toast-bottom-full-width';
                    let msg = response.status === 0 
                        ? 'Could not contact server'
                        : `Server reported an error: ${response.statusText}`;

                    self.$root.$refs.toastr.e(msg);
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