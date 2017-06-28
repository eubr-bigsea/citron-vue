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
    TextAreaComponent,
    ColorComponent,
    IndeterminatedCheckboxComponent,
    LookupComponent,
    AttributeSelectorComponent,
    PercentageComponent,
    ExpressionComponent,
    AttributeFunctionComponent,
    MultiSelectDropDownComponent
}
from '../properties/properties-components.js';

const AppComponent = Vue.extend({
    template,
    computed: {
        groupedOperations: function() {
            return this.$store.getters.getGroupedOperations;
        },
        workflow: function() {
            return this.$store.getters.getWorkflow;
        },
        language: 'en', //this.$store.getters.language,
        user: function() {
            return this.$store.getters.getUser;
        },
        errors() {
            return this.$store.getters.getErrors;
        },
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
        'attribute-function-component': AttributeFunctionComponent,
        'multi-select-dropdown-component': MultiSelectDropDownComponent
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
        });
        eventHub.$on('onclick-task', (taskComponent) => {
            let task = taskComponent.task;
            /* An task (operation instance) was clicked in the diagram */
            this.task = task;
            this.filledForm = task.forms;
            this.forms = task.operation.forms.sort((a, b) => {
                return a.order - b.order;
            });
            // Reverse association between field and form. Used to retrieve category
            this.forms.forEach((f, i) => {
                f.fields.forEach((field, j) => {
                    field.category = f.category;
                });
            });
            self.toggleProperties(true);
            
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
            /* Attribute suggestion */
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
        _queryDataSource(id, callback) {
            var attributes = null;
            
            id = parseInt(id);
            if (TahitiAttributeSuggester.cached === undefined){
                TahitiAttributeSuggester.cached = {};
            }
            if (TahitiAttributeSuggester.cached[id]) {
                attributes = TahitiAttributeSuggester.cached[id];
                callback(attributes);
            } else {
                var req=new XMLHttpRequest();
                req.open("GET",  'http://beta.ctweb.inweb.org.br/limonero/datasources/' + id + '?token=123456&attributes_name=true');
                req.onreadystatechange = function() {
                    if (req.readyState == XMLHttpRequest.DONE) {
                        if (callback) {
                            var ds = JSON.parse(req.responseText);
                            attributes = ds.attributes.map(function(attr) {return attr.name});
                            TahitiAttributeSuggester.cached[id] = attributes;
                            callback(attributes);
                        }
                    }
                }
                req.send({});
            }
        },
        updateAttributeSuggestion(){
            let self = this;
            let attributeSuggestion = {};
            TahitiAttributeSuggester.compute(self.workflow, this._queryDataSource, 
                (result) => { 
                    Object.keys(result).forEach(key => {
                        attributeSuggestion[key] = result[key].uiPorts;
                    });
                    Object.assign(self.attributeSuggestion, attributeSuggestion);
                });
        },
        getSuggestions(taskId){
            if (TahitiAttributeSuggester.cached === undefined){
                this.updateAttributeSuggestion();
            }
            if (this.attributeSuggestion[taskId]){
                return Array.prototype.concat.apply([], 
                    this.attributeSuggestion[taskId].inputs.map((item) => {return item.attributes;}));
            } else {
                return [];
            }
        },
        toggleProperties(visibility){
            // Bug in Vue. Second time (when go back to page), $refs does not work
            let elem = this.$refs.properties || document.getElementById('properties');
            if (visibility){
                elem.classList.add('show');
            } else {
                elem.classList.remove('show');
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