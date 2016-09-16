import Vue from 'vue';
import jsep from 'jsep';
import template from './expression-editor-template.html';

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
    computed: {
        tree() {
            try{
                let tree = jsep(this.expression);
                this.error = null;
                return htmlize(tree);
            } catch(e){
                this.error = e;
            }
            return '';
        }
    },
    props: {
        error: null,
        expression: "Funcionará",
        removeOperators: [],
        addOperators: []
    },
    ready() {

    },
    template,

});

export default ExpressionEditorComponent;
