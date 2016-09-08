import Vue from 'vue';
import store from '../vuex/store';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import template from './diagram-template.html';

import { getOperationFromId, addNode, removeNode, clearNodes, addEdge, removeEdge, clearEdges } from '../vuex/actions';
import { getNodes, getEdges } from '../vuex/getters';
import {CleanMissingComponent, DataReaderComponent, SplitComponent} 
    from './forms/form-components.js';
import OperationComponent from '../operation/operation';

import EdgeComponent from '../operation/edge';
import highlight from 'highlight.js';
import highlightCass from 'highlight.js/styles/default.css';
import solarizedDark from 'highlight.js/styles/solarized-dark.css';
/*
var anchors = [ "TopCenter", "RightMiddle", "BottomCenter",
                "LeftMiddle", "TopLeft", "TopRight", "BottomLeft",
                "BottomRight" ]
                */
const slug2Component = {
    'data-reader': DataReaderComponent,
    'split': SplitComponent,
    'clean-missing': CleanMissingComponent
};
const xanchors = ["TopCenter", "RightMiddle", "BottomCenter", "LeftMiddle"];
const anchors = {
    input: [
        [
            [0.5, 0, 0, -1],
        ],
        [
            [0.2, 0, 0, -1],
            [0.8, 0, 0, -1]
        ],
        [
            [0.2, 0, 0, -1],
            [0.5, 0, 0, -1],
            [0.8, 0, 0, -1]
        ]
    ],
    output: [
        [
            [0.5, 1, 0, 1],
        ],
        [
            [0.2, 1, 0, 1],
            [0.8, 1, 0, 1]
        ],
        [
            [0.2, 1, 0, 1],
            [0.5, 1, 0, 1],
            [0.8, 1, 0, 1]
        ]
    ]
}

const connectorType = ['Flowchart', 'Bezier', 'StateMachine'][2];
const connectorPaintStyle = {
    lineWidth: 1,
    radius: 8,
    strokeStyle: "#111",
    connector: [connectorType, { curviness: 10 }],
};

const endPointPaintStyle = {
    fillStyle: 'rgba(102, 155, 188, 1)',
    lineWidth: 0,
    radius: 8,
    height: 15,
    width: 15,
    strokeStyle: "transparent",
    zIndex: 99
}
const overlays = [
    ["Arrow", { location: .90, width: 12, length: 15 }],
    //["Label", { padding: 10, location: .5, label: '[ <span class="fa fa-dot-circle-o"></span> ]', cssClass: "labelClass" }]
];


const endPointOptionsInput = {
    connector: connectorType,
    isSource: false,
    isTarget: true,
    cssClass: 'endpoint',
    paintStyle: endPointPaintStyle,
    connectorOverlays: overlays,
    endpoint: "Dot",
    maxConnections: 1,
    connectorStyle: connectorPaintStyle,
};

const endPointOptionsOutput = {
    connector: connectorType,
    isSource: true,
    isTarget: false,
    cssClass: 'endpoint',
    paintStyle: endPointPaintStyle,
    connectorOverlays: overlays,
    endpoint: "Rectangle",
    maxConnections: 1,
    connectorStyle: connectorPaintStyle,
};

const connectionOptions = {
    connector: connectorType,
    //endpointStyle: endPointOptions,
    maxConnections: 1,
    endpoint: ['Dot', connectorPaintStyle],
    paintStyle: connectorPaintStyle,
    overlays: overlays,
}

const DiagramComponent = Vue.extend({
    computed: {
        zoomPercent: function () {
            return `${Math.round(100 * this.zoom, 0)}%`;
        }
    },
    components: {
        'operation-component': OperationComponent,
        'edge-component': EdgeComponent
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
            zoomOutEnabled: true
        }
    },
    events: {
        'onclick-operation': function (operationComponent) {
            this.selectedNode = operationComponent.node; 
            console.debug(operationComponent.node.operation.slug, this.formContainer);
            let elem = document.getElementById(this.formContainer);
            elem.innerHTML = '<form-component></form-component>';
            if (self.currentForm){
                self.currentForm.$destroy();
            }
            console.debug( slug2Component[operationComponent.node.operation.slug]);
            self.currentForm = new Vue({
                el: `#${this.formContainer}`,
                components: {
                    'form-component': slug2Component[operationComponent.node.operation.slug],
                },
                destroyed(){
                    console.debug('form destroyed')
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
                document.querySelectorAll(".node.selected").forEach(e => {
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
            document.querySelectorAll(".node.selected").forEach(e => {
                e.classList.remove('selected');
            });
            e.stopPropagation();
            e.preventDefault();
        },
        endPointMouseOver(endpoint, event) {
            //console.debug(endpoint)
        },
        createNode(nodeId, operation, target, x, y, adjust, type, zIndex) {
            let self = this;

            type = 'operation'
            let elem = document.createElement("div");
            elem.title = operation.description || '';
            elem.dataset.operationId = operation.id;
            elem.tabIndex = 0;
            elem.id = nodeId;
            elem.classList.add(type);
            elem.classList.add("node");

            elem.style.zIndex = zIndex;
            self.currentZIndex = Math.max(zIndex, self.currentZIndex);

            operation.categories.forEach((c) => {
                elem.classList.add(c.type.replace(' ', '-'));
            });
            if (type === 'data-source' && false) {
                ['bottom', 'middle', 'top'].forEach(c => {
                    let child = document.createElement('div');
                    if (c === 'middle') {
                        child.innerHTML = '<strong>' + operation.name + ' </strong>';
                    }
                    child.classList.add(c);
                    elem.appendChild(child);
                });
            } else {
                elem.innerHTML = `<strong><span class="fa ${operation.icon}"></span> ${operation.name}</strong><em>${operation.description}</em>`;
            }

            elem.style.top = y + 'px';
            elem.style.left = x + 'px';

            target.appendChild(elem);
            // @FIXME: See nodeSelect function
            elem.addEventListener('click', function (ev) {
                document.querySelectorAll(".node.selected").forEach(e => {
                    e.classList.remove('selected');
                });
                if (ev.ctrlKey) {
                    //this.classList.add('many-selected');
                    self.instance.addToDragSelection(this);
                } else if (this.classList.contains('jsplumb-drag-selected')) {
                    //nothing
                } else {
                    self.instance.clearDragSelection();
                    this.classList.add('selected');
                    self.selectedNode = this;
                }
                self.instance.repaintEverything()
                self.$dispatch('onclick-operation', this, 'ok')
                ev.stopPropagation();
            });
            let outputs = operation.ports.filter((p) => {
                return p.type === 'OUTPUT';
            }).sort((a, b) => {
                return a.order - b.order;
            });
            let inputs = operation.ports.filter((p) => {
                return p.type === 'INPUT';
            }).sort((a, b) => {
                return a.order - b.order;
            });
            var lbls = [
                // note the cssClass and id parameters here
                ["Label", { cssClass: "endpoint-label", label: "", id: "lbl", padding: 20 }]
            ];

            if (inputs.length > 0) {
                lbls[0][1]['cssClass'] = "endpoint-label input";
                anchors['input'][inputs.length - 1].forEach((anchor, inx) => {
                    lbls[0][1]['label'] = inputs[inx].name;
                    let options = Object.assign({}, endPointOptionsInput);

                    options['anchors'] = anchor;
                    options['overlays'] = lbls;
                    options['uuid'] = `${nodeId}/${inputs[inx].id}`;
                    if (inputs[inx].multiplicity !== 'ONE') {
                        options['maxConnections'] = 10;
                        options['paintStyle']['fillStyle'] = 'rgba(228, 87, 46, 1)';
                    }
                    //console.debug('multiplicity', inputs[inx].multiplicity, options['maxConnections'])
                    let endpoint = self.instance.addEndpoint(elem, options);
                    endpoint.canvas.style.zIndex = zIndex - 1;
                    endpoint._jsPlumb.overlays.lbl.canvas.style.zIndex = zIndex - 1;

                    //console.debug(endpoint.zIndex)
                    endpoint.bind('mouseover', self.endPointMouseOver);
                });
            }
            if (outputs.length > 0) {
                lbls[0][1]['cssClass'] = "endpoint-label output";
                anchors['output'][outputs.length - 1].forEach((anchor, inx) => {
                    lbls[0][1]['label'] = outputs[inx].name;
                    let options = JSON.parse(JSON.stringify(endPointOptionsOutput)); //Object.assign({}, endPointOptionsOutput);

                    options['anchors'] = anchor;
                    options['overlays'] = lbls;
                    options['uuid'] = `${nodeId}/${outputs[inx].id}`;
                    if (outputs[inx].multiplicity !== 'ONE') {
                        options['maxConnections'] = 10;
                        options['paintStyle']['fillStyle'] = 'rgba(228, 87, 46, 1)';
                    }
                    let endpoint = self.instance.addEndpoint(elem, options);
                    endpoint.canvas.style.zIndex = zIndex - 1;
                    endpoint._jsPlumb.overlays.lbl.canvas.style.zIndex = zIndex - 1;

                    endpoint.bind('mouseover', self.endPointMouseOver);
                });
            }
            self.instance.draggable(elem, {
                containment: "parent",
                grid: [1, 1],
            });

            let node = { id: nodeId, operation };

            return { elem, node };
        },
        drop(ev) {
            const self = this;
            ev.preventDefault();
            //console.debug(ev.dataTransfer)

            let operation = this.getOperationFromId(ev.dataTransfer.getData('id'))[0];
            //console.debug(operation.icon)
            /* TEST 
            let {elem, node} = self.createNode(self.generateId(),
                operation, ev.target, ev.offsetX, ev.offsetY, [0, 0], 
                'operation', ++ self.currentZIndex);
            // All nodes are stored in global store
            console.debug(node);
            self.addNode(node);
            */
            let classes = operation.categories.map((c) => {
                return c.type.replace(' ', '-');
            }).join(' ');
            self.addNode({
                id: self.generateId(), operation,
                x: ev.offsetX, y: ev.offsetY, zIndex: ++self.currentZIndex, classes
            })

            //console.debug('Vai', ev.dataTransfer.getData('id'))

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
                /*
                let {elem, n} = self.createNode(node.id, operation,
                    document.querySelectorAll(".lemonade .diagram")[0],
                    node.left, node.top, [0, 0], node.type, node.zIndex);
                    */
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

            /*
            let self = this;
            let elems = Array.prototype.slice.call(document.querySelectorAll(".diagram .node"));
            let edges = [];
            let nodes = [];
            let seqZIndex = 10;

            elems.forEach((e) => {
                let pos = e.getBoundingClientRect();
                let title = e.querySelectorAll('strong');
                e.zIndex = e.zIndex || seqZIndex++;
                nodes.push({
                    left: parseInt(e.style.left.replace('px')), //Math.round(pos.left),
                    top: parseInt(e.style.top.replace('px')), //Math.round(pos.top),
                    id: e.id,
                    operationId: e.dataset.operationId,
                    title: e.title || (title.length ? title[0].innerHTML : ''),
                    type: e.classList.contains('data-source') ? 'data-source' : 'operation',
                    zIndex: e.zIndex
                })
            });
            self.instance.getConnections().forEach(e => {
                let sourceEndpoint = e.endpoints[0];
                let targetEndpoint = e.endpoints[1];
                if (sourceEndpoint.isTarget) {
                    let tmp = sourceEndpoint;
                    sourceEndpoint = targetEndpoint;
                    targetEndpoint = tmp;
                }

                let finalEdge = {
                    'source-uuid': sourceEndpoint.getUuid(),
                    'target-uuid': targetEndpoint.getUuid(),
                };
                edges.push(finalEdge);
                //console.debug(finalEdge)
            });
            let result = { nodes, edges };

            let tmp = document.getElementsByTagName('textarea');
            if (tmp.length)
                tmp[0].value = JSON.stringify(result);
            */
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
