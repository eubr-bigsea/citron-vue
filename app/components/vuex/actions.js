export const incrementCounter = function ({ dispatch, state }) {
    dispatch('INCREMENT', 1)
}
export const addAmount = function ({ dispatch, state }, amount) {
    dispatch('INCREMENT', amount);
}
export const loadOperations = function ({ dispatch, state }) {
    return dispatch('LOAD_OPERATIONS');
}
export const getOperationFromId = function({ dispatch, state }, id) {
    return state.operations.filter(v => {
        return v.id === parseInt(id);
    });
}
export const addNode = function ({ dispatch, state }, node) {
    return dispatch('ADD_NODE', node);
}
export const removeNode = function ({ dispatch, state }, node) {
    return dispatch('REMOVE_NODE', node);
}
export const clearNodes = function ({ dispatch, state }) {
    return dispatch('CLEAR_NODES');
}
export const addEdge = function ({ dispatch, state }, edge) {
    return dispatch('ADD_EDGE', edge);
}
export const removeEdge = function ({ dispatch, state }, edge) {
    return dispatch('REMOVE_EDGE', edge);
}
export const clearEdges = function ({ dispatch, state }) {
    return dispatch('CLEAR_EDGES');
}