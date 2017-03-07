<template>
    <div class="container-fluid">
        <div class="row xsmall-padding">
            <div class="col-md-12">
                <h2>Job #{{job.id}} :: Workflow #{{job.workflow.id}} - {{job.workflow.name}}
                </h2>
                <router-link :to="{name: 'editor', params: {id: job.workflow.id }}"><span class="fa fa-edit"></span> Edit workflow</router-link>
                <hr/>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-md-12">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                Job
                            </div>
                            <div class="panel-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <p>
                                            <strong>User:</strong> {{job.user.id}} - {{job.user.name}}
                                        </p>
                                        <p>
                                        <strong>Cluster: </strong> {{job.cluster.id}} - {{job.cluster.name}}
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <p>
                                            <strong>Created:</strong> {{formatDate(job.created, 'DD-MM-YYYY HH:mm:ss')}}
                                        </p>
                                        <p>
                                            <strong>Started:</strong> {{formatDate(job.started, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                                        </p>
                                        <p>
                                            <strong>Finished:</strong> {{formatDate(job.finished, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12" v-if="job.results">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                Job results
                            </div>
                            <div class="panel-body">
                                <div class="col-md-2 text-center result-item" v-for="result in job.results">
                                    <a :href="computeLink(result)" class="button result">
                                        <span class="fa fa-3x" :class="getOperationIcon(result.operation.id)"></span>
                                        <br/>
                                        {{result.title}}<br/>
                                        <small>{{result.type}}</small>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="panel panel-primary panel-diagram">
                            <div class="panel-heading">
                                Job messages output
                            </div>
                            <div class="panel-body  overflow">
                                <p>
                                    <strong>Status:</strong> {{job.status}}
                                </p>
                                <p :visible="job.status_text !== ''">
                                    <em>{{job.status_text}}</em>
                                </p>
                                <table class="table table-hover table-bordered table-condensed small">
                                    <tbody>
                                        <tr class="task-status" v-for="step in job.steps" :id="'log-' + step.task.id" @mouseover="selectTask(step.task.id)" @mouseout="deselectTask(step.task.id)">
                                            <td class="col-md-2 text-center">
                                                {{step.status}}
                                            </td>
                                            <td class="col-md-2 text-center">
                                                {{getOperationName(step.operation.id)}}
                                            </td>
                                            <td class="col-md-1 text-center">{{formatDate(step.date, 'DD-MM-YYYY HH:mm:ss')}}</td>
                                            <td class="col-md-7">
                                                <span v-if="step.logs.length === 0">
                                                    No log information
                                                </span>
                                                <transition-group name="log" tag="p" v-else>
                                                    <p v-for="log in step.logs" v-bind:key="log" class="log-item">
                                                    {{log.date || new Date()}} {{log.message}}
                                                    </p>
                                                </transition-group>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="panel panel-primary">
                    <div class="panel-body">
                        <diagram-component :render-from="job.workflow" :multiple-selection-enabled="false" 
                            :show-task-decoration="true" :show-toolbar="false" 
                            :draggable-tasks="draggableTasks" zoom=".8"></diagram-component>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
    table.small {
        font-size:.9em;
        cursor: pointer;
    }
    .panel-diagram { height: 62vh; } 
    .panel-diagram .panel-body { height: 56vh }
    .fa-warning {
        color: #FFDC00;
    }
    .fa-info:before {
        content: "\f05a";
        color: #0074D9;
    }
    .fa-error:before {
        content: "\f057";
        color: #FF4136;
    }
    .overflow {
        overflow: auto;
    }
    div.result-item {
        padding: 5px; 
        margin-left: 5px;
        background-color: #f9f9f9;
        border: 1px solid #aaa;
    }
    .result-item:hover{
        color: #fff;
        text-decoration: none;
        background-color: #563d7c;
    }
    a.result:hover, a.result:visited, a.result:link, a.result:active{
        text-decoration: none;
        color: inherit;
    }
</style>
<script>
    import Vue from 'vue';
    import DiagramComponent from '../diagram/diagram';
    import MomentMixin from '../mixins/moment-mixin';
    import eventHub from '../app/event-hub';
    import store from '../vuex/store';
    import io from 'socket.io-client';

    import {standUrl, tahitiUrl, authToken, caipirinhaUrl} from '../../config';
    const JobDetailComponent = Vue.extend({
        /* Life-cycle */
        store,
        mounted: function () {
            let self = this;
            
            // Required to build workflow
            this.$store.dispatch('loadOperations').then(function (result) {
                self.performLoad().then((r) => {
                    self.connectWebSocket();
                });
            });
            eventHub.$on('route-change', (to, from) => {
                if (from.name === 'job-detail'){
                    let room = self.job.id;
                    console.debug('Disconnecting from room', room);
                    let socket = self.socket;
                    socket.emit('leave', { room: room });
                    //socket.emit('disconnect');
                    socket.close();
                }
            });
        },
        components: {
            'diagram-component': DiagramComponent
        },
        /* Data */
        data() {
            return {
                job: { id: null, workflow: {}, user: {}, cluster: {} },
                draggableTasks: true,
                highlight: null
            };
        },
        /* Methods */
        methods: {
            computeLink(result){
                return `${caipirinhaUrl}/visualizations/${this.job.id}/${result.task.id}?token=${authToken}`;
            },
            connectWebSocket(){
                let self = this;
                var counter = 0;
                let namespace = '/stand';

                let socket = io(standUrl + namespace, 
                    { upgrade: true, path: '/socket.io' });

                socket.on('disconnect', () => {
                    console.debug('disconnect')
                });
                socket.on('response', (msg) => {
                    console.debug('response', msg)
                });
                socket.on('connect', () => {
                    let self = this;
                    let room = self.job.id;
                    console.debug('Connecting to room', room);
                    socket.emit('join', { room: room });
                    self.socket = socket;
                });
                socket.on('connect_error', () => {
                    console.debug('Web socket server offline');
                });
                socket.on('update task', (msg) => {
                    let self = this;
                    //self.selectTask(msg.id, msg.status.toLowerCase());

                    let inx = self.job.workflow.tasks.findIndex(
                        (n, inx, arr) => n.id === msg.id);
                    
                    console.debug('Found', inx, msg.id)
                    if (inx > -1) {
                        let task = self.job.workflow.tasks[inx];
                        task.status = msg.status;
                        let step = self.job.steps.find((step) => step.task.id === task.id);
                        if (step){
                            step.status = msg.status;
                            step.logs.push({level: 'INFO', 
                                message: msg.message || msg.msg})
                        }
                        //self.job.workflow.tasks[inx].forms.color.value = 'green';
                    }
                    console.debug('update task', msg)
                });
                socket.on('update job', (msg) => {
                    if (msg.id === self.job.id){
                        self.job.status = msg.status;
                        if (msg.message || msg.msg){
                            let finalMsg = msg.message || msg.msg;
                            
                            self.job.status_text = finalMsg;
                            if (msg.status === 'COMPLETED'){
                                self.$root.$refs.toastr.s(finalMsg, msg.status);
                            } else if (msg.status !== 'ERROR'){
                                self.$root.$refs.toastr.i(finalMsg, msg.status);
                            } else {
                                self.$root.$refs.toastr.Add({
                                    title:  msg.status,
                                    msg: finalMsg,
                                    clickClose: true, 
                                    timeout: 0, 
                                    position: "toast-bottom-full-width",
                                    type: "error" 
                                });
                            }
                        }
                    }
                });
                socket.on('task result', (msg) => {
                    self.job.results.push(msg);
                });
            },
            getOperationName(id) {
                let ops = this.$store.getters.getOperations.filter((op) => op.id === id);
                if (ops.length > 0){
                    return ops[0].name;
                } else {
                    return 'Unknown operation';
                }
            },
            getOperationIcon(id) {
                let ops = this.$store.getters.getOperations.filter((op) => op.id === parseInt(id));
                if (ops.length > 0){
                    return ops[0].icon;
                } else {
                    return 'fa-question-circle';
                }
            },
            performLoad() {
                let self = this;
                let id = this.$route.params.id;
                this.job.id = id;
                let url = `${standUrl}/jobs/${id}?token=${authToken}`;
                return Vue.http.get(url).then(function (response) {
                    response.data.workflow.tasks.forEach((task) => task.status = '');
                    self.job = response.data;
                    self.$nextTick(function () {
                        self.draggableTasks = false;
                    });
                })
            },
            selectTask(taskId, addClass){
                let current = document.querySelector('.highlight');
                if (current){
                    current.classList.remove('highlight');
                }
                let elem = document.getElementById(taskId);
                if (elem) {
                    elem.classList.add('highlight');
                }
            },
            deselectTask(taskId){
                let current = document.querySelector('.highlight');
                if (current){
                    current.classList.remove('highlight');
                }
            },
        },
        mixins: [MomentMixin],
    });
    export default JobDetailComponent;
</script>