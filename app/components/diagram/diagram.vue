<template>
    <div tabindex="0">
    <div>
        <div class="row" v-if="showToolbar && showToolbarInternal">
            <div class="col-md-3" style="margin-left: 18px;padding-top:5px">
                <input type="text" placeholder="Unnamed workflow" class="form-control" :value="workflow.name" @keyup="doChangeWorkflowName" />
            </div>
            <div class="col-md-8" v-if="showToolbar">
                <div class="buttons-toolbar btn-group pull-right diagram-toolbar">

                    <button class="btn btn-success btn-sm" v-on:click="saveWorkflow"><span class="fa fa-save"></span> Save</button>
                    <button class="btn btn-primary btn-sm add-margin" v-on:click="onClickExecute"><span class="fa fa-play"></span> Execute</button>

                    <button class="btn btn-default btn-sm" v-on:click="align('left', 'min')" title="Align left"><span class="glyphicon glyphicon-object-align-left"></span></button>
                    <button class="btn btn-default btn-sm" v-on:click="align('left', 'max')" title="Align right"><span class="glyphicon glyphicon-object-align-right"></span></button>

                    <button class="btn btn-default btn-sm" v-on:click="align('top', 'min')" title="Align top"><span class="glyphicon glyphicon-object-align-top"></span></button>
                    <button class="btn btn-default btn-sm add-margin" v-on:click="align('top', 'max')" title="Align bottom"><span class="glyphicon glyphicon-object-align-bottom"></span></button>

                    <drop-down-component :label="'Zoom ('  + zoomPercent + ')'" variant="btn-sm btn-default">
                        <li v-for="z in [.6, .7, .8, .9, 1, 1.1, 1.2, 1.3, 1.4]">
                            <a href="#" v-on:click="setZoomPercent($event, z)" :class="{disabled: zoomPercent === z}"><span class="fa fa-search-plus"></span> Zoom {{Math.round(z * 100)}}%</a>
                        </li>
                    </drop-down-component>

                    <drop-down-component :label="'Tools'" :icon="'fa fa-gears'" variant="btn-sm btn-default">
                        <li>
                            <a href="#" v-on:click.prevent="tsort"><span class="fa fa-save"></span> T-Sort</a>
                        </li>
                        <li>
                            <a href="#" v-on:click.prevent="saveAsImage"><span class="fa fa-download"></span> Save as image</a>
                        </li>
                        <li>
                            <a href="#" v-on:click="deploy"><span class="fa fa-cloud-upload"></span> Generate deploy workflow</a>
                        </li>
                    </drop-down-component>
                </div>
            </div>
        </div>
    </div>
    <div class="lemonade-container" id="lemonade-container">
        <div class="lemonade" v-on:drop="drop" v-on:dragover="allowDrop" id="lemonade-diagram" v-on:click="diagramClick" :show-task-decoration="false" ref="diagram"
             :style="{'pointer-events': showToolbarInternal && showToolbar ? 'auto': 'none'}">
            <task-component v-for="task of tasks" :task="task" :instance="instance" :key="task.id" 
                :show-decoration="showTaskDecoration || showTaskDecorationInternal">
                </task-component>
            <flow-component v-for="flow of flows" :flow="flow" :instance="instance"></flow-component>
            <div class="ghost-select"><span></span></div>
            <ctx-menu-component>
                
            </ctx-menu-component>
        </div>
    </div>
    <modal-component v-if="showExecutionModal" @close="showExecutionModal = false">
        <div slot="header">
            <h4>Execution of workflow</h4>
            Please, complete the required information for the execution of the workflow:
        </div>
        <div class="body" slot="body">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6">
                        <label>Cluster:</label>
                        <select class="form-control">
                            <option value="1">Default</option>
                        </select>
                    </div>
                    <div class="col-md-12">
                        <label>Missing required parameters:</label>
                        <p>
                        There is no missing required parameter
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div slot="footer">
            <button class="btn btn-primary" @click="execute"><span class="fa fa-play"></span> Execute</button>
            <button class="btn btn-danger" @click="cancelExecute">Cancel</button>
        </div>
    </modal-component>

</div>
</template>

<script>
import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';
import PerfectScrollbarCss from 'perfect-scrollbar/dist/css/perfect-scrollbar.css';

import lodash from 'lodash';

import eventHub from '../app/event-hub';

import {
    CleanMissingComponent, DataReaderComponent, EmptyPropertiesComponent,
    SplitComponent, PropertyDescriptionComponent
}
    from '../properties/properties-components.js';

import ModalComponent from '../modal/modal-component.js';
import TaskComponent from '../task/task.vue';
import FlowComponent from '../task/flow.vue';
import CtxMenuComponent from '../ctx-menu/ctx-menu.vue';
import DropDownComponent from '../ui/dropdown.vue';
import html2canvas from 'html2canvas';

/*
import highlight from 'highlight.js';
import highlightCass from 'highlight.js/styles/default.css';
import solarizedDark from 'highlight.js/styles/solarized-dark.css';
*/

import { standUrl, tahitiUrl, authToken } from '../../config';

const DiagramComponent = Vue.extend({
    computed: {
        zoomPercent: function () {
            return `${Math.round(100 * this.zoom, 0)}%`;
        },
        flows() {
            if (this.renderFrom) {
                if (this.renderFrom && this.renderFrom.flows) {
                    return this.renderFrom.flows;
                } else {
                    return {};
                }
            } else {
                return this.$store.getters.getFlows;
            }
        },
        tasks() {
            if (this.renderFrom) {
                if (this.renderFrom && this.renderFrom.tasks) {
                    return this.renderFrom.tasks;
                } else {
                    return {};
                }
            } else {
                return this.$store.getters.getTasks;
            }
        },
        workflow() {
            if (this.renderFrom) {
                return this.renderFrom;
            } else {
                return this.$store.getters.getWorkflow;
            }
        }
    },
    components: {
        'task-component': TaskComponent,
        'flow-component': FlowComponent,
        'property-description-component': PropertyDescriptionComponent,
        'empty-properties-component': EmptyPropertiesComponent,
        'modal-component': ModalComponent,
        'ctx-menu-component': CtxMenuComponent,
        'drop-down-component': DropDownComponent,
    },
    props: {
        formContainer: null,
        title: {},
        renderFrom: null,
        showToolbar: {
            default: true,
        },
        showTaskDecoration: false,
        draggableTasks: true,
        multipleSelectionEnabled: {
            default: true,
        },
        
    },
    watch: {
        draggableTasks() {
            if (!this.draggableTasks) {
                let ids = this.workflow.tasks.map((t) => t.id);
                console.debug(ids);
                this.instance.setDraggable(ids, this.draggableTasks);
            }
        }
    },
    data() {
        return {
            showExecutionModal: false,
            showDeployModal: false,
            zoomInEnabled: true,
            zoomOutEnabled: true,
            selectedTask: null,
            zoom: 1.0,
            selectedElements: [],
            deployInfo: {},
            showToolbarInternal: true,
            showTaskDecorationInternal: false,
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
        eventHub.$on('oncancel-deploy', () => {
            this.setZoomPercent(null, this.oldZoom);
            this.showToolbarInternal = true;
            this.showTaskDecorationInternal = false;
        });
        eventHub.$on('onremove-task', (task) => {
            this.removeTask(task);
        });
        eventHub.$on('xupdate-form-field-value', (field, value) => {
            eventHub.$emit('update-form-field-value-in-diagram', field, value);
            this.updateAttributeSuggestion();
        });
        eventHub.$on('onstart-flow', (interfaceName) => {
            let sourceInterfaces = new Set(interfaceName.split(' '));
            let endPoints = this.instance.selectEndpoints();
            endPoints.each((endPoint) => {
                if (endPoint.isTarget) {
                    let targetInterfaces = endPoint.scope.split(' ');
                    let intersection = targetInterfaces.filter(Set.prototype.has, sourceInterfaces);

                    if (intersection.length > 0){
                        endPoint.element.classList.add('selected');
                    }
                }
            });
        });
        eventHub.$on('onstop-flow', (interfaceName) => {
            let endPoints = this.instance.selectEndpoints();
            endPoints.each((endPoint) => {
                if (endPoint.isTarget){
                    endPoint.element.classList.remove('selected');
                }
            });
        });
    },
    mounted() {

        this.$root.$refs.toastr.defaultPosition = 'toast-bottom-full-width';
        this.currentZIndex = 10;
        this.init();
        let self = this;

        self.diagramElement = document.getElementById('lemonade-diagram');
        this.setZoom(self.zoom, self.instance, null, self.diagramElement);

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
        deploy(ev){
            eventHub.$emit('onshow-deploy');
            this.oldZoom = this.zoom;
            this.setZoomPercent(ev, 0.7);
            this.showToolbarInternal = false;
            this.showTaskDecorationInternal = true;
            if (false){
                let self = this;
                let dataSources = self.tasks.filter((task) => {
                    return task.operation.categories.filter((cat) => {
                        return cat.type === 'data source';
                    }).length > 0;
                });
                let ports = self.tasks.map((task) => {
                    let dataPorts = task.operation.ports.filter((port) => {
                        let itfs = port.interfaces.filter((iface) => {
                            return iface.name === 'Data' || iface.name === 'IData';
                        });
                        return itfs.length > 0 && port.type === 'OUTPUT';
                    });
                    return [task, dataPorts];
                });
                self.showDeployModal = true;
                self.deployInfo['dataSources'] = dataSources;
                self.deployInfo['ports'] = ports;
            }
            ev.preventDefault();
            return false;
        },
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
        saveAsImage(){
            let self = this;
            html2canvas(this.$refs.diagram, {
                onrendered: function(canvas) {
                    let ctx = canvas.getContext('2d');
                    let b64Start = 'data:image/svg+xml;base64,';
                    
                    /*
                    let $flows = document.getElementsByClassName('jsplumb-connector');
                    for (var flow of $flows){
                        let svg64 = btoa(flow.outerHTML);
                        // prepend a "header"
                        let image64 = b64Start + svg64;
                        let img = new Image();
                        img.onload = () => {
                            console.debug(flow.style.left, flow.style.top)
                            ctx.drawImage(img, flow.style.left, flow.style.top);
                        };
                        // set it as the source of the img element
                        img.src = image64;
                    }*/
                    let $endpoints = document.querySelectorAll('.jsplumb-endpoint > svg')
                    for (var endpoint of $endpoints){
                        let xml = new XMLSerializer().serializeToString(endpoint);
                        let svg64 = btoa(xml);
                        // prepend a "header"
                        let image64 = b64Start + svg64;
                        let img = new Image();
                        document.body.appendChild(img);
                        img.onload = (ev) => {
                            console.debug(endpoint.style.left, flow.style.top)
                            ctx.drawImage(ev.target, endpoint.style.left, endpoint.style.top);
                        };
                        // set it as the source of the img element
                        img.src = image64;
                    }
                    /*
                    $endpoints = $('._jsPlumb_endpoint > svg', el);
                    $endpoints.each(function() {
                        $svg = $(this)
                        offset = $svg.parent().position();
                        svgStr = this.outerHTML;
                        ctx.drawSvg(svgStr, offset.left, offset.top);
                    });
                    //# Convert canvas to Blob
                    canvas.toBlob(function(blob) {
                        //# Download Blob canvas
                        saveAs(blob, 'teste.png')
                    });
                    */
                    //document.body.appendChild(canvas);
                }
            });
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
            let self = this;
            this.$store.dispatch('saveWorkflow').then(() => {
                self.$root.$refs.toastr.s(`Workflow saved`);
            }).catch((err) => {
                self.$root.$refs.toastr.e('Error saving workflow');
            });
        },
        changeWorkflowId(id) {
            this.$store.dispatch('changeWorkflowId', id);
        },
        getOperationFromId(id) {
            let operations = this.$store.getters.getOperations;
            let result = operations.filter(v => {
                return v.id === parseInt(id);
            });
            return result;
        },
        init() {
            const self = this;
            if (self.instance && self.showToolbar) {
                this.instance.reset();
            }
            self.instance = jsPlumb.getInstance({
                //Anchors: anchors,
                Endpoints: [["Dot", { radius: 2 }], ["Dot", { radius: 1 }]],
                EndpointHoverStyle: { fillStyle: "orange" },
                HoverPaintStyle: { strokeStyle: "blue" },
            });
            //self.instance.setRenderMode(jsPlumb.CANVAS);
            window.addEventListener('resize', (e) => {
                self.instance.repaintEverything();
            });
            self._bindJsPlumbEvents();

        },
        selectElements(ev) {
            if (this.multipleSelectionEnabled) {
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
                                self.selectedElements.push(task.id);
                            }
                            //console.debug (bounds.left, task.left)
                            //console.debug(task)
                        });
                    });
                }
            }
        },
        openSelector(ev) {
            if (ev.which === 1 && this.multipleSelectionEnabled) { //left mouse
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
            self.selectedElements.length = 0;
            Array.prototype.slice.call(tasks, 0).forEach((e) => {
                e.classList.remove('selected');
                //self.instance.clearDragSelection();
                self.selectedTask = null;
                self.selectedFlow = null;
            });
            eventHub.$emit('onblur-selection');
        },
        doChangeWorkflowName(ev) {
            this.changeWorkflowName(ev.target.value);
        },
        doChangeWorkflowId(ev) {
            /** Debug */
            this.changeWorkflowId(ev.target.value);
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
        },
        allowDrop(ev) {
            ev.preventDefault();
        },

        clear() {
            let self = this;
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
                    case 'ArrowLeft':load-workflow
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
        setZoomPercent(ev, zoom) {
            let self = this;
            self.zoom = zoom;
            this.setZoom(self.zoom, self.instance, null, self.diagramElement);
            if (ev){
                ev.preventDefault();
            }
            return false;
        },
        zoomIn(ev) {
            let self = this;
            self.zoom += .1;
            if (self.zoom > 1.3) {
                self.zoomInEnabled = false;
            }
            self.zoomOutEnabled = true;
            this.setZoom(self.zoom, self.instance, null, self.diagramElement);
            ev.preventDefault();
            return false;
        },
        zoomOut(ev) {
            let self = this;
            self.zoom -= .1;
            if (self.zoom < 0.8) {
                self.zoomOutEnabled = false;
            }
            self.zoomInEnabled = true;
            this.setZoom(self.zoom, self.instance, null, self.diagramElement);
            ev.preventDefault();
            return false;
        },
        align(pos, fn) {
            let self = this;
            let selectedTasks = this.workflow.tasks.filter((task) => {
                return lodash.includes(this.selectedElements, task.id);
            })
            if (selectedTasks.length) {
                let minPosTask = selectedTasks.reduce((prev, cur, inx, arr) => {
                    if (fn === 'min') {
                        return prev[pos] < cur[pos] ? prev : cur;
                    } else {
                        return prev[pos] > cur[pos] ? prev : cur;
                    }
                });
                selectedTasks.forEach((task, inx) => {
                    task[pos] = minPosTask[pos];
                });
                Vue.nextTick(function () {
                    self.instance.repaintEverything();
                })
            }
        },
        scrollToTask(taskId) {
            let elemTask = document.getElementById(taskId);
            let container = self.diagramElement.parentElement;
            container.scrollTop = parseInt(elemTask.style.top);
            container.scrollLeft = parseInt(elemTask.style.left);
        },
        cancelExecute() {
            this.showExecutionModal = false;
        },
        execute() {
            this.showExecutionModal = false;

            let cloned = JSON.parse(JSON.stringify(this.workflow));
            cloned.platform_id = 1; //FIXME
            cloned.tasks.forEach((task) => {
                task.operation = { id: task.operation.id };
                delete task.version;
            });

            let body = {
                workflow: cloned,
                cluster: { id: 1 },
                user: { id: 13, login: 'war', name: 'Sun Tzu' }
            }
            let self = this;
            let headers = { 'X-Auth-Token': authToken };
            Vue.http.post(`${standUrl}/jobs`, body, { headers })
                .then(function (response) {
                    self.$router.push({
                        name: 'job-child-diagram',
                        params: { id: response.body.data.id }
                    });
                }).catch((ex) => {
                    if (ex.body) {
                        self.$root.$refs.toastr.e(ex.body.message);
                    } else {
                        debugger
                    }
                });
        },
        onClickExecute() {
            this.showExecutionModal = true;
        },
        _bindJsPlumbEvents() {
            let self = this;
            self.instance.setContainer("lemonade-diagram");

            // self.instance.getContainer().addEventListener('click', function (ev) {
            //     //self.clearSelection(ev);
            // });
            // self.instance.bind("click", self.flowClick);

            self.instance.bind('connectionDetached', (info, originalEvent) => {
                let source = info.sourceEndpoint.getUuid();
                let target = info.targetEndpoint.getUuid();

                self.removeFlow(source + '-' + target);
            });
            self.instance.bind('connectionMoved', (info, originalEvent) => {
                let source = info.originalSourceEndpoint.getUuid();
                let target = info.originalTargetEndpoint.getUuid();

                self.removeFlow(source + '-' + target);

                let [source_id, source_port] = info.newSourceEndpoint.getUuid().split('/');
                let [target_id, target_port] = info.newTargetEndpoint.getUuid().split('/');
                self.addFlow({
                    source_id, source_port,
                    target_id, target_port,
                });
            });
            /*
            self.instance.bind('beforeDrop', (info) => {
              console.debug(info.sourceId !== info.targetId);
              return info.sourceId !== info.targetId;
            });
            */

            self.instance.bind('connection', (info, originalEvent) => {
                let con = info.connection;
                var arr = self.instance.select({ source: con.sourceId, target: con.targetId });
                if (false && arr.length > 1) { // @FIXME Review
                    // self.instance.detach(con);
                //} else if (con.targetId === con.sourceId) {
                //    self.instance.detach(con);
                } else if (originalEvent) {
                    //self.instance.detach(con);
                    let [source_id, source_port] = info.sourceEndpoint.getUuid().split('/');
                    let [target_id, target_port] = info.targetEndpoint.getUuid().split('/');
                    self.instance.detach(con);
                    self.addFlow({
                        source_id, source_port,
                        target_id, target_port,
                    });
                }
            });
        },
        
        updateAttributeSuggestion(){
            let attributeSuggestion = {};
            TahitiAttributeSuggester.compute(this.workflow, this._queryDataSource, 
                (result) => { 
                    Object.keys(result).forEach(key => {
                        attributeSuggestion[key] = result[key].uiPorts;
                    });
                    eventHub.$emit('update-attribute-suggestion', attributeSuggestion);
                });
        },
        tsort(ev) {
            let tasksInfo = {}, // hash: stringified id of the task => { id: id, _targets: lisf of ids }
                sorted = [], // sorted list of IDs ( returned value )
                visited = {}; // hash: id of already visited task => true

            this.tasks.forEach((task) => { 
                task.uiPorts = {inputs: [], output: []};
                tasksInfo[task.id] = {targets: [], task: task};
            });
            this.flows.forEach((flow) => {
                tasksInfo[flow.source_id].targets.push({
                    target: flow.target_id, 
                    targetPortId: flow.target_port
                });
            });
            // 2. topological sort
            Object.keys(tasksInfo).forEach(function visit(taskId, ancestors) {
                var task = tasksInfo[taskId];

                // if already exists, do nothing
                if (visited[taskId]) return;

                if (!Array.isArray(ancestors)) ancestors = [];

                ancestors.push(taskId);

                visited[taskId] = true;

                task.targets.forEach(function (after) {
                    if (ancestors.indexOf(after) >= 0)  // if already in ancestors, a closed chain exists.
                        throw new Error('closed chain : ' + after.target + ' is in ' + taskId);
                    visit(after.target.toString(), ancestors.map(function (v) { return v })); // recursive call
                });
                sorted.unshift(taskId);
            });
            let cloneAndFlat = function(listOfAttrs){
                return Array.prototype.concat.apply([], listOfAttrs.slice().map(
                    function(item) {return item.attributes;}));
            }
            sorted.forEach((k) => {
                switch(tasksInfo[k].task.operation.slug){
                    case 'data-reader':
                        tasksInfo[k].task.uiPorts.output = ['_a_','_b_', '_c_']
                        break;
                    case 'aggregation':
                        tasksInfo[k].task.uiPorts.output = tasksInfo[k].task.forms.attributes.value.slice()
                        Array.prototype.push.apply(tasksInfo[k].task.uiPorts.output, 
                            tasksInfo[k].task.forms.function.value.map((v) => {return v.alias}));
                        break;
                    case 'apply-model':
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        tasksInfo[k].task.uiPorts.output.push(tasksInfo[k].task.forms.prediction.value);
                        break
                    case 'comment':
                        return;
                    case 'feature-indexer':
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        let aliases = [];
                        if (tasksInfo[k].task.forms.alias.value){
                            aliases = tasksInfo[k].task.forms.alias.value.split(',').map((v) => {return v.trim()});
                        }
                        if (tasksInfo[k].task.forms.attributes.value){
                            while(tasksInfo[k].task.forms.attributes.value.length > aliases.length){
                                let attr = tasksInfo[k].task.forms.attributes.value[aliases.length];
                                aliases.push(`${attr}_indexed`)
                            }
                        }
                        Array.prototype.push.apply(tasksInfo[k].task.uiPorts.output, aliases);
                        break;
                    case 'transformation':
                    case 'feature-assembler':
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        tasksInfo[k].task.uiPorts.output.push(tasksInfo[k].task.forms.alias.value);
                        break;
                    case 'add-rows':
                        /* Columns from first data set */
                        let inputs = tasksInfo[k].task.uiPorts.inputs.filter(
                            function(input) { 
                                return parseInt(input.targetPortId) === 5; //hard coded id for 'input data 1' 
                            }) || [];
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(inputs);
                        break;
                    case 'add-columns':
                    case 'join':
                        /* Group attributes by name */
                        let groupedFields = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs).reduce((acc, val) => {
                            (acc[val] = acc[val] || []).push(val);
                            return acc;
                        }, {});
                        /* Change the name of duplicated attributes, suffixing a number */
                        let result = [];
                        for(var property in groupedFields) {
                            if (groupedFields.hasOwnProperty(property)) {
                                if (groupedFields[property].length > 1){
                                    for(var i = 0; i < groupedFields[property].length - 1; i++){
                                        result.push(property + i);
                                    }
                                } else {
                                    result.push(property);
                                }
                            }
                        }
                        //tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        tasksInfo[k].task.uiPorts.output = result;
                        break;
                    case 'projection':
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        Array.prototype.push.apply(tasksInfo[k].task.uiPorts.output, tasksInfo[k].task.forms.attributes);
                        break;
                    case 'difference':
                    case 'set-intersection':
                    case 'clean-missing':
                        /* It is not possible to know which attribute will be removed, so, keep them all */
                    case 'split':
                    case 'sample':
                    case 'sort': 
                    case 'remove-duplicated-rows':
                    case 'filter-selection':
                    case 'replace-value':
                        tasksInfo[k].task.uiPorts.output = cloneAndFlat(tasksInfo[k].task.uiPorts.inputs);
                        break;
                    case 'classification-model':
                        /*
                        Array.prototype.push.apply(tasksInfo[k].task.uiPorts.output, 
                            tasksInfo[k].task.forms.features.value);
                        Array.prototype.push.apply(tasksInfo[k].task.uiPorts.output, 
                            tasksInfo[k].task.forms.label.value);
                        */
                        break;

                }
                tasksInfo[k].targets.forEach((follow) => {
                    tasksInfo[follow.target].task.uiPorts.inputs.push(
                        {targetPortId: follow.targetPortId, 
                            attributes: tasksInfo[k].task.uiPorts.output});
                    /*console.debug(tasksInfo[k].task.operation.slug, '=>',
                        tasks[follow].task.operation.slug, ': ', tasksInfo[k].task.uiPorts.output,
                        tasks[follow].task.uiPorts.inputs);*/
                });
                /*
                console.debug(`|${tasksInfo[k].task.operation.slug}|`, 
                        Array.from(new Set(tasksInfo[k].task.uiPorts.inputs)),
                        tasksInfo[k].task.uiPorts.inputs);
                        */
                console.debug(`|${tasksInfo[k].task.operation.slug}|`, 
                        tasksInfo[k].task.uiPorts.inputs,
                        tasksInfo[k].task.uiPorts.output);
            });
        }
    },
});

export default DiagramComponent;

</script>
