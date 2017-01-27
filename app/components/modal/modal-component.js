import Vue from 'vue';
import template from './modal-template.html';
import './modal.scss';

// register modal component
const ModalComponent = Vue.component('modal', {
    created(){
        document.getElementsByTagName('body')[0].style.overflow = 'hidden';
        console.debug('INICIANDO')
    },
    methods: {
        close(){
            this.show = false;
            document.getElementsByTagName('body')[0].style.overflow = 'auto';
        }
    },
    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        },
        cancel: {
            type: Boolean,
            required: false,
            twoWay: false
        },
        close: {
            type: Boolean,
            required: false,
            twoWay: false
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