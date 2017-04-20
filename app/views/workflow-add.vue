<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Add Workflow</h2>
            </div>
            <form>
                <div class="col-md-offset-3 col-md-6">
                    <div class="form-group">
                        <label for="name">Workflow name:</label>
                        <input type="text" class="form-control" id="name" v-model="name">
                    </div>
                </div>
                <div class="col-md-offset-3 col-md-6">
                    <div class="form-group">
                        <label for="platform">Platform:</label>
                        <select class="form-control" id="platform" v-model="platform.id">
                            <option value="1">Spark</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-offset-3 col-md-6">
                    <div class="form-group">
                        <label for="userName">Your name:</label>
                        <input type="text" id="userName" class="form-control" v-model="user.name">
                    </div>

                    <button class="btn btn-success" @click="create"><span class="fa fa-save"></span> Create</button>
                    <a href="#/workflow/list" class="btn btn-danger">Cancel</a>
                </div>
            </form>
        </div>
</template>

<script>
    import Vue from 'vue';
    import moment from 'moment';

    import {standUrl, tahitiUrl, authToken, caipirinhaUrl} from '../config';
    const fields = 'id, name, user_name, updated';
    const WorkflowAddComponent = Vue.extend({
        data() {
            return {
                name: '',
                platform: { id: '1' },
                user: {
                    id: 1,
                    login: 'guest',
                    name: ''
                }
            }
        },
        computed: {
        },
        mounted: function () {
            this.$el.querySelector('#name').focus();
        },
        methods: {
            create() {
                let url = `${tahitiUrl}/workflows`;
                let token = '123456';

                let data = {
                    name: this.name,
                    platform: this.platform,
                    user: this.user,
                };
                let headers = {
                    'X-Auth-Token': token,
                    'Content-Type': 'application/json'
                };
                let self = this;
                Vue.http.post(url, data, { headers }).then(function (response) {
                    self.$root.$refs.toastr.s(
                        `Workflow '${response.data.name}' created`);
                    self.$router.push({ name: 'editor', 
                        params: { id: response.data.id } });
                }).catch(function (error) {
                    console.debug(error);
                });
                return false;
            }
        },
        watch: {
        }
    });
    export default WorkflowAddComponent;
</script>