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
const removeFlow = function ({ dispatch, state }, flow) {
    return dispatch('REMOVE_FLOW', flow);
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
/* Auth */
const login = function({dispatch, state}, login, passwd){
    return dispatch('LOGIN', login, passwd);
}

export {
    loadOperations, 
    addTask, removeTask, clearTasks, 
    updateTaskFormField, changeLanguage,

    addFlow, removeFlow, clearFlows,

    login,
};