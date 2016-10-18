function getCount(state) {
    return state.count;
}
function getOperations(state) {
    return state.operations;
}
function getGroupedOperations(state) {
    return state.groupedOperations;
}
function getTasks(state) {
    return state.workflow.tasks;
}
function getFlows(state) {
    return state.workflow.flows;
}
function getLanguage(state) {
    return state.language;
}
function getUser(state) {
    return state.user;
}
function getOperationFromId({ dispatch, state }, id) {
    return state.operations.filter(v => {
        return v.id === parseInt(id);
    });
}
export {
    getCount, getOperations, getGroupedOperations, getTasks, getFlows, getLanguage,
    getOperationFromId,
    getUser
}