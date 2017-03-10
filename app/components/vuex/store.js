import Vuex from 'vuex';
import Vue from 'vue';
import io from 'socket.io-client'
import {standUrl, tahitiUrl} from '../../config';

Vue.use(Vuex);

const StoreException = function (message, code) {
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
    workflowPage: { pagination: {} },
    jobPage: { pagination: {} },
}
function getWorkflows() {
    let url = `${tahitiUrl}/workflows?token=123456`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}

function getWorkflow(id) {
    let url = `${tahitiUrl}/workflows${id}?token=123456`;
    return Vue.http.get(url).then(function (response) {
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
        let flows = state.workflow.flows;
        for (let i = flows.length - 1; i > 0; i--) {
            console.debug(flows[i].source_id, task.id)
            if (flows[i].source_id === task.id) {
                console.debug('Removendo', flows[i].source_id)
                state.workflow.flows.splice(i, 1);
            }
        }
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

        getOperations().then(function (data) {
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
        }).catch(function (error) {
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
        
    },
    LOAD_WORKFLOW(state) {
        state.workflow = { 'id': state.workflow.id, tasks: [], flows: [] };
        if (state.workflow.id == 0) return
        let id = state.workflow.id;
        let url = `${tahitiUrl}/workflows/${id}`;
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
                    t.operation.ports.forEach(function (v) { validPorts.add(v.id); });

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
        let url = `${tahitiUrl}/workflows?enabled=true`;
        let headers = { 'X-Auth-Token': '123456' }

        Vue.http.get(url, { params, headers }).then(response => {
            let workflows = response.data;
            state.workflowPage = workflows;
        });
    },
    LOAD_JOB_PAGE(state, params) {
        let url = `${standUrl}/jobs`;
        let headers = { 'X-Auth-Token': '123456' }

        Vue.http.get(url, { params, headers }).then(response => {
            let jobs = response.data;
            state.jobPage = jobs;
        });
    },
    GET_OPERATIONS(state) {
        return state.operations;
    },
    CONNECT_WEBSOCKET(state, room) {
        return
        let namespace = '/stand';
        var counter = 0;
        console.debug(standUrl + namespace)
        var socket = io(standUrl + namespace, 
            { upgrade: true, path: '/socket.io' });

        socket.on('disconnect', () => {
            console.debug('disconnect')
        });
         socket.on('response', (msg) => {
            console.debug('response', msg)
        });
        socket.on('connect', () => {
            if (store.workflow){
                console.debug('Connecting to room', room);
                socket.emit('join', { room: store.workflow['id'] });
            }
        });
        socket.on('connect_error', () => {
            console.debug('Web socket server offline');
        });
        socket.on('update task', (msg) => {
            let inx = state.workflow.tasks.findIndex((n, inx, arr) => n.id === msg.id);
            console.debug('Found', inx, msg.id)
            if (inx > -1) {
                state.workflow.tasks[inx].status = msg.status;
                state.workflow.tasks[inx].forms.color.value = 'green';
            }
            console.debug('update task', msg)
        });
        socket.on('update job', (msg) => {
            console.debug('update job', msg);
        });

    },
    RAISE_COMPONENT_EXCEPTION(state, msg) {
        state.errors.push(msg);
    },

}
window.store = state;
const diagramModuleStore = {
    mutations,
    state,
    actions: {
        loadOperations({ commit, state }) {
            let url = `${tahitiUrl}/operations?platform=spark&enabled=true&token=123456&lang=${state.language}`;
            //let url = `http://artemis.speed.dcc.ufmg.br:5000/operations?token=123456&lang=${state.language}`;
            return Vue.http.get(url).then(function (response) {
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
            let cloned = JSON.parse(JSON.stringify(state.workflow));

            let url = `${tahitiUrl}/workflows`;
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
            
            return new Promise((resolve, reject) => {
                Vue.http[httpMethod](url, cloned, { headers }).then((response) => {
                    commit('SAVE_WORKFLOW');
                    resolve(response.data);
                }).catch((reason) => reject(reason));
            });
        },
        loadWorkflow({ commit, state }) {
            return commit('LOAD_WORKFLOW');
        },

        loadWorkflowPage({ commit, params }, p) {
            return commit('LOAD_WORKFLOW_PAGE', p);
        },
        loadJobPage({ commit, params }, p) {
            return commit('LOAD_JOB_PAGE', p);
        },
        connectWebSocket({ commit, state }, room) {
            return commit('CONNECT_WEBSOCKET', room);
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
        getJobPage: (state) => state.jobPage,
        getPageParameters: (state) => state.pageParameters,
    },
    strict: false,
};
const store = new Vuex.Store({
    modules: {
        digram: diagramModuleStore
    }
});
export default store;