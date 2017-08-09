<template>
    <div>
        <h1>{{title}} </h1>
        <div v-if="type === 'table-visualization'" style="width: 100%; height:80vh;overflow: auto">
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
        <div v-if="type === 'evaluate-model'" style="width: 100%;overflow: auto">
            <div v-html="data"></div>
        </div>
        <div ref="lineChart" style="width: 100%; height: 300px;" v-if=" type === 'line-chart' ">
            <svg></svg>
        </div>
        <div v-else>
            {{type}}
            <span v-html="JSON.stringify(visualization, null, 4).replace(new RegExp('\n', 'g'), '<br/>').replace(new RegExp('\\s', 'g'), '&nbsp;')"></span>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue';
    import nvd3 from 'nvd3'; 
    import eventHub from '../components/app/event-hub';
    import store from '../components/vuex/store';

    import {standUrl, tahitiUrl, authToken, caipirinhaUrl, standNamespace, standSocketIOdPath} from '../config';

    require('../../node_modules/nvd3/build/nv.d3.min.css');

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
                self.visualization['data'].forEach((item) =>{
                    item['key'] = item['id'];
                    item['area'] = false;
                }); 
                self.type = self.visualization.type.name;
                self.data = self.visualization.data || [];
                self.labels = self.visualization.labels || [];
                self.title = self.visualization.title;

                if (self.type === 'line-chart') {
                    nv.addGraph(() => {
                        let chart = nv.models.lineChart();

                        chart.useInteractiveGuideline(true);
                        chart.xAxis.axisLabel(self.visualization.x.title)
                            .tickFormat(d3.format(self.visualization.x.format || 'd'));

                        chart.yAxis.axisLabel(self.visualization.y.title)
                            .tickFormat(d3.format(self.visualization.y.format || 'd'));

                        d3.select(self.$refs.lineChart.querySelector('svg'))
                            .datum(self.model)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(
                            function() {
                                chart.update();
                            }
                        );
                    });
                }
            });
        },
        computed: {
            model(){
                this.visualization.data.forEach((item) => {
                    item.values.sort((a, b) =>{
                        return a.x - b.x;
                    })
                });
                return this.visualization.data;
            }
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
                data: [],
            };
        },
        /* Methods */
        methods: {
        },
        mixins: [],
    });
    export default JobResultComponent;
</script>
