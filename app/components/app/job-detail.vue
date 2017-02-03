<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Job #{{job.id}}</h2>
                <hr/>
            </div>
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
            <div class="col-md-8">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        Tasks status
                    </div>
                    <div class="panel-body">
                        <div class="task-status" v-for="step in job.steps">
                            {{step.operation.id}} {{step.operation.name}}
                            {{step.task.id}} {{step.status}} {{formatDate(step.date, 'DD-MM-YYYY HH:mm:ss')}}
                            {{step.logs}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import MomentMixin from '../mixins/moment-mixin';

    const standUrl = 'http://beta.ctweb.inweb.org.br/stand';
    const JobDetailComponent = Vue.extend({
        /* Life-cycle */
        mounted: function () {
            this.performLoad();
        },
        /* Data */
        data() {
            return {
                job: { id: null, workflow: {}, user: {}, cluster: {} }
            };
        },
        /* Methods */
        methods: {
            performLoad() {
                let self = this;
                let id = this.$route.params.id;
                this.job.id = id;
                let url = `${standUrl}/jobs/${id}?token=123456`;
                Vue.http.get(url).then(function (response) {
                    self.job = response.data;
                })
            },
        },
        mixins: [MomentMixin]
    });
    export default JobDetailComponent;
</script>