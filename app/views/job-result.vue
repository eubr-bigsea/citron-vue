<template>
    <div>
        <h1>{{title}} </h1>
        beta.ctweb.inweb.org.br/caipirinha/visualizations/655/9a94a0cc-229b-46b4-bbc0-7ea51e67965e?token=123456
        <div v-if="type === 'table-visualization'" style="width: 100%;overflow: auto">
            <table class="table table-hover table-bordered table-condensed small" style="width:100%">
                <thead>
                    <tr>
                        <th v-for="label in labels">{{label}}</th>
                    </tr>
                </thead>
                <thead>
                    <tr v-for="row in data">
                        <td v-for="col in row">{{col}}</td>
                    </tr>
                </thead>
            </table>
    </div>
</template>
<script>
    import Vue from 'vue';
    import eventHub from '../components/app/event-hub';
    import store from '../components/vuex/store';

    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, standNamespace, standSocketIOdPath} from '../config';
    const JobResultComponent = Vue.extend({
        /* Life-cycle */
        store,
        mounted: function () {
            let self = this;
            let visualization = this.$route.params.visualizationId;
            let id = this.$route.params.id;
            let url = `${caipirinhaUrl}/visualizations/${id}/${visualization}?token=${authToken}`;
            Vue.http.get(url, { }).then(response => {
                self.visualization = response.body;
                self.type = self.visualization.type.name;
                self.data = self.visualization.data || [];
                self.labels = self.visualization.labels || [];
                self.title = self.visualization.title;
            });
        },
        components: {
        },
        props: {
            job: 0,
        },
        /* Data */
        data() {
            return {
                visualization: {},
                type: null,
                data: []
            };
        },
        /* Methods */
        methods: {
        },
        mixins: [],
    });
    export default JobResultComponent;
</script>
