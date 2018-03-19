<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Jobs</h2>
            </div>
            <hr/>
            <div class="col-md-12">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th class="sortable primary text-center col-md-1" @click="sort('status')">
                                 Status <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                            </th>
                            <th class="sortable primary text-center col-md-1" @click="sort('id')">
                                 Id <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'id'"></span>
                                 </th>
                            <th class="sortable primary text-center col-md-3" @click="sort('workflow_id')">
                                Workflow <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'name'"></span>
                                </th>
                            <th class="sortable primary text-center col-md-3" @click="sort('name')">
                                Name <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'name'"></span>
                                </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('user_name')">
                                User <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'user_name'"></span>
                                </th>
                            <th class="sortable primary text-center col-md-2" @click="sort('created')">
                                Created <span class="fa" :class="['fa-' + (this.asc === 'false' ? 'sort-up': 'sort-down')]" v-show="orderBy === 'updated'"></span>
                            </th>
                            <th class="primary text-center col-md-1">&nbsp;</th>

                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="job in pageData.data">
                            <td :class="'text-center ' + job.status.toLowerCase()">{{job.status}}</td>
                            <td class="text-center">
                                <router-link :to="{name: 'job-child-diagram', params: {id: job.id }}">{{job.id}}</router-link>
                            </td>
                            <td class="text-center">{{job.workflow_id}} - {{job.workflow_name}}
                                <router-link :to="{name: 'editor', params: {id: job.workflow_id }}"><span class="fa fa-external-link-square"></span></router-link>
                            </td>
                            <td>
                                {{job.name}} 
                            </td>
                            <td>{{job.user_name}}</td>
                            <td class="text-center">{{ formatDate(job.created, 'DD-MM-YYYY HH:mm:ss') }}</td>
                            <td class="text-center">
                                <dropdown-component variant="btn-default">
                                    <li>
                                        <a href="" title="Remove" @click.prevent="remove(job.id)">
                                            <span class="fa fa-trash-o"></span>
                                            </span> Remove
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
                            <router-link :to="{name: 'job-page', params: {page: page - 1 }, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== 1">Previous</router-link>
                        </li>
                        <li>
                            <router-link :to="{name: 'job-page', params: {page: page + 1}, query:{sort: orderBy, asc: asc }}" @click.native="paginate" v-show="pageData.pagination.page !== pageData.pagination.pages">Next</router-link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</template>
<style>
    .completed {
        background-color: seagreen;
        color: white;
    }
    .running {
        background-color: dodgerblue;
        color: white;
    }
    .interrupted {
        background-color: black;
        color: white;
    }
    .canceled {
        background-color: darkgray;
        color: white;
    }
    .waiting {
        background-color: #aaa;
        color: black;
    }
    .error {
        background-color: red;
        color: white;
    }
    .btn-group {
        display: flex;
    }

</style>
<script>
    import Vue from 'vue';
    import ListingMixin from '../components/mixins/listing-mixin';
    import MomentMixin from '../components/mixins/moment-mixin';
    import DropdownComponent from '../components/ui/dropdown.vue';
    import { standUrl, authToken} from '../config';
    const JobListComponent = Vue.extend({
        data(){
            return {
                fields: 'id, name, created, status, user_name, workflow_name, workflow_id'
            };
        },
        components: {
            'dropdown-component': DropdownComponent,
        },
        /* Life-cycle */
        mounted: function () {
            this.performLoad();
            this.$store.dispatch('connectWebSocket');
        },
        /* Methods */
        methods: {
            remove(id){
                if (confirm(`Remove job ${id}?`)) {
                    let self = this;
                    let url = `${standUrl}/jobs/${id}`;
                    let headers = {
                        'X-Auth-Token': authToken,
                        'Content-Type': 'text/html'
                    }
                    Vue.http.delete(url, { headers }).then(response => {
                        self.performLoad();
                         self.$root.$refs.toastr.s(response.body.message);
                        },
                        (error) => {
                            self.$root.$refs.toastr.e(error.body.message);
                        }
                    );
                }
                return false;
            },
            changePlatform() {
                this.performLoad(true)
            },
            getData(data){
                //data['platform'] = this.platform;
            },
            paginate(ev){
                ev.stopPropagation();
                return false;
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
    export default JobListComponent;
</script>