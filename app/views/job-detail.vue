<template>
    <div class="container-fluid">
        <div class="row xsmall-padding">
            <!--
            <div class="col-md-12">
                <h2>Job #{{job.id}} :: Workflow #{{job.workflow.id}} - {{job.workflow.name}}
                </h2>
                <router-link :to="{name: 'editor', params: {id: job.workflow.id }}"><span class="fa fa-edit"></span> Edit workflow</router-link>
                <hr/>
            </div>
            -->
            <div class="col-md-6">
                <div class="panel panel-primary results">
                    <div class="panel-body">
                        <div class="pull-left">
                            <router-link class="btn btn-success btn-xs" :to="{name: 'editor', params: {id: job.workflow.id }}"><span class="fa fa-arrow-left"></span></router-link>
                            <strong>{{job.workflow.id}} - {{job.workflow.name}}</strong>
                        </div>
                        <div class="pull-right">
                            Job #{{job.id}} 
                        </div>
                        <div class="row clearfix2">
                            <div class="col-md-6">
                                <strong>Started:</strong> {{formatDate(job.started, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                            </div>
                            <div class="col-md-6 text-right">
                                <strong>Finished:</strong> {{formatDate(job.finished, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                            </div>
                        </div>
                        <div class="clearfix2">
                            <router-view :key="$route.params.visualizationId" class="clearfix"
                                    :render-from="job.workflow" :multiple-selection-enabled="false" 
                                    :show-task-decoration="true" :show-toolbar="false" 
                                    :draggable-tasks="draggableTasks" :initialZoom=".8">
                            </router-view>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-md-12">
                        <div class="panel panel-primary results">
                            <div class="panel-body">
                                <h4>Visualizations:</h4>
                                <a class="text-center result-item button result" :href="'#jobs/' + job.id + '/diagram'">
                                    <span class="fa fa-flask fa-3x"></span>
                                    <br/>
                                    Diagram
                                </a>
                                <div class="clearfix">
                                    <a class="text-center result-item button result" v-for="result in job.results" :href="computeLink(result)" >
                                        <span class="fa fa-3x" :class="getOperationIcon(result.operation.id)"></span>
                                        <br/>
                                        {{result.title}}<br/>
                                        <div v-if="result.type === 'HTML'" v-html="result.content">
                                        </div>
                                    </a>
                                </div>
                                <h4>Outputs:</h4>
                                <p>
                                    <strong>Status:</strong> {{job.status}}
                                </p>
                                <p :visible="job.status_text !== ''">
                                    <pre v-html="job.status_text"></pre>
                                </p>
                                <div class="log-result">
                                    <div class="task-status" v-for="step in job.steps" :id="'log-' + step.task.id" @mouseover="selectTask(step.task.id)" @mouseout="deselectTask(step.task.id)" v-if="step.operation.id !==25">
                                        <div class="pull-left"><strong>{{getOperationName(step.operation.id)}}</strong></div>
                                        <div class="pull-right">{{step.status}}</div>
                                        <div style="clear:both">
                                            <div v-if="step.logs.length === 0">
                                                No log information
                                            </div>
                                            <div v-else>
                                                <transition-group name="log" tag="div">
                                                    <div v-for="log in step.logs" v-bind:key="log" class="log-item">
                                                    {{log.date}}
                                                    <img :src="'data:image/png;base64,' + log.message" v-if="log.type == 'IMAGE'"/>
                                                    <span v-html="log.message" v-else></span>
                                                    </div>
                                                    
                                                </transition-group>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
</template>
<style>
    .clearfix2{ clear: both}
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
    .result-item {
        display: block;
        float: left;
        padding: 5px; 
        margin-left: 5px;
        min-height: 100px;
        min-width: 80px;
        max-width: 160px;
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
    }
    pre {
        height: 100px;
        overflow: auto;
    }
    div.log-result {
        font-family: Courier New, Courier, monospace;
    }
    div.log-result strong {
        text-decoration: underline
    }
    div.log-result > div {
        margin-bottom: 5px;
        padding-bottom: 5px;
        border-bottom: 1px dashed #888;
    }
    div.panel.results {
        height: 90vh;
        overflow: auto
    }
</style>
<script>
    import Vue from 'vue';
    import DiagramComponent from '../components/diagram/diagram.vue';
    import MomentMixin from '../components/mixins/moment-mixin';
    import eventHub from '../components/app/event-hub';
    import store from '../components/vuex/store';
    import io from 'socket.io-client';

    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, standNamespace, standSocketIOdPath} from '../config';
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
                    if (socket){
                        socket.emit('leave', { room: room });
                        socket.close();
                    }
                    //socket.emit('disconnect');
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
                //return `${caipirinhaUrl}/visualizations/${this.job.id}/${result.task.id}?token=${authToken}`;
                return `#jobs/${this.job.id}/result/${result.task.id}`;
            },
            connectWebSocket(){
                let self = this;
                var counter = 0;

                let socket = io(standUrl + standNamespace, 
                    { upgrade: true, path: `${standSocketIOdPath}/socket.io`,  });

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
                socket.on('update task', (msg, callback) => {
                    let self = this;
                    //self.selectTask(msg.id, msg.status.toLowerCase());

                    let inx = self.job.workflow.tasks.findIndex(
                        (n, inx, arr) => n.id === msg.id);
                    
                    if (inx > -1) {
                        let task = self.job.workflow.tasks[inx];
                        task.status = msg.status;
                        let step = self.job.steps.find((step) => step.task.id === task.id);
                        if (step){
                            step.status = msg.status;
                            step.logs.push({level: 'INFO', 
                                date: msg.date,
                                type: msg.type,
                                message: msg.message || msg.msg})
                        }
                        //self.job.workflow.tasks[inx].forms.color.value = 'green';
                    }
                    //console.debug('update task', msg)
                });
                socket.on('update job', (msg) => {
                    if (msg.id === self.job.id){
                        self.job.status = msg.status;
                        self.job.finished = msg.finished;
                        if (msg.message){
                            let finalMsg = msg.message.replace(/&/g, '&amp;')
                              .replace(/"/g, '&quot;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;');;
                            
                            self.job.status_text = finalMsg;
                            if (msg.status === 'COMPLETED'){
                                self.$root.$refs.toastr.s(finalMsg, msg.status);
                            } else if (msg.status !== 'ERROR'){
                                self.$root.$refs.toastr.i(finalMsg, msg.status);
                            } else {
                                self.$root.$refs.toastr.Add({
                                    title:  status,
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
