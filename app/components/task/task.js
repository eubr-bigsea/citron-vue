import Vue from 'vue';
import template from './task-template.html';
import eventHub from '../app/event-hub';

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
const connectorType = ['Flowchart', 'Bezier', 'StateMachine'][0];
const connectorPaintStyle = {
    lineWidth: 1,
    radius: 8,
    strokeStyle: "#111",
    connector: [connectorType, { curviness: 10 }],
};

const endPointPaintStyle = {
    fillStyle: 'rgba(102, 155, 188, 1)',
    radius: 8,
    height: 15,
    width: 15,
    zIndex: 99
}
const overlays = [
    ["Arrow", { location: .75, width: 12, length: 15 }],
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

const TaskComponent = Vue.extend({
    beforeDestroy() {
        if (this.task && false) {
            this.instance.detachAllConnections(this.task.id);
            this.instance.removeAllEndpoints(this.task.id);
            this.instance.detach(this.task.id);
            let elem = document.getElementById(this.task.id);
            console.debug(elem)
            //elem.parentNode.removeChild(elem);
        }
    },
    computed: {
        'classes': function(){
            return (this.task.status? this.task.status.toLowerCase(): '') + 
                    (this.isComment ? ' comment ': '') + 'test';
        }
    },
    methods: {
        getOperationFromId(id) {
            let operations = this.$store.getters.getOperations;
            let result = operations.filter(v => {
                return v.id === parseInt(id);
            });
            return result.length ? result[0] : null;
        },
        click(ev) {
            let self = this;
            let elem = ev.target.classList.contains('task') ? ev.target : ev.target.parentElement;

            Array.prototype.slice.call(document.querySelectorAll(".task.selected"), 0).forEach((e) => {
                e.classList.remove('selected');
            });
            if (ev.ctrlKey) {
                //this.classList.add('many-selected');
                self.instance.addToDragSelection(this);
            } else if (elem.classList.contains('jsplumb-drag-selected')) {
                //nothing
            } else {
                self.instance.clearDragSelection();
                this.$el.classList.add('selected');
                self.selectedTask = this;
            }
            self.instance.repaintEverything()

            // Raise the click event to upper components
            eventHub.$emit('onclick-task', self);
            ev.stopPropagation();
        },
        endPointMouseOver(endpoint) {
            console.debug('highlight')
        },
        endPointMouseOut(endpoint) {
            console.debug('Out highlight')
        },
        getForeColor(backgroundColor) {
            if (backgroundColor) {
                let d = document.createElement("div");
                d.style.color = backgroundColor.value;
                //document.body.appendChild(d)
                //Color in RGB 
                console.debug(window.getComputedStyle(d).color)
                    //let r, g, b = 
            } else {
                return "#222";
            }
        }
    },
    props: {
        task: {
            'default': function() { return { name: '', icon: '' }; }
        },
        instance: null,
        isComment: {
            default: false
        },
        showDecoration: {
            default: false
        }
    },
    watch: {
        'task.status': function(){
            
        },
        'xtask.operation.name'() {
            let self = this;
            console.debug(this.task.operation);
            this.instance.selectEndpoints(this.elem).each(function(endpoint) {
                let labelOverlay = endpoint.getOverlay("lbl");
                let port = self.task.operation.ports.filter((port) => port.id === endpoint._portId);
                if (port) {
                    labelOverlay.setLabel(port[0].name)
                }
            });
        }
    },
    mounted() {
        let self = this;
        let operation = self.getOperationFromId(this.task.operation.id);
        if (!operation) {
            this.$store.dispatch('raiseComponentException', { msg: 'Invalid operation', code: 'TASK001' });
            return;
        }
        this.task.operation = operation;

        let taskId = this.task.id;

        let zIndex = this.task['z_index'];

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

        let elem = document.getElementById(taskId);
        if (this.task.operation.slug === 'comment') {
            elem.classList.add('comment');
            this.isComment = true;
        }
        [
            [inputs, 'input', endPointOptionsInput],
            [outputs, 'output', endPointOptionsOutput]
        ].forEach((item) => {
            let ports = item[0];
            let portType = item[1];
            let portOptions = item[2];
            lbls[0][1]['cssClass'] = `endpoint-label ${portType}`;

            if (ports.length > 0) {
                anchors[portType][ports.length - 1].forEach((anchor, inx) => {
                    let options = JSON.parse(JSON.stringify(portOptions)); // clone
                    
                    lbls[0][1]['label'] = `<div class="has-${ports.length}-ports">${ports[inx].name}</div>`;
                    options['anchors'] = anchor;
                    options['overlays'] = lbls;
                    
                    if (ports[inx].multiplicity !== 'ONE'){
                        if (portType === 'input'){
                            options['paintStyle']['radius'] = 15;
                            options['paintStyle']['width'] = 15;
                            options['endpoint'] = 'Dot';
                            options['anchors'] = [0.5, -0.2, 0, -1]
                        }
                    }
                    //options['endpoint'] = ports[inx].multiplicity !== 'ONE' ? 'Dot' : options['endpoint'];

                    options['uuid'] = `${taskId}/${ports[inx].id}`;
                    if (ports[inx].multiplicity !== 'ONE') {
                        options['maxConnections'] = 100;
                        // options['paintStyle']['fillStyle'] = 'rgba(228, 87, 46, 1)';
                    }
                    if (ports[inx].interfaces.length && ports[inx].interfaces[0].color) {
                        options['paintStyle']['fillStyle'] = ports[inx].interfaces[0].color;
                    } else {
                        //console.debug(ports[inx].id, operation.id)
                    }

                    let endpoint = self.instance.addEndpoint(elem, options);
                    //endpoint.bind('mouseover', this.endPointMouseOver);
                    //endpoint.bind('mouseout', this.endPointMouseOut);
                    endpoint.canvas.style.zIndex = zIndex - 1;
                    //endpoint.getOverlay('lbl').canvas.style.zIndex = zIndex - 1;
                    endpoint._portId = ports[inx].id;
                });
            }
        });

        self.instance.draggable(elem, {
            containment: "parent",
            grid: [1, 1],
            drag() {
                let elem = document.getElementById(self.task.id);
                self.task.left = elem.offsetLeft;
                self.task.top = elem.offsetTop;
            }
        });
    },
    template,

});
export { TaskComponent, connectionOptions };