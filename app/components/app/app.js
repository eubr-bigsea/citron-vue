import Vue from 'vue';
import PerfectScrollbar from 'perfect-scrollbar';

import template from './app-template.html';
import store from '../vuex/store';

import eventHub from './event-hub';
import html2canvas from 'html2canvas';

import DiagramComponent from '../diagram/diagram.vue';
import ToolbarComponent from '../toolbox/toolbox';
//import LoadWorkflowComponent from '../load-workflow/load-workflow';
import _ from 'lodash'

import {standUrl, tahitiUrl, authToken, caipirinhaUrl, limoneroUrl} from '../../config';
import {
    EmptyPropertiesComponent,
    PropertyDescriptionComponent,
    IntegerComponent,
    CodeComponent,
    DecimalComponent,
    CheckboxComponent,
    DropDownComponent,
    RangeComponent,
    TextComponent,
    TagComponent,
    TextAreaComponent,
    ColorComponent,
    IndeterminatedCheckboxComponent,
    LookupComponent,
    AttributeSelectorComponent,
    PercentageComponent,
    MultipleExpressionsComponent,
    ExpressionComponent,
    AttributeFunctionComponent,
    MultiSelectDropDownComponent,
    Select2Component,
}
from '../properties/properties-components.js';

const AppComponent = Vue.extend({
    template,
    computed: {
        groupedOperations() {
            return this.$store.getters.getGroupedOperations;
        },
        dataSources(){
            return this.$store.getters.getWorkflow.tasks.filter((task) => {
                return task.operation.categories.map((cat) => cat.type).indexOf('data source') > -1;
            });
        },
        outputs(){
            return this.$store.getters.getWorkflow.tasks.filter((task) => {
                return task.operation.ports.filter((port) => {
                    return port.type === 'OUTPUT' && port.interfaces.filter((itf) => {
                        return itf.name === 'Data';
                    }).length > 0;
                }).length > 0;
            });
        },
        workflow() {
            return this.$store.getters.getWorkflow;
        },
        user() {
            return this.$store.getters.getUser;
        },
        errors() {
            return this.$store.getters.getErrors;
        },
        language: 'en', //this.$store.getters.language,
    },
    components: {
        'toolbox-component': ToolbarComponent,
        'diagram-component': DiagramComponent,
        'property-description-component': PropertyDescriptionComponent,

        'attribute-selector-component': AttributeSelectorComponent,
        'checkbox-component': CheckboxComponent,
        'color-component': ColorComponent,
        'code-component': CodeComponent,
        'decimal-component': DecimalComponent,
        'dropdown-component': DropDownComponent,
        'indeterminated-checkbox-component': IndeterminatedCheckboxComponent,
        'integer-component': IntegerComponent,
        //'load-workflow-component': LoadWorkflowComponent,
        'lookup-component': LookupComponent,
        'range-component': RangeComponent,
        'text-component': TextComponent,
        'textarea-component': TextAreaComponent,
        'percentage-component': PercentageComponent,
        'expression-component': ExpressionComponent,
        'multiple-expressions-component': MultipleExpressionsComponent,
        'attribute-function-component': AttributeFunctionComponent,
        'multi-select-dropdown-component': MultiSelectDropDownComponent,
        'select2-component': Select2Component,
        'tag-component': TagComponent
    },
    data() {
        return {
            currentComponent: 'no-properties-component',
            forms: [],
            filled: {},
            task: { operation: '' },
            title: 'Operations',
            username: '',
            passwd: '',
            filterOp: '',
            filtered: false,
            attributeSuggestion: {},
            showDeploy: false,
            context: {
                LIMONERO_URL: limoneroUrl,
            }
            //showModalLoadWorkflow: false
        }
    },
    mounted() {

        this.$Progress.start();
        let self = this;
        eventHub.$on('onblur-selection', () => {
            self.toggleProperties(false);
        });
        eventHub.$on('onshow-deploy', () => {

            let self = this;
            let ids = ['properties', 'workflow', 'toolbox', 'deploy'];
            self.toggleProperties(false);
            ids.forEach((elemId) => {
                let elem = self.$refs[elemId] || document.getElementById(elemId);
                elem.classList.add('deploy');
            });
            self.workflow.deploy = self.workflow.deploy || 
                {
                    name: self.workflow.name,
                    token: 'xpto',
                    description: '',
                    cpus: 1,
                    memory: 0.5,
                    responseTime: 60
                };
            self.showDeploy = true;
            //self.$refs.deploy.querySelector('input').focus();
        });
        eventHub.$on('onclick-task', (taskComponent) => {
            let callback = () => {
                let task = taskComponent.task;
                /* An task (operation instance) was clicked in the diagram */
                self.task = task;
                self.filledForm = task.forms;
                self.forms = task.operation.forms.sort((a, b) => {
                    return a.order - b.order;
                });
                // Reverse association between field and form. Used to retrieve category
                self.forms.forEach((f, i) => {
                    f.fields.forEach((field, j) => {
                        field.category = f.category;
                    });
                });
                self.toggleProperties(true);
            };
            if (!TahitiAttributeSuggester.processed){
                self.updateAttributeSuggestion(callback);
            } else {
                callback();
            }
        });
        eventHub.$on('update-form-field-value', (field, value) => {
            let self = this;
            let filled = this.task.forms[field.name];
            if (filled) {
                filled.value = value;
                filled.category = field.category;
            } else {
                let category = field.category;
                this.task.forms[field.name] = { value, category };
            }
            self.updateAttributeSuggestion();
            
        });
        eventHub.$on('add-flow', (field, value) => {
            self.updateAttributeSuggestion();
        });

        this.$store.dispatch('connectWebSocket');
        
        if (true || this.user) {
            let elem = document.getElementById('menu-operations');
            PerfectScrollbar.initialize(elem, {
                wheelSpeed: 2,
                wheelPropagation: true,
                minScrollbarLength: 20
            });

            let properties = document.getElementById('panel-properties');
            PerfectScrollbar.initialize(properties, {
                wheelSpeed: 2,
                wheelPropagation: true,
                minScrollbarLength: 20
            });

            if (this.$route.params.id) {
                let self = this;
                self.$store.dispatch('loadOperations').then(() => {
                    self.$store.dispatch('changeWorkflowId', this.$route.params.id)

                    self.$store.dispatch('loadWorkflow').catch((ex) => {
                        console.debug(ex)
                    }).then(function() {
                        self.$Progress.finish();
                    });
                });
            } else {
                this.loadOperations();
            }
        }
    },
    methods: {
        selectTaskInDeploy(task, selected){
            if (selected){
                document.getElementById(task.id).classList.add('selected');
            } else {
                document.getElementById(task.id).classList.remove('selected');
            }
        },
        _queryDataSource(id, callback) {
            let attributes = null;
            let self = this;

            id = parseInt(id);
            if (TahitiAttributeSuggester.cached === undefined){
                TahitiAttributeSuggester.cached = {};
            }
            if (TahitiAttributeSuggester.cached[id]) {
                attributes = TahitiAttributeSuggester.cached[id];
                callback(attributes);
            } else {
                let url = `${limoneroUrl}/datasources/${id}`;
                let headers = {'X-Auth-Token': authToken};
                Vue.http.get(url, {params: {attributes_name: true}, headers}).then(
                    (response) =>{
                        let ds = response.body;
                        attributes = ds.attributes.map(function(attr) {return attr.name});
                        TahitiAttributeSuggester.cached[id] = attributes;
                        callback(attributes);
                    },
                    (error) => {
                        self.$root.$refs.toastr.w('At least one data source is invalid in workflow');
                        callback([]);
                    }
                );
            }
        },
        updateAttributeSuggestion(callback){
            let self = this;
            let attributeSuggestion = {};
            TahitiAttributeSuggester.compute(self.workflow, this._queryDataSource, 
                (result) => { 
                    Object.keys(result).forEach(key => {
                        attributeSuggestion[key] = result[key].uiPorts;
                    });
                    Object.assign(self.attributeSuggestion, attributeSuggestion);
                    TahitiAttributeSuggester.processed = true;
                    if (callback){
                        callback();
                    }
                });
        },
        _caseInsensitiveComparator(a, b){
            if (! a || ! b) {
                return -1;
            } else {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }
        },
        _unique(data) {
            var filterItems = function(value, index){ return this.indexOf(value) == index };
            return data.filter(filterItems, data);
        },
        getSuggestions(taskId){
            if (TahitiAttributeSuggester.processed === undefined){
                this.updateAttributeSuggestion();
            }
            if (this.attributeSuggestion[taskId]){
                return this._unique(Array.prototype.concat.apply([], 
                    this.attributeSuggestion[taskId].inputs.map(
                (item) => {return item.attributes;}))).sort(this._caseInsensitiveComparator);
            } else {
                return [];
            }
        },
        toggleProperties(visibility){
            // Bug in Vue. Second time (when go back to page), $refs does not work
            let elem = this.$refs.properties || document.getElementById('properties');
            if (elem) {
                if (visibility){
                    elem.classList.add('show');
                } else {
                    elem.classList.remove('show');
                }
            }
        },
        filterOperations: _.debounce(function (e) {
            this.filtered = this.filterOp.length > 0;
            this.loadOperations(this.filterOp);
        }, 500),
        getValue(name) {
            return this.task && this.task.forms && this.task.forms[name] ? this.task.forms[name].value : null;
        },
        doLogin(ev) {
            this.login(this.username, this.passwd)
            return false;
        },
        toggle(ev) {
            let ul = ev.target.parentElement.querySelector('ul.tree');
            let icon = ev.target.querySelector('span');
            if (ul.classList.contains('slide-up')) {
                ul.classList.remove('slide-up');
                ul.classList.add('slide-down');
                icon.classList.remove('fa-caret-right');
                icon.classList.add('fa-caret-down');
                ev.target.classList.add('opened');
            } else {
                ul.classList.add('slide-up');
                ul.classList.remove('slide-down');
                icon.classList.remove('fa-caret-down');
                icon.classList.add('fa-caret-right');
                ev.target.classList.remove('opened');
            }
            ev.stopPropagation();
        },
        minimap(ev) {
            html2canvas(document.getElementById('lemonade-diagram'), {
                onrendered(canvas) {
                    canvas.style.zoom = .15;
                    let minimap = document.getElementById('minimap');
                    minimap.innerHTML = "";
                    minimap.appendChild(canvas);
                },
            });
        },
        loadOperations(filterOp) {
            return this.$store.dispatch('loadOperations', filterOp);
        },
        cancelDeploy() {
            let self = this;
            let ids = ['properties', 'workflow', 'toolbox', 'deploy'];
            ids.forEach((elemId) => {
                let elem = self.$refs[elemId] || document.getElementById(elemId);
                elem.classList.remove('deploy');

            });
            eventHub.$emit('oncancel-deploy');
        }
    },
    store
});

export default AppComponent;