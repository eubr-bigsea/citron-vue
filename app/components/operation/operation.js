import Vue from 'vue';
import template from './operation-template.html';

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

const OperationComponent = Vue.extend({
    beforeDestroy() {
        if (this.node) {
            this.instance.remove(document.getElementById(this.node.id));
        }
    },
    methods: {
        click(ev) {
            let self = this;
            let elem = ev.target.classList.contains('node') ? ev.target : ev.target.parentElement;
            
            Array.prototype.slice.call(document.querySelectorAll(".node.selected"), 0).forEach((e) => {
                e.classList.remove('selected');
            });
            if (ev.ctrlKey) {
                //this.classList.add('many-selected');
                self.instance.addToDragSelection(this);
            } else if (elem.classList.contains('jsplumb-drag-selected')) {
                //nothing
            } else {
                self.instance.clearDragSelection();
                elem.classList.add('selected');
                self.selectedNode = this;
            }
            self.instance.repaintEverything()
            
            // Raise the click event to upper components
            self.$dispatch('onclick-task', self);
            ev.stopPropagation();
        }
    },
    props: {
        node: {
            'default': function () { return { name: '', icon: '' }; }
        },
        instance: null
    },
    ready() {
        let self = this;
        let operation = this.node.operation;
        let nodeId = this.node.id;
        let elem = document.getElementById(nodeId);
        let zIndex = this.node.zIndex;

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

        [[inputs, 'input', endPointOptionsInput], [outputs, 'output', endPointOptionsOutput]].forEach((item) => {
            let ports = item[0];
            let portType = item[1];
            let portOptions = item[2];
            lbls[0][1]['cssClass'] = `endpoint-label ${portType}`;

            if (ports.length > 0) {
                anchors[portType][ports.length - 1].forEach((anchor, inx) => {
                    lbls[0][1]['label'] = ports[inx].name;
                    let options = JSON.parse(JSON.stringify(portOptions));;

                    options['anchors'] = anchor;
                    options['overlays'] = lbls;
                    options['uuid'] = `${nodeId}/${ports[inx].id}`;
                    if (ports[inx].multiplicity !== 'ONE') {
                        options['maxConnections'] = 10;
                        options['paintStyle']['fillStyle'] = 'rgba(228, 87, 46, 1)';
                    }
                    let endpoint = self.instance.addEndpoint(elem, options);
                    endpoint.canvas.style.zIndex = zIndex - 1;
                    endpoint._jsPlumb.overlays.lbl.canvas.style.zIndex = zIndex - 1;
                });
            }
        });

        self.instance.draggable(elem, {
            containment: "parent",
            grid: [1, 1],
        });
    },
    template,

});
export {OperationComponent, connectionOptions};
