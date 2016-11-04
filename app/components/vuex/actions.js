const loadOperations = function ({ dispatch, state }) {
    return dispatch('LOAD_OPERATIONS');
}
const addTask = function ({ dispatch, state }, task) {
    return dispatch('ADD_TASK', task);
}
const removeTask = function ({ dispatch, state }, task) {
    return dispatch('REMOVE_TASK', task);
}
const clearTasks = function ({ dispatch, state }) {
    return dispatch('CLEAR_TASKS');
}
const addFlow = function ({ dispatch, state }, flow) {
    return dispatch('ADD_FLOW', flow);
}
const removeFlow = function ({ dispatch, state }, id) {
    return dispatch('REMOVE_FLOW', id);
}
const clearFlows = function ({ dispatch, state }) {
    return dispatch('CLEAR_FLOWS');
}
const updateTaskFormField = function ({ dispatch, state }, task, value) {
    return dispatch('UPDATE_TASK_FORM_FIELD');
}
const changeLanguage = function ({ dispatch, state }, lang) {
    return dispatch('CHANGE_LANGUAGE', lang);
}
const changeWorkflowName = function({dispatch, state}, name){
    return dispatch('CHANGE_WORKFLOW_NAME', name)
}
const changeWorkflowId = function({dispatch, state}, id){
    return dispatch('CHANGE_WORKFLOW_ID', id)
}
/* Auth */
const login = function({dispatch, state}, login, passwd){
    return dispatch('LOGIN', login, passwd);
}
const saveWorkflow = function({dispatch, state}) {
    return dispatch('SAVE_WORKFLOW');
}
const loadWorkflow = function({dispatch, state}, graph) {
    return dispatch('LOAD_WORKFLOW', graph);
}
const clearEdges = function ({ dispatch, state }) {
    return dispatch('CLEAR_EDGES');
}

const updateNodeFormField = function ({ dispatch, state }, node, value) {
    return dispatch('UPDATE_NODE_FORM_FIELD');
}
export {loadOperations, addTask, removeTask, 
    clearTasks, addFlow, removeFlow, clearFlows, updateTaskFormField, changeLanguage, changeWorkflowName,
    changeWorkflowId, login, saveWorkflow, loadWorkflow, clearEdges, updateNodeFormField
}
