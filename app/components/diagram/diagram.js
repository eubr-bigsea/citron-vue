import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import template from './diagram-template.html';

import eventHub from '../app/event-hub';

import {
    CleanMissingComponent, DataReaderComponent, EmptyPropertiesComponent,
    SplitComponent, PropertyDescriptionComponent
}
    from '../properties/properties-components.js';
import { TaskComponent, connectionOptions } from '../task/task';
import FlowComponent from '../task/flow';

import highlight from 'highlight.js';
import highlightCass from 'highlight.js/styles/default.css';
import solarizedDark from 'highlight.js/styles/solarized-dark.css';

const DiagramComponent = Vue.extend({
    computed: {
        zoomPercent: function () {
            return `${Math.round(100 * this.zoom, 0)}%`;
        },
        flows() {
            return this.$store.getters.getFlows;
        },
        tasks() {
            return this.$store.getters.getTasks;
        },
        workflow() {
            return this.$store.getters.getWorkflow;
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
        title: {},
        xoperation: {
            'default': function () { return { name: '', icon: '' }; }
        },

    },
    data() {
        return {
            zoom: 1,
            zoomInEnabled: true,
            zoomOutEnabled: true,
            selectedTask: null,
        }
    },
    created() {
        if (this.$route.params.id) {
            this.changeWorkflowId(this.$route.params.id);
            //this.loadWorkflow();
            this.init();
        }
        eventHub.$on('onclick-task', (taskComponent) => {
            this.selectedTask = taskComponent.task;
        });
    },
    events: {
        'onclick-task': function (taskComponent) {
            this.selectedTask = taskComponent.task;
            // Raise event to parent component 
            this.$emit('onclick-task-in-diagram', this.selectedTask);
        },
        'onclick-operationx': function (operationComponent) {
            let self = this;
            this.selectedTask = operationComponent.task;
            
            if (self.currentComponent == 'property-description-component') {
                self.currentComponent = 'empty-properties-component';
            } else {
                self.currentComponent = 'property-description-component';
            }
            if (self.currentForm) {
                //self.currentForm.$destroy(); FIXME
            }
        },
        'onclick-operation2': function (operationComponent) {
            this.selectedTask = operationComponent.task;
            let elem = document.getElementById(this.formContainer);
            elem.innerHTML = '<div><h5>{{task.operation.name}}</h5><form-component :task="task"></form-component><property-description-component :task="task"/></div>';
            if (self.currentForm) {
                self.currentForm.$destroy();
            }
            self.currentForm = new Vue({
                el: `#${this.formContainer}`,
                components: {
                    'form-component': slug2Component[operationComponent.task.operation.slug]
                    || EmptyPropertiesComponent,
                    'property-description-component': PropertyDescriptionComponent
                },
                destroyed() {
                    // console.debug('form destroyed')
                },
                data() {
                    return {
                        task: operationComponent.task,
                    }
                }
            });
        }
    },
    template,
    mounted() {
        this.zoom = 1.0;
        this.currentZIndex = 10;
        this.init();
        let self = this;
        self.diagramElement = document.getElementById('lemonade-diagram');
        /* scroll bars */
        PerfectScrollbar.initialize(self.diagramElement.parentElement);

        this.$el.addEventListener('keyup', this.keyboardAction, true);
        /* selection by dragging */
        self.diagramElement.addEventListener("mousedown", (ev) => {
            self.clearSelection(ev);
            let ghostSelect = document.getElementsByClassName('ghost-select');
            if (ghostSelect.length) {
                Array.prototype.slice.call(ghostSelect, 0).forEach((elem) => {
                    elem.classList.add("ghost-active");
                    elem.style.left = ev.offsetY + 'px';
                    elem.style.top = ev.offsetX + 'px';
                    elem.style.width = '0px';
                    elem.style.height = '0px';
                    // console.debug('Initial', ev.offsetX, ev.offsetY)
                })
            } else {
                console.error('ghost-select element not found!')
            }
            self.initialW = ev.offsetX;
            self.initialH = ev.offsetY;

            document.addEventListener("mouseup", self.selectElements);
            document.addEventListener("mousemove", self.openSelector);
        });
    },
    methods: {
        /* Store */
        addTask(task) {
            this.$store.dispatch('addTask', task)
        },
        removeTask(task) {
            let self = this;
            this.instance.detachAllConnections(task.id);
            this.instance.removeAllEndpoints(task.id);
            this.instance.detach(task.id);
            let elem = document.getElementById(task.id)
            //elem.parentNode.removeChild(elem);

            console.debug(this.instance.getConnections());
            this.instance.repaintEverything();
            
            Vue.nextTick(function () {
                self.$store.dispatch('removeTask', task);
            })

        },
        clearTasks() {
            this.$store.dispatch('clearTasks');
        },
        addFlow(flow) {
            this.$store.dispatch('addFlow', flow)
        },
        removeFlow(flow) {
            this.$store.dispatch('removeFlow', flow);
        },
        clearFlows() {
            this.$store.dispatch('clearFlow');
        },
        changeWorkflowName(name) {
            this.$store.dispatch('changeWorkflowName', name)
        },
        saveWorkflow() {
            this.$store.dispatch('saveWorkflow');
        },
        loadWorkflow() {
            this.$store.dispatch('loadWorkflow');
        },
        changeWorkflowId(id) {
            this.$store.dispatch('changeWorkflowId', id);
        },
        /*--*/
        getOperationFromId(id) {
            let operations = this.$store.getters.getOperations;
            let result = operations.filter(v => {
                return v.id === parseInt(id);
            });
            return result;
        },
        init() {
            const self = this;
            if (self.instance) {
                 this.instance.reset();
            }
            self.instance = jsPlumb.getInstance({
                //Anchors: anchors,
                Endpoints: [["Dot", { radius: 2 }], ["Dot", { radius: 1 }]],
                EndpointHoverStyle: { fillStyle: "orange" },
                HoverPaintStyle: { strokeStyle: "blue" },
            });
            window.addEventListener('resize', (e) => {
                self.instance.repaintEverything();
            });
            self._bindJsPlumbEvents();

            

        },
        selectElements(ev) {
            //$("#score>span").text('0');
            let self = this;
            document.removeEventListener("mousemove", self.openSelector);
            document.removeEventListener("mouseup", self.selectElements);

            self.initialW = 0;
            self.initialH = 0;

            let ghostSelect = document.getElementsByClassName('ghost-select');
            if (ghostSelect.length) {
                Array.prototype.slice.call(ghostSelect, 0).forEach((elem) => {
                    let x1 = parseInt(elem.style.left);
                    let y1 = parseInt(elem.style.top);
                    let x2 = parseInt(elem.style.width) + x1;
                    let y2 = parseInt(elem.style.height) + y1;

                    elem.classList.remove("ghost-active");
                    elem.style.width = 0;
                    elem.style.height = 0;

                    this.$emit('onclear-selection');

                    self.tasks.forEach((task) => {
                        let taskElem = document.getElementById(task.id);
                        let bounds = taskElem.getBoundingClientRect();

                        // Uses task left and top because offset calculation 
                        // was already done
                        /*console.debug(x1 <= task.left,  x2 >= task.left + bounds.width, 
                                y1 <= task.top, y2 >= task.top + bounds.height,
                                bounds.width, bounds.height, x1, x2, y1, y2)
                                */
                        if (x1 <= task.left && x2 >= task.left + bounds.width
                            && y1 <= task.top && y2 >= task.top + bounds.height) {
                            // console.debug(`overlap with ${task.operation.name}`)
                            self.instance.addToDragSelection(task.id);
                        }
                        //console.debug (bounds.left, task.left)

                        //console.debug(task)
                    });
                });
            }
        },
        openSelector(ev) {
            if (ev.which == 1) { //left mouse
                let self = this;
                let rect = this.diagramElement.getBoundingClientRect();
                let x = ev.pageX - rect.left;
                let y = ev.pageY - rect.top;
                let w = Math.abs(self.initialW - x);
                let h = Math.abs(self.initialH - y);

                let ghostSelect = document.getElementsByClassName('ghost-select');
                if (ghostSelect.length) {
                    Array.prototype.slice.call(ghostSelect, 0).forEach((elem) => {
                        elem.style.width = w + 'px';
                        elem.style.height = h + 'px';

                        elem.style.left = Math.min(x, self.initialW) + 'px';
                        elem.style.top = Math.min(y, self.initialH) + 'px';
                        /*
                        if (ev.offsetX <= self.initialW && ev.offsetY >= self.initialH) {
                        elem.style.left = ev.offsetX + 'px';
                        } else if (ev.offsetY <= self.initialH && ev.offsetX >= self.initialW) {
                            elem.style.top = ev.offsetY + 'px';
                        } else if (ev.offsetY < self.initialH && ev.offsetX < self.initialW) {
                            elem.style.left = ev.offsetX + 'px';
                            elem.style.top = ev.offsetY + 'px';
                            //console.debug('3bopenselector (x, y)', ev.offsetX, ev.offsetY, elem.style.left, elem.style.top)
                        }*/

                    });
                } else {
                    // console.error('ghost-select element not found!')
                }
            }
        },
        clearSelection(ev) {
            if (ev.target.taskName === 'path') {
                // click on flow
                return;
            }
            let self = this;
            let tasks = document.querySelectorAll(".task");
            self.instance.clearDragSelection();
            Array.prototype.slice.call(tasks, 0).forEach((e) => {
                e.classList.remove('selected');
                self.instance.clearDragSelection();
                self.selectedTask = null;
                self.selectedFlow = null;
            });
        },
        doChangeWorkflowName(ev) {
            this.changeWorkflowName(ev.target.value);
        },
        doChangeWorkflowId(ev) {
            /** Debug */
            this.changeWorkflowId(ev.target.value);
        },
        /*
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
        },*/

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
            if (!operation) {
                return;
            }

            let classes = operation.categories.map((c) => {
                return c.type.replace(' ', '-');
            }).join(' ');
            self.addTask({
                id: self.generateId(), operation, operation_id: operation.id,
                left: ev.offsetX, top: ev.offsetY, z_index: ++self.currentZIndex, classes,
                status: 'WAITING'
            });
            //this.$emit('onclick-task-in-diagram', taskComponent);
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
        keyboardAction(ev) {
            let self = this;
            if (self.selectedTask) {
                let elem = document.getElementById(self.selectedTask.id);
                let inc = ev.ctrlKey ? 10 : 1;
                let v = 0;
                switch (ev.code) {
                    case 'Delete':
                        this.deleteSelected();
                        break;
                    case 'ArrowRight':
                        v = parseInt(elem.style.left, 10) + inc;
                        elem.style.left = `${v}px`;
                        self.selectedTask.left = v;
                        self.instance.repaintEverything();
                        break
                    case 'ArrowLeft':
                        v = parseInt(elem.style.left, 10) - inc;
                        elem.style.left = `${v}px`;
                        self.selectedTask.left = v;
                        self.instance.repaintEverything();
                        break
                    case 'ArrowUp':
                        v = parseInt(elem.style.top, 10) - inc;
                        elem.style.top = `${v}px`;
                        self.selectedTask.top = v;
                        self.instance.repaintEverything();
                        break
                    case 'ArrowDown':
                        v = parseInt(elem.style.top, 10) + inc;
                        elem.style.top = `${v}px`;
                        self.selectedTask.top = v;
                        self.instance.repaintEverything();
                        break
                }
                ev.stopPropagation();
            }
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
                this.clearSelection(ev);
            }
            this.$emit('onclear-selection');
        },
        generateId() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        load(ev) {
            console.debug('Reseting')
            this.instance.reset();
            this._bindJsPlumbEvents();
            //let graph = JSON.parse(document.getElementById('save-area').value);
            this.loadWorkflow();
            //this.innerLoad(graph);
            //this.$emit('load-workflow');
        },
        innerLoad(graph) {
            let self = this;
            this.changeWorkflowName(graph.name);
            this.changeWorkflowId(graph.id);
            self.clear();
            graph.tasks.forEach((task) => {
                let operation = self.getOperationFromId(task['operation']['id'])[0];
                let classes = operation.categories.map((c) => {
                    return c.type.replace(' ', '-');
                }).join(' ');
                self.addTask({
                    id: task.id, operation, operation_id: operation.id,
                    left: task.left || task.x, top: task.top || task.y, z_index: ++self.currentZIndex, classes,
                    status: 'WAITING',
                });

            });
            graph.flows.forEach(self.addFlow);
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
            let adjust = ((1.0 / zoom) * 5000) + 'px'
            el.style.width = adjust;
            el.style.height = adjust;
            PerfectScrollbar.update(this.diagramElement.parentElement);
        },
        zoomIn(ev) {
            let self = this;
            self.zoom += .1;
            if (self.zoom > 1.3) {
                self.zoomInEnabled = false;
            }
            self.zoomOutEnabled = true;
            this.setZoom(self.zoom, self.instance, null, self.diagramElement);
            return;
        },
        zoomOut() {
            let self = this;
            self.zoom -= .1;
            if (self.zoom < 0.8) {
                self.zoomOutEnabled = false;
            }
            self.zoomInEnabled = true;
            this.setZoom(self.zoom, self.instance, null, self.diagramElement);
            return;
        },
        scrollToTask(taskId) {
            let elemTask = document.getElementById(taskId);
            let container = self.diagramElement.parentElement;
            container.scrollTop = parseInt(elemTask.style.top);
            container.scrollLeft = parseInt(elemTask.style.left);
        },
        _bindJsPlumbEvents() {
            let self = this;
            self.instance.setContainer("lemonade-diagram");

            // self.instance.getContainer().addEventListener('click', function (ev) {
            //     //self.clearSelection(ev);
            // });
            // self.instance.bind("click", self.flowClick);

            self.instance.bind('connectionDetached', (info, originalEvent) => {
                if (originalEvent){
                    let source = info.sourceEndpoint.getUuid();
                    let target = info.targetEndpoint.getUuid();

                    self.removeFlow(source + '-' + target);
                    console.debug('Removendo via connectionDetached', originalEvent)
                }
            });
            self.instance.bind('connection', (info, originalEvent) => {
                let con = info.connection;
                var arr = self.instance.select({ source: con.sourceId, target: con.targetId });
                if (false && arr.length > 1) { // @FIXME Review
                    // self.instance.detach(con);
                } else if (originalEvent) {
                    self.instance.detach(con);
                    let [source_id, source_port] = info.sourceEndpoint.getUuid().split('/');
                    let [target_id, target_port] = info.targetEndpoint.getUuid().split('/');
                    self.addFlow({
                        source_id, source_port,
                        target_id, target_port,
                    });
                }
            });
        },
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
