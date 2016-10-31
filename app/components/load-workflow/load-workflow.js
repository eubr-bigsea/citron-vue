import Vue from 'vue';
import jsep from 'jsep';
import template from './load-workflow-template.html';
import ModalComponent from '../modal/modal-component.js';

const LoadWorkflowComponent = Vue.extend({
    components: {
        'modal-component': ModalComponent
    },
    data(){
        return {
            currentTab: 'math',
        }
    },
    computed: {
    },
    methods: {
        selectTab(tab){
            console.debug(tab, '<= selected')
            this.currentTab = tab;
        },
        updatePos(ev) {
            let ctl = ev.target;
            console.debug(ctl.selectionStart)
        },
    },
    props: {
        show: true
    },
    ready() {

    },
    template,


});

export default LoadWorkflowComponent;
