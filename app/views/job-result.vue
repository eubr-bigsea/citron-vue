<template>
    <div>
        <h3>{{title}} </h3>
        <div v-if="type === 'table-visualization'" style="width: 100%; overflow: auto">
            <table class="table table-hover table-bordered table-condensed small" style="width:100%">
                <thead>
                    <tr>
                        <th v-for="label in visualization.data.attributes">{{label}}</th>
                    </tr>
                </thead>
                <thead>
                    <tr v-for="row in data['rows']">
                        <td v-for="col in row">{{col}}</td>
                    </tr>
                </thead>
            </table>
        </div>
        <div v-else-if="type === 'evaluate-model'" style="width: 100%;overflow: auto">
            <div v-html="data"></div>
        </div>
        <div ref="d3Chart" style="width: 100%; height: 300px;" 
                v-else-if="svgChart">
            <svg></svg>
            <span v-html="JSON.stringify(visualization, null, 4).replace(new RegExp('\n', 'g'), '<br/>').replace(new RegExp('\\s', 'g'), '&nbsp;')"></span>
        </div>
        <div v-else>
            <span v-html="JSON.stringify(visualization, null, 4).replace(new RegExp('\n', 'g'), '<br/>').replace(new RegExp('\\s', 'g'), '&nbsp;')"></span>
        </div>
        <div v-if="error">
            <div class="alert alert-warning" v-if="notFound">
                Visualization not found. It might have been removed.
            </div>
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
            let url = `${caipirinhaUrl}/visualizations/${id}/${visualization}`;
            let headers = {'X-Auth-Token': '123456'}
            Vue.http.get(url, { headers }).then(response => {
                self.visualization = response.body;
                // self.visualization['data'].forEach((item) =>{
                //     item['key'] = item['id'];
                //     item['area'] = false;
                // }); 
                self.type = self.visualization.type.name;
                self.data = self.visualization.data || [];
                self.labels = self.visualization.labels || [];
                self.title = self.visualization.title;

                if (self.type === 'line-chart' || self.type === 'area-chart') {
                    nv.addGraph(() => {
                        let chart = (self.type === 'line-chart')
                            ? nv.models.lineChart() 
                            : nv.models.stackedAreaChart();

                        self.model.forEach((item) => {
                            item.values.sort((a, b) =>{
                                return a.x - b.x;
                            })
                        });

                        chart.useInteractiveGuideline(true);
                        chart.xAxis.axisLabel(self.visualization.x.title)
                            .tickFormat(d3.format(self.visualization.x.format || 'd'));

                        chart.yAxis.axisLabel(self.visualization.y.title)
                            .tickFormat(d3.format(self.visualization.y.format || 'd'));

                        d3.select(self.$refs.d3Chart.querySelector('svg'))
                            .datum(self.model)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(chart.update);
                    });
                } else if (self.type === 'bar-chart'){
                    nv.addGraph(function() {
                        let chart = nv.models.multiBarChart()
                            .rotateLabels(0);
                        
                        chart.x(function(d) { return d.x; });
                        chart.y(function(d) { return d.y; });

                        self.data.forEach((item) => {
                            item['key'] = item['x'];
                        });

                        if (self.visualization.x.format) {
                            chart.tickFormat(d3.format(self.visualization.x.format));
                        }
                        chart.xAxis.axisLabel(self.visualization.x.title);
                        
                        chart.yAxis.axisLabel(self.visualization.y.title);

                        if (self.visualization.y.format){
                            chart.tickFormat(d3.format(self.visualization.y.format));
                        }

                        d3.select(self.$refs.d3Chart.querySelector('svg'))
                            .datum(self.data)
                            .transition().duration(500)
                            .call(chart);
                        nv.utils.windowResize(chart.update);

                        return chart;
                    });
                } else if (self.type === 'pie-chart' || self.type === 'donut-chart'){
                    nv.addGraph(function() {
                        let chart = nv.models.pieChart()
                            .x(function(d) { return d.label })
                            .y(function(d) { return d.value })
                            .showLegend(self.visualization.legend.isVisible)
                            .showLabels(true)
                            .labelThreshold(.05)
                            .padAngle(0.05)
                            .labelsOutside(true)
                            .labelType("value")
                            .labelFormat((d) => {
                                return d3.format(self.visualization.x.format)(d)
                            })
                            .donut(self.type === 'donut-chart')
                            .donutRatio(0.5);
                        d3.select(self.$refs.d3Chart.querySelector('svg'))
                            .datum(self.data)
                            .transition().duration(500)
                            .call(chart);
                        nv.utils.windowResize(chart.update);
                        return chart;
                    });
                }
            }, (response) => {
                self.notFound = response.status === 404;
                self.error = true;
            });
        },
        computed: {
            model(){
                return this.visualization.data;
            },
            svgChart(){
                let type = this.type;
                return  type === 'line-chart' || 
                    type === 'bar-chart' || 
                    type === 'pie-chart' || 
                    type === 'area-chart' || 
                    type === 'donut-chart';
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
                title: '',
                error: false,
                notFound: false,
            };
        },
        /* Methods */
        methods: {
        },
        mixins: [],
    });
    export default JobResultComponent;
</script>
