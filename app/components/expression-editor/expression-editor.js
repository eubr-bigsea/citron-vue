import Vue from 'vue';
import jsep from 'jsep';
import template from './expression-editor-template.html';
import ModalComponent from '../modal/modal-component.js';
import _ from 'lodash'
import eventHub from '../app/event-hub';

function get_html_obj(obj) {
    var rv = $("<ul />");
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            var value = obj[prop];

            var li = $("<li />").appendTo(rv);
            var prop_name = $("<span />").addClass("prop_name")
                .appendTo(li)
                .text(prop + ": ");
            var prop_val = $("<span />").addClass("prop_val")
                .appendTo(li);

            if (typeof value === "string") {
                prop_val.addClass("string").text("'" + value + "'");
            } else if (typeof value === "number") {
                prop_val.addClass("number").text(value);
            } else if (typeof value === "boolean") {
                prop_val.addClass("boolean").text(value + "");
            } else {
                var child = get_html_obj(value);
                prop_val.addClass("objectd").append(child);
            }
        }
    }
    return rv;
};

function htmlize(obj) {
    var html_obj = get_html_obj(obj);
    return html_obj.html();
};

const ExpressionEditorComponent = Vue.extend({
    components: {
        'modal-component': ModalComponent
    },
    data() {
        return {
            dateFunctions: [
                'current_date', 'current_timestamp',
                'date_add', 'date_format', 'date_sub',
                'datediff', 'dayofmonth', 'dayofyear',

            ],
            showModal: false,
            error: '',
            expressionValue: '',
        }
    },
    computed: {
        tree() {
            return JSON.parse(this.expression).tree;
        },
        jsExpression() {
            return JSON.parse(this.expression).expression;
        }
    },
    methods: {
        ok(e){
            eventHub.$emit('update-expression', this.expressionValue, this.tree);
            this.showModal = false;
        },
        cancel(e){
            this.showModal = false;
        },
        changed: _.debounce(function(e) {
            try {
                if (e.target && e.target.value) {
                    let ttree = this.process(e.target.value)
                    this.expressionValue = e.target.value;
                    //eventHub.$emit('update-expression', e.target.value, ttree);
                    this.tree = ttree;
                } else {
                    this.error = null;
                    //eventHub.$emit('update-expression', null, null);
                }
            } catch (e) {
                this.error = e.toString();
            }
        }),
        process(v) {
            let tree = jsep(v || '');
            jsep.addBinaryOp("=>", 1);
            jsep.removeBinaryOp('^');
            this.error = null;
            //return htmlize(tree);
            //this.tree = JSON.stringify(tree, null, 4);
            return tree;
        },
        selectTab(tab) {
            this.currentTab = tab;
        },
    },
    props: {
        categories: {},
        currentTab: {},
        addOperators: {},
        expression: {},
        removeOperators: {},
    },
    ready() {
        this.process(this.expression)
    },
    template,
    watch: {
        /*expression() {
            this.process(this.expression)
        }*/
    }
});

export default ExpressionEditorComponent;