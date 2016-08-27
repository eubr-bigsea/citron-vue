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