import Vue from 'vue';
import template from './diagram-template.html';
import { getOperationFromId } from '../vuex/actions'
import store from '../vuex/store';
/*
var anchors = [ "TopCenter", "RightMiddle", "BottomCenter",
                "LeftMiddle", "TopLeft", "TopRight", "BottomLeft",
                "BottomRight" ]
                */
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
    radius: 1,
    strokeStyle: "#111",
    connector: [connectorType, { curviness: 150 }],
};

const endPointPaintStyle = {
    fillStyle: 'rgba(41, 51, 92, 1)',
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
    template,
    props: {
        title: {},
        operation: {
            'default': function () { return { name: '', icon: '' }; }
        },
        selectedNode: null,
        selectedEdge: null,
        zoom: 1
    },
    computed: {
        zoomPercent: function(){
            return `${Math.round(100 * this.zoom, 0)}%`;
        }
    },
    store,
    vuex: {
        actions: {
            getOperationFromId
        }
    },
    components: {
    },
    data() {
        return {
            zoomInEnabled: true,
            zoomOutEnabled: true
        }
    },
    ready() {
        this.zoom = 1.0;
        this.init();
    },
    methods: {
        init() {
            const self = this;
            jsPlumb.bind('ready', function () {
                self.instance = jsPlumb.getInstance({
                    Connector: ['Bezier', { curviness: 50 }],
                    //Anchors: anchors,
                    Endpoints: [["Dot", { radius: 20 }], ["Dot", { radius: 11 }]],
                    EndpointHoverStyle: { fillStyle: "orange" },
                    HoverPaintStyle: { strokeStyle: "blue" },
                });

                window.addEventListener('resize', (e) => {
                    console.debug('Resizing')
                    self.instance.repaintEverything();
                });

                self.instance.setContainer("lemonade-diagram");
                self.instance.getContainer().addEventListener('click', function (ev) {
                    self.clearSelection();
                });
                self.instance.bind("click", self.edgeClick);

                self.instance.bind('connection', function (info) {
                    var con = info.connection;
                    var arr = self.instance.select({ source: con.sourceId, target: con.targetId });
                    if (arr.length > 1) {
                        jsPlumb.detach(con);
                    }
                });
            })
        },
        clearSelection() {
            let self = this;
            let nodes = document.querySelectorAll(".node")
            Array.prototype.slice.call(nodes,0).forEach((e) => {
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
        },
        endPointMouseOver(endpoint, event) {
            //console.debug(endpoint)
        },
        createNode(nodeId, operation, target, x, y, adjust, type) {
            let self = this;

            let elem = document.createElement("div");
            elem.title = operation.description || '';
            elem.dataset.operationId = operation.id;
            elem.tabIndex = 0;
            elem.id = nodeId;
            elem.classList.add(type);
            elem.classList.add("node");
            if (type === 'data-source') {
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

            let rect = target.getBoundingClientRect();
            elem.style.top = y + 'px' //(y - rect.top + adjust[1]) + 'px';
            elem.style.left = x + 'px'//(x - rect.left + adjust[0]) + 'px';

            target.appendChild(elem);
            // @FIXME: See nodeSelect function
            elem.addEventListener('click', function (ev) {
                document.querySelectorAll(".node.selected").forEach(e => {
                    e.classList.remove('selected');
                });
                if (ev.ctrlKey) {
                    //this.classList.add('many-selected');
                    self.instance.addToDragSelection(this);
                } else if (this.classList.contains('jsplumb-drag-selected')){
                    //nothing
                } else {
                    self.instance.clearDragSelection();
                    this.classList.add('selected');
                    self.selectedNode = this;
                }
                self.instance.repaintEverything()
                ev.stopPropagation();
            });
            let outputs = operation.ports.filter((p) => {
                return p.type === 'OUTPUT';
            }).sort((a,b) => {
                return a.order - b.order;
            });
            let inputs = operation.ports.filter((p) => {
                return p.type === 'INPUT';
            }).sort((a,b) => {
                return a.order - b.order;
            });
            var lbls = [
                // note the cssClass and id parameters here
                ["Label", { cssClass: "endpoint-label", label: "", id: "lbl" , padding: 20}]
            ];

            if (inputs.length > 0) {
                lbls[0][1]['cssClass'] = "endpoint-label input";
                anchors['input'][inputs.length - 1].forEach((anchor, inx) => {
                    lbls[0][1]['label'] = inputs[inx].name;
                    let endpoint = self.instance.addEndpoint(elem, {
                        anchors: anchor, overlays:lbls
                    }, endPointOptionsInput);
                    endpoint.bind('mouseover', self.endPointMouseOver);
                });
            }
            if (outputs.length > 0) {
                lbls[0][1]['cssClass'] = "endpoint-label output";
                anchors['output'][outputs.length - 1].forEach((anchor, inx) => {
                    lbls[0][1]['label'] = outputs[inx].name;
                    let endpoint = self.instance.addEndpoint(elem, {
                        anchors: anchor, overlays:lbls
                    }, endPointOptionsOutput);
                    endpoint.bind('mouseover', self.endPointMouseOver);
                });
            }
            self.instance.draggable(elem, {
                containment: "parent",
                grid: [1, 1],
            });
            return elem;
        },
        drop(ev) {
            const self = this;
            ev.preventDefault();
            //console.debug(ev)
            //console.debug(ev.dataTransfer)

            let operation = this.getOperationFromId(ev.dataTransfer.getData('id'))[0];
            //console.debug(operation.icon)
            let elem = self.createNode(self.generateId(),
                operation, ev.target, ev.clientX, ev.clientY, [0, 0], 'operation');

            //console.debug('Vai', ev.dataTransfer.getData('id'))

        },
        allowDrop(ev) {
            ev.preventDefault();
        },

        clear() {
            let self = this;
            /* Clear */
            self.instance.getConnections().forEach(conn => {
                self.instance.detach(conn);
            });
            let nodes = Array.prototype.slice.call(document.querySelectorAll(".diagram .node"), 0); 
            nodes.forEach(node => {
                self.instance.remove(node);
            });
        },
        deleteSelected(ev) {
            let self = this;
            if (self.selectedNode) {
                self.instance.remove(self.selectedNode);
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
        load() {
            let self = this;
            let graph = JSON.parse(
                document.getElementsByTagName('textarea')[0].value);

            self.clear();
            graph.nodes.forEach((node) => {
                //console.debug(node)
                let operation = self.getOperationFromId(node.operationId)[0];
                let elem = self.createNode(node.id, operation,
                    document.querySelectorAll(".lemonade .diagram")[0],
                    node.left, node.top, [0, 0], node.type);
                //console.debug(elem.id);
            });
            graph.edges.forEach((edge) => {
                Object.keys(connectionOptions).forEach(opt => {
                    if (connectionOptions.hasOwnProperty(opt)) {
                        edge[opt] = connectionOptions[opt];
                    }
                });
                edge['xanchors'] = [
                    edge['source-anchor'], edge['target-anchor']
                ];
                edge['anchor'] = edge.anchors;
                //edge['endpointStyle']['fillStyle'] = "yellow";
                //console.debug(edge.source, edge.target)
                self.instance.connect(edge);
            });
        },
        save() {
            let self = this;
            let elems = Array.prototype.slice.call(document.querySelectorAll(".diagram .node"));
            let edges = [];
            let nodes = [];

            elems.forEach(e => {
                let pos = e.getBoundingClientRect();
                let title = e.querySelectorAll('strong');
                nodes.push({
                    left: parseInt(e.style.left.replace('px')), //Math.round(pos.left),
                    top: parseInt(e.style.top.replace('px')), //Math.round(pos.top),
                    id: e.id,
                    operationId: e.dataset.operationId,
                    title: e.title || (title.length ? title[0].innerHTML : ''),
                    type: e.classList.contains('data-source') ? 'data-source' : 'operation'
                })
            });
            self.instance.getConnections().forEach(e => {
                //console.debug(e.endpoints[0].anchor, e.endpoints[1].anchor)
                edges.push({
                    source: e.sourceId,
                    target: e.targetId,
                    "source-anchor": e.endpoints[0].anchor.type,
                    "target-anchor": e.endpoints[1].anchor.type,
                    anchors: e.endpoints.map((endpoint) => {
                        let anchor = endpoint.anchor;
                        let orientation = anchor.getOrientation();
                        return [anchor.x, anchor.y, orientation[0], orientation[1],
                            anchor.offsets[0], anchor.offsets[1]]
                    })
                })
            });
            var result = { nodes, edges };

            document.getElementsByTagName('textarea')[0].value =
                JSON.stringify(result);
            //console.debug(result);
            return
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
        }
    },
});

export default DiagramComponent;
