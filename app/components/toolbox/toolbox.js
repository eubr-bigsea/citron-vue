import Vue from 'vue';
import template from './toolbox-template.html';
import { getCount } from '../vuex/getters';
import { getOperations } from '../vuex/getters';
import './toolbox.scss';

const ToolboxComponent = Vue.extend({
    template,
    vuex: {
        actions: {
        }
    },
    props: {
        "title": {},
        "operation": {
            'default': function () { return { name: '', icon: '' }; }
        }
    },
    components: {
    },
    methods: {
        drag(ev) {
            var crt = ev.target.cloneNode(true);
            document.body.appendChild(crt);
            crt.style.position = 'absolute';
            crt.style.left = '-1000px';
            ev.dataTransfer.setData("text", ev.target.innerHTML);
            ev.dataTransfer.setData("id", ev.target.dataset.operationId);
            crt.classList.add('dragging')
            ev.dataTransfer.setDragImage(crt, 0, 0);
        },
    }
});

export default ToolboxComponent;
