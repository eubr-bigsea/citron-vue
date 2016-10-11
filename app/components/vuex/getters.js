function getCount(state) {
    return state.count;
}
function getOperations(state) {
    return state.operations;
}
function getGroupedOperations(state) {
    return state.groupedOperations;
}
function getNodes(state) {
    return state.workflow.nodes;
}
function getEdges(state) {
    return state.workflow.edges;
}
function getLanguage(state){
    return state.language;
}
export {getCount, getOperations, getGroupedOperations, getNodes, getEdges, getLanguage}