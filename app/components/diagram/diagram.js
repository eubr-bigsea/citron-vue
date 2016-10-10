import Vue from 'vue';
import store from '../vuex/store';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import template from './diagram-template.html';

import { getOperationFromId, addNode, removeNode, clearNodes, addEdge, removeEdge, clearEdges } from '../vuex/actions';
import { getNodes, getEdges } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, EmptyPropertiesComponent, 
    SplitComponent, PropertyDescriptionComponent} 
    from '../properties/properties-components.js';
import {OperationComponent, connectionOptions} from '../operation/operation';

import EdgeComponent from '../operation/edge';
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
        'operation-component': OperationComponent,
        'edge-component': EdgeComponent,
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
            addNode,
            removeNode,
            clearNodes,
            addEdge,
            removeEdge,
            clearEdges,

        },
        getters: {
            nodes: getNodes,
            edges: getEdges
        }
    },
    data() {
        return {
            zoomInEnabled: true,
            zoomOutEnabled: true,
            selectedNode: null,
        }
    },
    events: {
        'onclick-operationx': function (operationComponent) {
            let self = this;
            this.selectedNode = operationComponent.node; 
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
            this.selectedNode = operationComponent.node; 
            let elem = document.getElementById(this.formContainer);
            elem.innerHTML = '<div><h5>{{node.operation.name}}</h5><form-component :node="node"></form-component><property-description-component :node="node"/></div>';
            if (self.currentForm){
                self.currentForm.$destroy();
            }
            self.currentForm = new Vue({
                el: `#${this.formContainer}`,
                components: {
                    'form-component': slug2Component[operationComponent.node.operation.slug] 
                        || EmptyPropertiesComponent,
                    'property-description-component': PropertyDescriptionComponent
                },
                destroyed(){
                    console.debug('form destroyed')
                },
                data(){
                    return {
                        node: operationComponent.node,
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
                self.instance.bind("click", self.edgeClick);

                self.instance.bind('connection', function (info, originalEvent) {
                    let con = info.connection;
                    var arr = self.instance.select({ source: con.sourceId, target: con.targetId });
                    if (arr.length > 1) {
                        self.instance.detach(con);
                    } else if (originalEvent) {
                        self.instance.detach(con);
                        self.addEdge({ uuids: [info.sourceEndpoint.getUuid(), info.targetEndpoint.getUuid()] });
                    }
                });
            })
        },
        clearSelection(ev) {
            if (ev.target.nodeName === 'path') {
                // click on edge
                return;
            }
            let self = this;
            let nodes = document.querySelectorAll(".node");
            Array.prototype.slice.call(nodes, 0).forEach((e) => {
                e.classList.remove('selected');
                self.instance.clearDragSelection();
                self.selectedNode = null;
                self.selectedEdge = null;
            });
        },
        nodeSelect(ev) {
            console.debug('xxx', ev)
            if (ev.currentTarget.classList.contains("node")) {
                var nodes = document.querySelectorAll(".node.selected");
                Array.prototype.slice.call(nodes, 0).forEach(e => {
                    e.classList.remove('selected');
                });
                ev.currentTarget.classList.add('selected');
                var self = this;
                self.selectedNode = ev.currentTarget;
            }
            if (this.selectedEdge) {
                this.selectedEdge.setPaintStyle(connectorPaintStyle);
                this.selectedEdge = null;
            }
        },
        edgeClick(connection, e) {
            var self = this;
            self.selectedEdge = connection;
            self.instance.select().setPaintStyle(connectorPaintStyle)
            connection.setPaintStyle({
                lineWidth: 2,
                radius: 1,
                strokeStyle: "rgba(242, 141, 0, 1)"
            })
            let nodes = document.querySelectorAll(".node.selected");
            Array.prototype.slice.call(nodes, 0).forEach(e => {
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
            //console.debug(ev.dataTransfer)

            let operation = this.getOperationFromId(ev.dataTransfer.getData('id'))[0];

            let classes = operation.categories.map((c) => {
                return c.type.replace(' ', '-');
            }).join(' ');
            self.addNode({
                id: self.generateId(), operation,
                x: ev.offsetX, y: ev.offsetY, zIndex: ++self.currentZIndex, classes
            })
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
            let nodes = Array.prototype.slice.call(document.querySelectorAll(".diagram .node"), 0);
            nodes.forEach(node => {
                self.instance.remove(node);
            });
            */
            self.clearEdges();
            self.clearNodes();
        },
        deleteSelected(ev) {
            let self = this;
            if (self.selectedNode) {
                /*self.instance.remove(self.selectedNode);
                self.removeNode({ id: self.selectedNode.id });*/
                self.removeNode(self.selectedNode);
                self.selectedNode = null;
            } else if (self.selectedEdge) {
                self.instance.detach(self.selectedEdge);
                self.selectedEdge = null;
            }
        },
        diagramClick(ev) {
            if (ev.target.classList.contains("diagram")) {
                ev.preventDefault();
                if (this.selectedNode) {
                    this.selectedNode.classList.remove('selected');
                    this.selectedNode = null;
                }
                if (this.selectedEdge) {
                    this.selectedEdge.setPaintStyle(connectorPaintStyle);
                    this.selectedEdge = null;
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
            let graph = JSON.parse(document.getElementsByTagName('textarea')[0].value);
            this.innerLoad(graph);
        },
        innerLoad(graph) {
            let self = this;
            self.clear();
            graph.nodes.forEach((node) => {
                let operation = self.getOperationFromId(node.operation || node.operationId)[0];
                let classes = operation.categories.map((c) => {
                    return c.type.replace(' ', '-');
                }).join(' ');
                self.addNode({
                    id: node.id, operation,
                    x: node.left || node.x, y: node.top || node.y, zIndex: ++self.currentZIndex, classes
                })
            });
            graph.edges.forEach((edge) => {
                Object.keys(connectionOptions).forEach(opt => {
                    if (connectionOptions.hasOwnProperty(opt)) {
                        edge[opt] = connectionOptions[opt];
                    }
                });
                edge['anchor'] = edge.anchors;
                delete edge['anchors']
                edge['detachable'] = true;

                //self.instance.connect({ uuids: [edge['source-uuid'], edge['target-uuid']] });
                self.addEdge({ uuids: [edge['source-uuid'], edge['target-uuid']] });
            });
            //self.instance.repaintEverything();
        },
        save() {
            let result = { nodes: this.nodes, edges: this.edges };
            let tmp = document.getElementsByTagName('textarea');
            if (tmp.length) {
                tmp[0].value = JSON.stringify(result,
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
        tsort(edges) {
            let info = this.save();
            info.edges.forEach((edge) => {
                let sourceNode = info.nodes.filter((node) => {
                    return node.id === edge.uuids[0].split('/')[0];
                })[0];
                if (!sourceNode.afters) {
                    sourceNode.afters = [];
                }
                sourceNode.afters.push(edge.uuids[1].split('/')[0]);
            });
            let nodes = {}, // hash: stringified id of the node => { id: id, afters: lisf of ids }
                sorted = [], // sorted list of IDs ( returned value )
                visited = {}; // hash: id of already visited node => true
            info.nodes.forEach((n) => { nodes[n.id] = n; });
            //console.debug(nodes);
            /*
            var Node = function (id) {
                this.id = id;
                this.afters = [];
            }

            // 1. build data structures
            edges.forEach(function (v) {
                var from = v[0], to = v[1];
                if (!nodes[from]) nodes[from] = new Node(from);
                if (!nodes[to]) nodes[to] = new Node(to);
                nodes[from].afters.push(to);
            });
            */

            // 2. topological sort
            Object.keys(nodes).forEach(function visit(idstr, ancestors) {
                var node = nodes[idstr],
                    id = node.id;

                // if already exists, do nothing
                if (visited[idstr]) return;

                if (!Array.isArray(ancestors)) ancestors = [];

                ancestors.push(id);

                visited[idstr] = true;
                node.afters = node.afters || [];
                node.afters.forEach(function (afterID) {
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
                if (!op2Cmd[nodes[item].operation.id])
                    console.debug(nodes[item].operation.id)
                else
                    code.push(op2Cmd[nodes[item].operation.id].replace('FIXME',
                        nodes[item].operation.id))
            });
            let codeNode = document.getElementsByTagName('code')[0];
            codeNode.innerText = code.join('\n');
            highlight.highlightBlock(codeNode);
            return sorted;
        }

    },
    watch: {
        /*
        theNodes: (e) => {
            console.debug('changed', e)
        }
        */
    }
});

export default DiagramComponent;
