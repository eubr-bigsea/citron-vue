import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const state = {
    count: 0,
    operations: [],
    groupedOperations: {},
    errors: [],
    workflow: {
        nodes: [],
        edges: []
    }
}
const mutations = {
    INCREMENT(state, amount) {
        state.count += amount;
    },
    LOAD_OPERATIONS(state) {
        console.debug('Getting operations')
        let url = 'http://beta.ctweb.inweb.org.br/tahiti/operations?token=123456';
        Vue.http.get(url).then(function (response) {
            return response.data;
        }).then(function (data) {
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
            state.groupedOperations = groupedOps;
            state.operations = data;
        }).catch(function (error) {
            state.errors.push(error);
        });
    },
    ADD_NODE(state, node){
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
    }
}
window.store = state; 
export default new Vuex.Store({
    state,
    mutations
})