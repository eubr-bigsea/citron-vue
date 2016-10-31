import Vue from 'vue';
import store from '../vuex/store';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import template from './diagram-template.html';

import {addTask, removeTask, clearTasks, addFlow, removeFlow, 
    clearFlows, changeWorkflowName, saveWorkflow, changeWorkflowId } from '../vuex/actions';
import { getOperationFromId, getFlows, getTasks, getWorkflow } from '../vuex/getters';
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
            addTask, removeTask, clearTasks,
            addFlow, removeFlow, clearFlows,
            changeWorkflowName, saveWorkflow,
            changeWorkflowId,
        },
        getters: {
            flows: getFlows,
            tasks: getTasks,
            workflow: getWorkflow
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
        'onclick-task': function(taskComponent) {
            this.selectedTask = taskComponent.task;
            // Raise event to parent component 
            this.$dispatch('onclick-task-in-diagram', this.selectedTask);
        },
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
                    if (arr.length > 1 && false) { // @FIXME Review
                        self.instance.detach(con);
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
        doChangeWorkflowName(ev){
            this.changeWorkflowName(ev.target.value);
        },
        doChangeWorkflowId(ev){
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
            if (! operation) {
                return;
            }

            let classes = operation.categories.map((c) => {
                return c.type.replace(' ', '-');
            }).join(' ');
            self.addTask({
                id: self.generateId(), operation, operation_id: operation.id,
                left: ev.offsetX, top: ev.offsetY, z_index: ++self.currentZIndex, classes
            });
            //this.$dispatch('onclick-task-in-diagram', taskComponent);
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
                this.clearSelection(ev);
            }
            this.$dispatch('onclear-selection');
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
            //this.$dispatch('load-workflow');
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
                    left: task.left || task.x, top: task.top || task.y, z_index: ++self.currentZIndex, classes
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
