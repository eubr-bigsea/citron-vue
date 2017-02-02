import Vuex from 'vuex';
import Vue from 'vue';
import io from 'socket.io-client'
Vue.use(Vuex);

const StoreException = function(message, code) {
    this.message = message;
    this.code = code;
}
const state = {
    count: 0,
    errors: [],
    groupedOperations: {},
    language: 'en',
    lookupOperations: {},
    operations: [],
    user: { state: { logged: false } },
    workflow: {
        name: "",
        id: 101,
        user_id: 0,
        user_name: "admin",
        user_login: "admin",
        tasks: [],
        flows: []
    },
    pageParameters: {},
    workflowPage: { pagination: {} }
}
const baseUrl = 'http://beta.ctweb.inweb.org.br/tahiti';
//const baseUrl = 'http://localhost:5000'; 
function getWorkflows() {
    let url = `${baseUrl}/workflows?token=123456`;
    return Vue.http.get(url).then(function(response) {
        return response.data;
    })
}

function getWorkflow(id) {
    let url = `${baseUrl}/workflows${id}?token=123456`;
    return Vue.http.get(url).then(function(response) {
        return response.data;
    })
}

function addTask(state, task) {
    /* creates the form for each task */
    let a = [];
    task.forms = {};
    task.operation.forms.forEach((form) => {
        form.fields.forEach((field) => {
            task.forms[field.name] = {
                "value": null,
            }
        });
    });
    state.workflow.tasks.push(task);
}
const mutations = {
    SET_OPERATIONS(state, { operations, groupedOperations, lookupOperations }) {
        state.operations = operations;
        state.groupedOperations = groupedOperations;
        state.lookupOperations = lookupOperations;
    },
    UPDATE_TASK_FORM_FIELD(state, task, value) {
        console.debug(task, value);
    },
    UPDATE_PAGE_PARAMETERS(state, parameters) {
        state.pageParameters[parameters.page] = parameters.parameters;
    },
    ADD_TASK(state, task) {
        addTask(state, task);
        console.debug('ADD_TASK')
    },
    REMOVE_TASK(state, task) {
        let inx = state.workflow.tasks.findIndex((n, inx, arr) => n.id === task.id);
        state.workflow.tasks.splice(inx, 1);
    },
    CLEAR_TASKS(state) {
        state.workflow.tasks.length = 0;
    },
    ADD_FLOW(state, flow) {
        flow.id = `${flow.source_id}/${flow.source_port}-${flow.target_id}/${flow.target_port}`;
        state.workflow.flows.push(flow);
    },
    REMOVE_FLOW(state, id) {
        let inx = state.workflow.flows.findIndex((n, inx, arr) => n.id === id);
        if (inx > -1) {
            state.workflow.flows.splice(inx, 1);
        }
    },
    CLEAR_FLOWS(state) {
        state.workflow.flows.length = 0;
    },
    CHANGE_LANGUAGE(state, lang) {
        state.language = lang;

        getOperations().then(function(data) {
            let groupedOperations = {};
            let ops = {};
            data.forEach((op) => {
                ops[op.id] = op;
                op.categories.forEach((cat) => {
                    if (cat.type === 'parent') {
                        if (!(cat.name in groupedOperations)) {
                            groupedOperations[cat.name] = [op];
                        } else {
                            groupedOperations[cat.name].push(op);
                        }
                    }
                });
            });
            // Updates tasks with new task metadata
            state.workflow.tasks.forEach((item) => {
                item.task = ops[item.task.id];
            });
            //console.debug(state.workflow.flows)
            state.operations = data;
            state.groupedOperations = groupedOperations;
        }).catch(function(error) {
            state.errors.push(error);
        });
    },
    LOGIN(state, login, passwd) {
        state.user = {
            login,
            name: 'Walter dos Santos Filho',
            id: 1343,
            state: 'LOGGED'
        };
    },
    CHANGE_WORKFLOW_NAME(state, name) {
        state.workflow.name = name;
    },
    CHANGE_WORKFLOW_ID(state, id) {
        state.workflow.id = id;
    },
    SAVE_WORKFLOW(state) {
        let cloned = JSON.parse(JSON.stringify(state.workflow));
        let tmp = document.getElementById('save-area');

        let url = `${baseUrl}/workflows`;
        let headers = { 'Content-Type': 'application/json', 'X-Auth-Token': '123456' }
        let httpMethod = 'post';
        if (cloned.id !== 0) {
            httpMethod = 'patch';
            url = `${url}/${cloned.id}`;
        }
        cloned.platform_id = 1; //FIXME
        cloned.tasks.forEach((task) => {
            task.operation = { id: task.operation.id };
            delete task.version; //
        });
        //
        Vue.http[httpMethod](url, cloned, { headers }).then((response) => {
            //console.debug(response);
            return response.data;
        });
        if (tmp) {
            tmp.value = JSON.stringify(cloned,
                (key, value) => {
                    if (key === 'operation') {
                        const op = state.lookupOperations[value.id];
                        if (op) {
                            return { name: op.name, slug: op.slug, id: op.id };
                        } else {
                            return {}
                        }
                    } else if (key === 'classes') {
                        return undefined;
                    } else {
                        return value;
                    }
                });
        }
    },
    LOAD_WORKFLOW(state) {
        state.workflow = { 'id': state.workflow.id, tasks: [], flows: [] };
        if (state.workflow.id == 0) return
        let id = state.workflow.id;
        let url = `${baseUrl}/workflows/${id}`;
        let headers = { 'X-Auth-Token': '123456' }
        let validTaskId = new Set([]);
        let validPorts = new Set([]);
        return Vue.http.get(url, { headers }).then(response => {
            state.errors.length = 0;
            // Set the correct operation object
            let workflow = response.data;
            workflow.tasks.forEach((t) => {
                validTaskId.add(t.id);
                t.operation = state.lookupOperations[t.operation.id];
                if (t.operation == null) {
                    state.errors.push(new StoreException("Invalid workflow", 'WF0001'));
                } else {
                    t.status = 'WAITING';
                    t.operation.ports.forEach(function(v) { validPorts.add(v.id); });

                    t.operation.forms.forEach((form) => {
                        form.fields.forEach((field) => {
                            if (!t.forms[field.name]) {
                                t.forms[field.name] = {
                                    "value": null,
                                    "category": form.name
                                }
                            }
                            if (!t.forms[field.name]['category']) {
                                t.forms[field.name]['category'] = form.name;
                            }
                        });
                    });
                }
            });
            /* Cannot bind flows before binding tasks */
            let flows = workflow.flows;
            workflow.flows = [];
            let ids = new Set();

            state.workflow = workflow;

            flows.forEach((flow) => {
                if (validTaskId.has(flow.source_id) && validTaskId.has(flow.target_id) &&
                    validPorts.has(flow.source_port) && validPorts.has(flow.target_port)) {
                    flow.id = `${flow.source_id}/${flow.source_port}-${flow.target_id}/${flow.target_port}`;
                    //console.debug(flow.id);
                    if (!ids.has(flow.id)) {
                        workflow.flows.push(flow);
                        ids.add(flow.id)
                    }
                }
            });
        });
    },
    LOAD_WORKFLOW_PAGE(state, params) {
        let url = `${baseUrl}/workflows`;
        let headers = { 'X-Auth-Token': '123456' }

        Vue.http.get(url, { params, headers }).then(response => {
            let workflows = response.data;
            state.workflowPage = workflows;
        });
    },
    GET_OPERATIONS(state) {
        return state.operations;
    },
    CONNECT_WEBSOCKET(state) {
        return
        const standBaseUrl = 'http://localhost:3320';
        let namespace = '/stand';
        var counter = 0;
        var socket = io(standBaseUrl + namespace, { upgrade: true });

        socket.on('disconnect', () => {
            console.debug('disconnect')
        });
        socket.on('connect', () => {
            socket.emit('join', { room: '21401' });
        });
        socket.on('connect_error', () => {
            console.debug('Web socket server offline');
        });
        socket.on('update task', (msg) => {
            let inx = state.workflow.tasks.findIndex((n, inx, arr) => n.id === msg.id);
            if (inx > -1) {
                state.workflow.tasks[inx].status = msg.status;
            }
        });
        socket.on('update workflow', (msg) => {
            console.debug('update workflow', msg);
        });

    },
    RAISE_COMPONENT_EXCEPTION(state, msg) {
        state.errors.push(msg);
    },

}
window.store = state;
export default new Vuex.Store({
    mutations,
    state,
    actions: {
        loadOperations({ commit, state }) {
            let url = `${baseUrl}/operations?platform=spark&enabled=true&token=123456&lang=${state.language}`;
            //let url = `http://artemis.speed.dcc.ufmg.br:5000/operations?token=123456&lang=${state.language}`;
            return Vue.http.get(url).then(function(response) {
                let operations = response.data;
                let groupedOperations = {};
                let lookupOperations = {}
                operations.forEach((op) => {
                    op.categories.forEach((cat) => {
                        if (cat.type === 'parent') {
                            if (!(cat.name in groupedOperations)) {
                                groupedOperations[cat.name] = [op];
                            } else {
                                groupedOperations[cat.name].push(op);
                            }
                        }
                    });
                    lookupOperations[op.id] = op;
                });
                //console.debug(groupedOperations);
                return { operations, groupedOperations, lookupOperations };
            }).then((values) => {
                commit('SET_OPERATIONS', values);
            });
        },

        addTask({ commit, state }, task) {
            return commit('ADD_TASK', task);
        },
        removeTask({ commit, state }, task) {
            return commit('REMOVE_TASK', task);
        },
        clearTasks({ commit, state }) {
            return commit('CLEAR_TASKS');
        },

        addFlow({ commit, state }, flow) {
            return commit('ADD_FLOW', flow);
        },
        removeFlow({ commit, state }, id) {
            return commit('REMOVE_FLOW', id);
        },
        clearFlows({ commit, state }) {
            return commit('CLEAR_FLOWS');
        },

        updateTaskFormField({ commit, state }, task, value) {
            return commit('UPDATE_TASK_FORM_FIELD');
        },
        changeWorkflowName({ commit, state }, name) {
            return commit('CHANGE_WORKFLOW_NAME', name)
        },
        changeWorkflowId({ commit, state }, id) {
            return commit('CHANGE_WORKFLOW_ID', id)
        },

        changeLanguage({ commit, state }, lang) {
            return commit('CHANGE_LANGUAGE', lang);
        },
        /* Auth */
        login({ commit, state }, login, passwd) {
            return commit('LOGIN', login, passwd);
        },

        saveWorkflow({ commit, state }) {
            return commit('SAVE_WORKFLOW');
        },
        loadWorkflow({ commit, state }) {
            return commit('LOAD_WORKFLOW');
        },
        loadWorkflowPage({ commit, params }, p) {
            return commit('LOAD_WORKFLOW_PAGE', p);
        },

        connectWebSocket({ commit, state }) {
            return commit('CONNECT_WEBSOCKET');
        },
        updatePageParameters({ commit, state }, parameters) {
            return commit('UPDATE_PAGE_PARAMETERS', parameters);
        },
        raiseComponentException({ commit, state }, msg) {
            return commit('RAISE_COMPONENT_EXCEPTION', msg);
        }
    },
    getters: {
        getCount: (state) => state.count,
        getErrors: (state) => state.errors,
        getOperations: (state) => state.operations,
        getGroupedOperations: (state) => state.groupedOperations,
        getTasks: (state) => state.workflow.tasks,
        getFlows: (state) => state.workflow.flows,
        getLanguage: (state) => state.language,
        getUser: (state) => state.user,
        getWorkflow: (state) => state.workflow,
        getWorkflowPage: (state) => state.workflowPage,
        getPageParameters: (state) => state.pageParameters,
    },
    strict: false,
})