import Vue from 'vue';
import store from '../vuex/store';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import template from './diagram-template.html';

import {addTask, removeTask, clearTasks, addFlow, removeFlow, clearFlows } from '../vuex/actions';
import { getOperationFromId, getFlows, getTasks } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, EmptyPropertiesComponent, 
    SplitComponent, PropertyDescriptionComponent} 
    from '../properties/properties-components.js';
import {TaskComponent, connectionOptions} from '../task/task';
import FlowComponent from '../task/flow';

import highlight from 'highlight.js';
import highlightCass from 'highlight.js/styles/default.css';
import solarizedDark from 'highlight.js/styles/solarized-dark.css';

const DiagramComponent = Vue.extend({
    computed: {
        zoomPercent: function () {
            return `${Math.round(100 * this.zoom, 0)}%`;

        }
    },
    components: {
        'task-component': TaskComponent,
        'flow-component': FlowComponent,
        'property-description-component': PropertyDescriptionComponent,
        'empty-properties-component': EmptyPropertiesComponent,

    },
    props: {
        formContainer: null,
        instance: null,
        title: {},
        operation: {
            'default': function () { return { name: '', icon: '' }; }
        },
        zoom: 1
    },
    store,
    vuex: {
        actions: {
            getOperationFromId,
            addTask,
            removeTask,
            clearTasks,
            addFlow,
            removeFlow,
            clearFlows,

        },
        getters: {
            flows: getFlows,
            tasks: getTasks
        }
    },
    data() {
        return {
            zoomInEnabled: true,
            zoomOutEnabled: true,
            selectedTask: null,
        }
    },
    events: {
        'onclick-operationx': function (operationComponent) {
            let self = this;
            this.selectedTask = operationComponent.task; 
            debugger
            if (self.currentComponent == 'property-description-component'){
                self.currentComponent = 'empty-properties-component';
            }else {
                self.currentComponent = 'property-description-component';
            }
            if (self.currentForm){
                //self.currentForm.$destroy(); FIXME
            }
        },
        'onclick-operation2': function (operationComponent) {
            this.selectedTask = operationComponent.task; 
            let elem = document.getElementById(this.formContainer);
            elem.innerHTML = '<div><h5>{{task.operation.name}}</h5><form-component :task="task"></form-component><property-description-component :task="task"/></div>';
            if (self.currentForm){
                self.currentForm.$destroy();
            }
            self.currentForm = new Vue({
                el: `#${this.formContainer}`,
                components: {
                    'form-component': slug2Component[operationComponent.task.operation.slug] 
                        || EmptyPropertiesComponent,
                    'property-description-component': PropertyDescriptionComponent
                },
                destroyed(){
                    console.debug('form destroyed')
                },
                data(){
                    return {
                        task: operationComponent.task,
                    }
                }
            });
        }
    },
    template,
    ready() {
        this.zoom = 1.0;
        this.currentZIndex = 10;
        this.init();
    },
    methods: {
        init() {
            
            /* scroll bars */
            //PerfectScrollbar.initialize(this.$el);
            PerfectScrollbar.initialize(document.getElementById('lemonade-container'))
            const self = this;
            jsPlumb.bind('ready', function () {
                self.instance = jsPlumb.getInstance({
                    //Anchors: anchors,
                    Endpoints: [["Dot", { radius: 2 }], ["Dot", { radius: 1 }]],
                    EndpointHoverStyle: { fillStyle: "orange" },
                    HoverPaintStyle: { strokeStyle: "blue" },
                });

                window.addEventListener('resize', (e) => {
                    console.debug('Resizing')
                    self.instance.repaintEverything();
                });

                self.instance.setContainer("lemonade-diagram");
                self.instance.getContainer().addEventListener('click', function (ev) {
                    self.clearSelection(ev);
                });
                self.instance.bind("click", self.flowClick);

                self.instance.bind('connection', function (info, originalEvent) {
                    let con = info.connection;
                    var arr = self.instance.select({ source: con.sourceId, target: con.targetId });
                    if (arr.length > 1) {
                        self.instance.detach(con);
                    } else if (originalEvent) {
                        self.instance.detach(con);
                        self.addFlow({ uuids: [info.sourceEndpoint.getUuid(), info.targetEndpoint.getUuid()] });
                    }
                });
            })
        },
        clearSelection(ev) {
            if (ev.target.taskName === 'path') {
                // click on flow
                return;
            }
            let self = this;
            let tasks = document.querySelectorAll(".task");
            Array.prototype.slice.call(tasks, 0).forEach((e) => {
                e.classList.remove('selected');
                self.instance.clearDragSelection();
                self.selectedTask = null;
                self.selectedFlow = null;
            });
        },
        taskSelect(ev) {
            console.debug('xxx', ev)
            if (ev.currentTarget.classList.contains("task")) {
                var tasks = document.querySelectorAll(".task.selected");
                Array.prototype.slice.call(tasks, 0).forEach(e => {
                    e.classList.remove('selected');
                });
                ev.currentTarget.classList.add('selected');
                var self = this;
                self.selectedTask = ev.currentTarget;
            }
            if (this.selectedFlow) {
                this.selectedFlow.setPaintStyle(connectorPaintStyle);
                this.selectedFlow = null;
            }
        },
        flowClick(connection, e) {
            var self = this;
            self.selectedFlow = connection;
            self.instance.select().setPaintStyle(connectorPaintStyle)
            connection.setPaintStyle({
                lineWidth: 2,
                radius: 1,
                strokeStyle: "rgba(242, 141, 0, 1)"
            })
            let tasks = document.querySelectorAll(".task.selected");
            Array.prototype.slice.call(tasks, 0).forEach(e => {
                e.classList.remove('selected');
            });
            e.stopPropagation();
            e.preventDefault();
        },
        endPointMouseOver(endpoint, event) {
            //console.debug(endpoint)
        },
        drop(ev) {
            const self = this;
            ev.preventDefault();

            let operation = this.getOperationFromId(ev.dataTransfer.getData('id'))[0];
            if (! operation) {
                return;
            }

            let classes = operation.categories.map((c) => {
                return c.type.replace(' ', '-');
            }).join(' ');
            self.addTask({
                id: self.generateId(), operation,
                x: ev.offsetX, y: ev.offsetY, zIndex: ++self.currentZIndex, classes
            });
        },
        allowDrop(ev) {
            ev.preventDefault();
        },

        clear() {
            let self = this;
            /*
            self.instance.getConnections().forEach(conn => {
                self.instance.detach(conn);
            });
            let tasks = Array.prototype.slice.call(document.querySelectorAll(".diagram .task"), 0);
            tasks.forEach(task => {
                self.instance.remove(task);
            });
            */
            self.clearFlows();
            self.clearTasks();
        },
        deleteSelected(ev) {
            let self = this;
            if (self.selectedTask) {
                /*self.instance.remove(self.selectedTask);
                self.removeTask({ id: self.selectedTask.id });*/
                self.removeTask(self.selectedTask);
                self.selectedTask = null;
            } else if (self.selectedFlow) {
                self.instance.detach(self.selectedFlow);
                self.selectedFlow = null;
            }
        },
        diagramClick(ev) {
            if (ev.target.classList.contains("diagram")) {
                ev.preventDefault();
                if (this.selectedTask) {
                    this.selectedTask.classList.remove('selected');
                    this.selectedTask = null;
                }
                if (this.selectedFlow) {
                    this.selectedFlow.setPaintStyle(connectorPaintStyle);
                    this.selectedFlow = null;
                }
            }
        },
        generateId() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        loadSample(ev) {
            let graph = JSON.parse(
                document.getElementById('sample-' + ev.target.dataset.sampleId).innerText.replace('\n', ''));
            this.innerLoad(graph);
        },
        load(ev) {
            let graph = JSON.parse(document.getElementById('save-area').value);
            this.innerLoad(graph);
        },
        innerLoad(graph) {
            let self = this;
            self.clear();
            graph.tasks.forEach((task) => {
                let operation = self.getOperationFromId(task.operation || task.operationId)[0];
                let classes = operation.categories.map((c) => {
                    return c.type.replace(' ', '-');
                }).join(' ');
                self.addTask({
                    id: task.id, operation,
                    x: task.left || task.x, y: task.top || task.y, zIndex: ++self.currentZIndex, classes
                })
            });
            graph.flows.forEach((flow) => {
                Object.keys(connectionOptions).forEach(opt => {
                    if (connectionOptions.hasOwnProperty(opt)) {
                        flow[opt] = connectionOptions[opt];
                    }
                });
                flow['anchor'] = flow.anchors;
                delete flow['anchors']
                flow['detachable'] = true;

                //self.instance.connect({ uuids: [flow['source-uuid'], flow['target-uuid']] });
                if (! flow.uuids) {
                    flow.uuids = [flow['source-uuid'], flow['target-uuid']];
                }
                self.addFlow({ uuids: flow['uuids']});
            });
            //self.instance.repaintEverything();
        },
        save() {
            let result = { tasks: this.tasks, flows: this.flows };
            let tmp = document.getElementById('save-area');
            if (tmp) {
                tmp.value = JSON.stringify(result,
                    (key, value) => {
                        if (key === 'operation'){
                            return value.id;
                        } else if (key === 'classes') {
                            return undefined;
                        } else {
                            return value;
                        }
                    });
            }
            return result;
        },
        setZoom(zoom, instance, transformOrigin, el) {
            transformOrigin = transformOrigin || [0.5, 0.5];
            instance = instance || jsPlumb;
            el = el || instance.getContainer();
            var p = ["webkit", "moz", "ms", "o"],
                s = "scale(" + zoom + ")",
                oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";

            for (var i = 0; i < p.length; i++) {
                el.style[p[i] + "Transform"] = s;
                el.style[p[i] + "TransformOrigin"] = oString;
            }

            el.style["transform"] = s;
            el.style["transformOrigin"] = '0% 0% 0px'; //oString;
            instance.setZoom(zoom);
            let adjust = (1.0 / zoom * 100) + '%'
            el.style.width = adjust;
            el.style.height = adjust;
        },
        zoomIn(ev) {
            let self = this;
            let diagram = document.querySelectorAll("#lemonade-diagram")[0];
            self.zoom += .1;
            if (self.zoom > 1.3) {
                self.zoomInEnabled = false;
            }
            self.zoomOutEnabled = true;
            this.setZoom(self.zoom, self.instance, null, diagram);
            return;
        },
        zoomOut() {
            let self = this;
            let diagram = document.querySelectorAll("#lemonade-diagram")[0];
            self.zoom -= .1;
            if (self.zoom < 0.8) {
                self.zoomOutEnabled = false;
            }
            self.zoomInEnabled = true;
            this.setZoom(self.zoom, self.instance, null, diagram);
            return;
        },
        tsort(flows) {
            let info = this.save();
            info.flows.forEach((flow) => {
                let sourceTask = info.tasks.filter((task) => {
                    return task.id === flow.uuids[0].split('/')[0];
                })[0];
                if (!sourceTask.afters) {
                    sourceTask.afters = [];
                }
                sourceTask.afters.push(flow.uuids[1].split('/')[0]);
            });
            let tasks = {}, // hash: stringified id of the task => { id: id, afters: lisf of ids }
                sorted = [], // sorted list of IDs ( returned value )
                visited = {}; // hash: id of already visited task => true
            info.tasks.forEach((n) => { tasks[n.id] = n; });
            //console.debug(tasks);
            /*
            var Task = function (id) {
                this.id = id;
                this.afters = [];
            }

            // 1. build data structures
            flows.forEach(function (v) {
                var from = v[0], to = v[1];
                if (!tasks[from]) tasks[from] = new Task(from);
                if (!tasks[to]) tasks[to] = new Task(to);
                tasks[from].afters.push(to);
            });
            */

            // 2. topological sort
            Object.keys(tasks).forEach(function visit(idstr, ancestors) {
                var task = tasks[idstr],
                    id = task.id;

                // if already exists, do nothing
                if (visited[idstr]) return;

                if (!Array.isArray(ancestors)) ancestors = [];

                ancestors.push(id);

                visited[idstr] = true;
                task.afters = task.afters || [];
                task.afters.forEach(function (afterID) {
                    if (ancestors.indexOf(afterID) >= 0)  // if already in ancestors, a closed chain exists.
                        throw new Error('closed chain : ' + afterID + ' is in ' + id);

                    visit(afterID.toString(), ancestors.map(function (v) { return v })); // recursive call
                });

                sorted.unshift(id);
            });
            //console.debug(sorted);
            let saveIntermediate = (rdd, name) => {
                let randId = 'FIXME';
                return `${rdd}.saveAsNewAPIHadoopFile('workflow_id/${name}${randId}', \n\    'org.apache.hadoop.mapreduce.lib.output.SequenceFileOutputFormat')\n`;
            };
            let op2Cmd = {
                1: "# Creates a model, e.g., NaiveBayes \nmodel = custom_classifier_factory(params['classifier']).train(training, 1.0)\n"
                + "model.save(sc, 'workflow_id/model_123')\n",
                2: "",
                3: "",
                4: "from pyspark.mllib.classification import NaiveBayes, NaiveBayesModel\n",
                5: "# Filter data \nwork_rdd = work_rdd.filter(lambda x: custom_filter_function(x))\n" + saveIntermediate('work_rdd', 'filter_'),
                6: "# Projection of data \n work_rdd = work_rdd.map(lambda x: custom_projection_function(x)) \n",
                7: "# Transform data \nwork_rdd = work_rdd.map(lambda x: custom_transformation_function(x))\n" + saveIntermediate('work_rdd', 'transform_'),
                8: "lr = LinearRegression(maxIter=10, regParam=0.3, elasticNetParam=0.8)\n" +
                '# Fit the model \nlrModel = lr.fit(training)' +
                'lrModel.save("path")',
                9: "",
                10: "",
                11: "",
                12: "# Union of 2 RDDs \n work_rdd.union(other_work_rdd)\n",
                13: "",
                14: "",
                15: "",
                16: "",
                17: "# Split data \ntraining, test = work_rdd.randomSplit([params['split_perc_1'], params['split_perc_2']], params['seed'])\n" +
                saveIntermediate('training', 'training_') + saveIntermediate('test', 'test_'),
                18: "work_rdd = spark.read.text(params['data-source-path']).rdd\n",
                19: "# Evaluates the model \nprediction_and_label = test.map(lambda p: (model.predict(custom_select_features(p), custom_select_label(p))))\n" +
                'accuracy = 1.0 * prediction_and_label.filter(lambda (x, v): x == v).count() / test.count()\n' +
                saveIntermediate('prediction_and_label') + '\n',
                20: "# Workflow will be converted to a web service\n",
                21: "# Filter or transform missing data \nif params['action'] == 'filter': \n    work_rdd = work_rdd.filter(lambda x: custom_filter_function(x))\nelse: # transform missing\n    work_rdd = work_rdd.map(lamda x: custom_map_function(x))\n" + saveIntermediate('work_rdd', 'filter_'),
            };
            let code = [,
                'import sys', 'from pyspark.sql import SparkSession',
                'from pyspark.ml.regression import LinearRegression',
                'spark = SparkSession.builder.appName("Lemonade").getOrCreate()\n']

            sorted.forEach((item) => {
                if (!op2Cmd[tasks[item].operation.id])
                    console.debug(tasks[item].operation.id)
                else
                    code.push(op2Cmd[tasks[item].operation.id].replace('FIXME',
                        tasks[item].operation.id))
            });
            let codeTask = document.getElementsByTagName('code')[0];
            codeTask.innerText = code.join('\n');
            highlight.highlightBlock(codeTask);
            return sorted;
        }

    },
    watch: {
        /*
        theTasks: (e) => {
            console.debug('changed', e)
        }
        */
    }
});

export default DiagramComponent;
