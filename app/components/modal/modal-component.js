import Vue from 'vue';
import template from './modal-template.html';
import './modal.scss';

// register modal component
const ModalComponent = Vue.component('modal', {
    methods: {
        close(){
            this.show = false;
        }
    },
    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        }
    },
    ready: function () {
        document.addEventListener("keydown", (e) => {
            if (this.show && e.keyCode == 27) {
                this.close();
            }
        });
    },
    template,
})
export default ModalComponent;