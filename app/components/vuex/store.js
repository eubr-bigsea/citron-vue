import Vuex from 'vuex';
import Vue from 'vue';

Vue.use(Vuex);

const state = {
  count: 0,
  operations: [],
  groupedOperations: {},
  errors: []
}
const mutations = {
  INCREMENT(state, amount) {
    state.count += amount;
  },
  LOAD_OPERATIONS(state) {
    console.debug('Getting operations')
    let url = 'http://beta.ctweb.inweb.org.br/tahiti/operations?token=123456';
    Vue.http.get(url).then(function (response) {
      return response.data;
    }).then(function (data) {
      let groupedOps = {};
      console.debug('1')
      data.forEach((op) => {
        op.categories.forEach((cat) => {
          if (cat.type === 'parent'){
            if (! (cat.name in groupedOps)){
              groupedOps[cat.name] = [op];
            } else {
              groupedOps[cat.name].push(op);
            }
          }
        });
      });
      //console.debug(groupedOps);
      state.groupedOperations = groupedOps;
      state.operations = data;
    }).catch(function (error) {
      state.errors.push(error);
    });
  }
}

export default new Vuex.Store({
  state,
  mutations
})