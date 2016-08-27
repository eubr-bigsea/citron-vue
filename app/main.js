import Vue from 'vue';
import VueResource from 'vue-resource';
import AppComponent from './components/app/app';
import DiagramComponent from './components/diagram/diagram';
import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';
//import $http from "./customAjax";
import css from './components/diagram/diagram.scss';

Vue.use(VueResource);

new Vue({
  el: '#app',
  data: {
    title: 'Toolbox',
    newSearchTerm: "OK",
    operations: []
  },
  components: {
    'app-component': AppComponent,
    'toolbox-component': ToolboxComponent,
    'diagram-component': DiagramComponent,
  },
});
