<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>{{ $tc('titles.dashboard', 2) }}</h2>
            </div>
            <div class="col-md-12" v-if="dashboards.pagination  && dashboards.pagination.total > 0">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                 {{ $tc('common.id') }} <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-7" @click="sort('name')">
                                 {{ $tc('common.title') }} <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'name'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('user_name')">
                                 {{ $tc('common.owner') }} <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'user_name'"></span>
                            </th>
                            <th class="primary text-center col-md-1">
                                {{ $tc('common.created') }}
                            </th>
                            <th class="col-md-1 primary text-center">{{$tc('common.action', 2) }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ds in dashboards.data">
                            <td class="text-center">
                                <router-link :to="{name: 'dashboard-detail', params: {id: ds.id }}">{{ds.id}}</router-link>
                            </td>
                            <td class="text-center">{{ds.title}}</td>
                            <td class="text-center">{{ds.user.name}}</td>
                            <td class="text-center">{{ formatDate(ds.created, 'DD-MM-YYYY HH:mm:ss') }}</td>
                            <td class="text-center">
                                <dropdown-component variant="btn-default" label="Edit" :link="resolve( {name: 'dashboard-detail', params: {id: ds.id }})">
                                    <li>
                                        <a href="" title="Remove" @click.prevent="remove(ds.id)">
                                            <span class="fa fa-trash-o"></span>
                                            </span> Remove
                                        </a>
                                    </li>
                                    <li>
                                        <router-link :to="{name: 'dashboard-show', params: { id: ds.id }}">
                                            <span class="fa fa-eye"></span> {{ $tc('actions.show') }}
                                        </router-link>
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
                            <router-link :to="{name: 'dashboard-page', params: {page: page - 1 }, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== 1">Previous</router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'dashboard-page', params: {page: page + 1}, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== pageData.pagination.pages">Next</router-link>
                        </li>
                    </ul>
                </nav>
            </div>
            <div v-else>
                <p>No {{ $tc('titles.dashboard', 2).toLowerCase() }} found.</p>
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
        caipirinhaUrl, authToken
    } from '../config';

    const DashboardListComponent = Vue.extend({
        data() {
            return {
                dashboards: []
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
            resolve(route){
                let r = this.$router.resolve(route);
                return r ? r.href : '';
            },
            paginate(ev) {
                ev.stopPropagation();
                return false;
            },
            load(params) {
                let self = this;
                this.$store.dispatch('updatePageParameters', {
                    page: 'dashboard-list',
                    params
                });
                let url = `${caipirinhaUrl}/dashboards`
                let headers = {
                    'X-Auth-Token': authToken
                }
                Vue.http.get(url, {
                    params,
                    headers
                }).then(response => {
                    self.dashboards = response.data;
                }).catch((response) => {
                    self.$root.$refs.toastr.defaultPosition = 'toast-bottom-full-width';
                    let msg = response.status === 0 
                        ? 'Could not contact server'
                        : `Server reported an error: ${response.statusText}`;

                    self.$root.$refs.toastr.e(msg);
                });
            },
            performLoad(reload, orderBy) {
                let saved = this.$store.getters.getPageParameters['dashboard-list'];
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
    export default DashboardListComponent;
</script>