<template>
    <div class="container-fluid">
        <div class="row xsmall-padding">
            <div class="col-md-12">
                <h2>Job #{{job.id}} :: Workflow #{{job.workflow.id}} - {{job.workflow.name}}
                    <span class="fa fa-reply"></span>
                </h2>
                <hr/>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-md-4">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                Job
                            </div>
                            <div class="panel-body">
                                <p>
                                    <strong>Workflow:</strong> {{job.workflow.id}} - {{job.workflow.name}}
                                </p>
                                <p>
                                    <strong>Created:</strong> {{formatDate(job.created, 'DD-MM-YYYY HH:mm:ss')}}
                                </p>
                                <p>
                                    <strong>Started:</strong> {{formatDate(job.started, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                                </p>
                                <p>
                                    <strong>Finished:</strong> {{formatDate(job.finished, 'DD-MM-YYYY HH:mm:ss') || '-'}}
                                </p>
                                <p>
                                    <strong>Status:</strong> {{job.status}}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                User
                            </div>
                            <div class="panel-body">
                                <p>
                                    <strong>{{job.user.id}} - {{job.user.name}}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                Cluster
                            </div>
                            <div class="panel-body">
                                <p>
                                    <strong>{{job.cluster.id}} - {{job.cluster.name}}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="panel panel-primary panel-diagram">
                            <div class="panel-heading">
                                Job messages output
                            </div>
                            <div class="panel-body">
                                <table class="table table-hover table-bordered table-condensed small">
                                    <tbody>
                                        <tr class="task-status" v-for="step in job.steps" :id="'log-' + step.task.id" @mouseover="selectTask(step.task.id)">
                                            <td class="col-md-2 text-center">
                                                {{step.status}}
                                            </td>
                                            <td class="col-md-2 text-center">
                                                {{getOperationName(step.operation.id)}}
                                            </td>
                                            <td class="col-md-2 text-center">{{formatDate(step.date, 'DD-MM-YYYY HH:mm:ss')}}</td>
                                            <td class="col-md-6">
                                                <span v-if="step.logs.length === 0">
                                                    No log information
                                                </span>
                                                <div v-else v-for="log in step.logs">
                                                    <i class="fa fa-2x" :class="'fa-' + log.level.toLowerCase()"></i> {{log.message}}
                                                    <br/>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="panel panel-primary">
                    <div class="panel-body">
                        <diagram-component :render-from="job.workflow" :multiple-selection-enabled="false" 
                            :show-toolbar="false" :draggable-tasks="draggableTasks"></diagram-component>
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
</style>
<script>
    import Vue from 'vue';
    import DiagramComponent from '../diagram/diagram';
    import MomentMixin from '../mixins/moment-mixin';
    import store from '../vuex/store';

    const standUrl = 'http://beta.ctweb.inweb.org.br/stand';
    const JobDetailComponent = Vue.extend({
        /* Life-cycle */
        store,
        mounted: function () {
            let self = this;
            this.$store.dispatch('loadOperations').then(function (result) {
                self.performLoad();
                self.$store.dispatch('connectWebSocket', self.job.id);
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
                highlight: null,
            };
        },
        /* Methods */
        methods: {
            getOperationName(id) {
                let ops = this.$store.getters.getOperations.filter((op) => op.id === id);
                if (ops.length > 0){
                    return ops[0].name;
                } else {
                    return 'Unknown operation';
                }
            },
            performLoad() {
                let self = this;
                let id = this.$route.params.id;
                this.job.id = id;
                let url = `${standUrl}/jobs/${id}?token=123456`;
                Vue.http.get(url).then(function (response) {
                    self.job = response.data;
                    self.$nextTick(function () {
                        self.draggableTasks = false;
                    });
                })
            },
            selectTask(taskId){
                let current = document.querySelector('.highlight');
                if (current){
                    current.classList.remove('highlight');
                }
                document.getElementById(taskId).classList.add('highlight');
            },
        },
        mixins: [MomentMixin]
    });
    export default JobDetailComponent;
</script>