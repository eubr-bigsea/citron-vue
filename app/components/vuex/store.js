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
//const baseUrl = 'http://beta.ctweb.inweb.org.br/tahiti';
const baseUrl = 'http://artemis:5000'; 
function getWorkflows(){
    let url = `${baseUrl}/workflows?token=123456`;
    return Vue.http.get(url).then(function (response) {
        return response.data;
    })
}
function getWorkflow(id){
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
const mutations = {
    LOAD_OPERATIONS(state) {
        getOperations().then(function (data) {
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
    UPDATE_TASK_FORM_FIELD(state, task, value) {
        console.debug(task, value);
    },
    ADD_TASK(state, task) {
        //console.debug(task);
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
    REMOVE_TASK(state, task) {
        let inx = state.workflow.tasks.findIndex((n, inx, arr) => n.id === task.id);
        console.debug('removing', inx)
        state.workflow.tasks.splice(inx, 1);
    },
    CLEAR_TASKS(state) {
        state.workflow.tasks.length = 0;
    },
    ADD_FLOW(state, flow) {
        state.workflow.flows.push(flow);
    },
    REMOVE_FLOW(state, flow) {
        console.debug('remove flow')
    },
    CLEAR_FLOWS(state) {
        state.workflow.flows.length = 0;
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
        let headers = {'Content-Type': 'application/json', 'X-Auth-Token': '123456'}
        let httpMethod = 'post';
        if (cloned.id !== 0){
            httpMethod = 'patch';
            url = `${url}/${cloned.id}`;
        } 
        Vue.http[httpMethod](url, cloned, {headers}).then(function (response) {
            console.debug(response);
            return response.data;
        });
        if (tmp) {
            tmp.value = JSON.stringify(cloned,
                (key, value) => {
                    if (key === 'operation') {
                        const op = state.lookupOperations[value.id];
                        return { name: op.name, slug: op.slug, id: op.id };
                    } else if (key === 'classes') {
                        return undefined;
                    } else {
                        return value;
                    }
                });
        }
    }

}
window.store = state;
export default new Vuex.Store({
    mutations,
    state,
    strict: false,
})
