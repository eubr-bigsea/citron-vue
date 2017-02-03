import Vue from 'vue';
import template from './modal-template.html';
import './modal.scss';

// register modal component
const ModalComponent = Vue.component('modal', {
    mounted() {
        document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    },
    methods: {
        closeModal() {
            document.getElementsByTagName('body')[0].style.overflow = 'auto';
        }
    },
    ready: function() {

    },
    template,
    props: ['onOkClick', 'onCancelClick']
})
export default ModalComponent;