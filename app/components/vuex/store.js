import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const state = {
    count: 0,
    language: 'en',
    operations: [],
    groupedOperations: {},
    errors: [],
    workflow: {
        nodes: [],
        edges: []
    }
}
function getOperations(){
    console.debug('Getting operations')
    //let url = 'http://beta.ctweb.inweb.org.br/tahiti/operations?token=123456';
    let url = `http://artemis.speed.dcc.ufmg.br:5000/operations?token=123456&lang=${state.language}`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}
const mutations = {
    LOAD_OPERATIONS(state) {
        getOperations().then(function (data) {
            let groupedOps = {};
            data.forEach((op) => {
                op.categories.forEach((cat) => {
                    if (cat.type === 'parent') {
                        if (!(cat.name in groupedOps)) {
                            groupedOps[cat.name] = [op];
                        } else {
                            groupedOps[cat.name].push(op);
                        }
                    }
                });
            });
            //console.debug(groupedOps);
            state.operations = data;
            state.groupedOperations = groupedOps;
        }).catch(function (error) {
            state.errors.push(error);
        });
    },
    UPDATE_NODE_FORM_FIELD(state, node, value){
        console.debug(node, value);
    },
    ADD_NODE(state, node){
        console.debug(node);
        /* creates the form for each node */
        let a = [];
        node.forms = {};
        node.operation.forms.forEach((form) => {
            form.fields.forEach((field) => {
                node.forms[field.name] = {
                    "value": null,
                    "category": form.name 
                }
            });
        });
        state.workflow.nodes.push(node);
    },
    REMOVE_NODE(state, node){
        let inx = state.workflow.nodes.findIndex((n, inx, arr) => n.id === node.id);
        console.debug('removing', inx)
        state.workflow.nodes.splice(inx, 1);
    },
    CLEAR_NODES(state){
        state.workflow.nodes.length = 0;
    },
    ADD_EDGE(state, edge){
        state.workflow.edges.push(edge);
    },
    REMOVE_EDGE(state, edge){
        console.debug('remove edge')
    },
    CLEAR_EDGES(state){
        state.workflow.edges.length = 0;
    },
    CHANGE_LANGUAGE(state, lang){
        state.language = lang;

        getOperations().then(function (data) {
            let groupedOps = {};
            let ops = {};
            data.forEach((op) => {
                ops[op.id] = op;
                op.categories.forEach((cat) => {
                    if (cat.type === 'parent') {
                        if (!(cat.name in groupedOps)) {
                            groupedOps[cat.name] = [op];
                        } else {
                            groupedOps[cat.name].push(op);
                        }
                    }
                });
            });
            // Updates nodes with new operation metadata
            state.workflow.nodes.forEach((item) => {
                item.operation = ops[item.operation.id];
            });
            //console.debug(state.workflow.edges)
            state.operations = data;
            state.groupedOperations = groupedOps;
        }).catch(function (error) {
            state.errors.push(error);
        });
    },

}
window.store = state; 
export default new Vuex.Store({
    mutations,
    state,
    strict: false,
})
