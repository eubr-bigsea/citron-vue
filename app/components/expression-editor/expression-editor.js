import Vue from 'vue';
import jsep from 'jsep';
import template from './expression-editor-template.html';
import ModalComponent from '../modal/modal-component.js';

function get_html_obj(obj) {
    var rv = $("<ul />");
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            var value = obj[prop];

            var li = $("<li />").appendTo(rv);
            var prop_name = $("<span />").addClass("prop_name")
                .appendTo(li)
                .text(prop + ": ")
                ;
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
    data(){
        return {
            dateFunctions: [
                'current_date', 'current_timestamp',
                'date_add', 'date_format', 'date_sub', 
                'datediff', 'dayofmonth', 'dayofyear',

            ],
        }
    },
    computed: {
        xtree() {
            try {
                jsep.addBinaryOp("=>", 1);
                jsep.removeBinaryOp('^');
                let tree = jsep(this.expression);
                this.error = null;
                //return htmlize(tree);
                return JSON.stringify(tree, null, 4).replace('\n', '<br/>');
            } catch (e) {
                this.error = e;
            }
            return '';
        }
    },
    methods: {
        changed(e){
            try {
                if (e.target && e.target.value){
                    let tree = this.process(e.target.value)
                    this.$dispatch('update-expression', e.target.value, tree);
                } else {
                    this.error = null;
                    this.$dispatch('update-expression', null, null);
                }
            } catch (e) {
                this.error = e;
            }
        },
        process(v){
            let tree = jsep(v || '');
            jsep.addBinaryOp("=>", 1);
            jsep.removeBinaryOp('^');
            this.error = null;
            //return htmlize(tree);
            this.tree = JSON.stringify(tree, null, 4).replace('\n', '<br/>');
            return tree;
        },
        selectTab(tab){
            this.currentTab = tab;
        },
    },
    props: {
        categories: [],
        currentTab: '',
        addOperators: [],
        error: null,
        expression: "",
        removeOperators: [],
        showModal: true,
        tree: '',
    },
    ready() {
        this.process(this.expression)
    },
    template,
    watch: {
        expression(){
            this.process(this.expression)
        }
    }
});

export default ExpressionEditorComponent;
