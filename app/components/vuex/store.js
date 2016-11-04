import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const state = {
    count: 0,
    errors: [],
    groupedOperations: {},
    language: 'en',
    lookupOperations: {},
    operations: [],
    user: { state: 'null' },
    workflow: {
        name: "",
        id: 0,
        user_id: 0,
        user_name: "admin",
        user_login: "admin",
        tasks: [],
        flows: []
    }
}
const baseUrl = 'http://beta.ctweb.inweb.org.br/tahiti';
//const baseUrl = 'http://artemis:5000'; 
function getWorkflows() {
    let url = `${baseUrl}/workflows?token=123456`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}
function getWorkflow(id) {
    let url = `${baseUrl}/workflows${id}?token=123456`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}
function getOperations() {
    console.debug('Getting tasks')
    let url = `${baseUrl}/operations?token=123456&lang=${state.language}`;
    //let url = `http://artemis.speed.dcc.ufmg.br:5000/operations?token=123456&lang=${state.language}`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}
function loadWorkflow(state, workflow) {
    workflow.tasks.forEach((t) => {
        t.operation = state.lookupOperations[t.operation.id];
    });
    /* Cannot bind flows before binding tasks */
    let flows = workflow.flows;
    workflow.flows = [];
    let ids = new Set();

    /* If tasks did not load forms, do it */
    workflow.tasks.forEach((task) => {
        if (!task.forms) {
            task.forms = {};
            task.operation.forms.forEach((form) => {
                form.fields.forEach((field) => {
                    task.forms[field.name] = {
                        "value": null,
                        "category": form.name
                    }
                });
            });
        }
    });

    //console.debug(JSON.stringify(workflow.flows));
    state.workflow = workflow;
    flows.forEach((flow) => {
        flow.id = `${flow.source_id}/${flow.source_port}-${flow.target_id}/${flow.target_port}`;
        //console.debug(flow.id);
        if (!ids.has(flow.id)) {
            workflow.flows.push(flow);
            ids.add(flow.id)
        }
    });
}
const mutations = {
    LOAD_OPERATIONS(state) {
        //let url = 'http://beta.ctweb.inweb.org.br/tahiti/operations?token=123456';
        let url = 'http://localhost:5000/operations?token=123456&lang=en';
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
                state.lookupOperations[op.id] = op;
            });
            //console.debug(groupedOps);
            state.operations = data;
            state.groupedOperations = groupedOps;
        }).catch(function (error) {
            state.errors.push(error);
        });
    },
    UPDATE_task_FORM_FIELD(state, task, value) {
        console.debug(task, value);
    },
    ADD_TASK(state, task) {
        /* creates the form for each task */
        let a = [];
        task.forms = {};
        task.operation.forms.forEach((form) => {
            form.fields.forEach((field) => {
                task.forms[field.name] = {
                    "value": null,
                    "category": form.name
                }
            });
        });
        state.workflow.tasks.push(task);
    },
    ADD_FLOW(state, flow) {
        flow.id = `${flow.source_id}/${flow.source_port}-${flow.target_id}/${flow.target_port}`;
        state.workflow.flows.push(flow);
    },
    REMOVE_FLOW(state, id) {
        let inx = state.workflow.flows.findIndex((n, inx, arr) => n.id === id);
        console.debug('removing', inx)
        if (inx > -1) {
            state.workflow.flows.splice(inx, 1);
        }
    },
    CLEAR_FLOWS(state) {
        state.workflow.flows.length = 0;
    },
    CLEAR_TASKS(state) {
        state.workflow.tasks.length = 0;
    },
    CHANGE_LANGUAGE(state, lang) {
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
            // Updates tasks with new task metadata
            state.workflow.tasks.forEach((item) => {
                item.task = ops[item.task.id];
            });
            //console.debug(state.workflow.flows)
            state.operations = data;
            state.groupedOperations = groupedOps;
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
        let cloned = JSON.parse(JSON.stringify(state.workflow));
        let tmp = document.getElementById('save-area');

        let url = `${baseUrl}/workflows`;
        let headers = { 'Content-Type': 'application/json', 'X-Auth-Token': '123456' }
        let httpMethod = 'post';
        if (cloned.id !== 0) {
            httpMethod = 'patch';
            url = `${url}/${cloned.id}`;
        }
        Vue.http[httpMethod](url, cloned, { headers }).then((response) => {
            console.debug(response);
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
    LOAD_WORKFLOW(state, graph) {
        let id = 21401;
        let url = `${baseUrl}/workflows/${id}`;
        let headers = { 'X-Auth-Token': '123456' }

        if (!graph) {
            Vue.http.get(url, { headers }).then(response => {
                // Set the correct operation object
                let workflow = response.data;
                loadWorkflow(state, workflow);
            });
        } else {
            loadWorkflow(state, graph);
        }
    }

}
window.store = state;
export default new Vuex.Store({
    mutations,
    state,
    strict: false,
})
