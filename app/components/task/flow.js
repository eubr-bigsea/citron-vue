import Vue from 'vue';
import { getCount } from '../vuex/getters';
import { getOperations } from '../vuex/getters';

const EdgeComponent = Vue.extend({
    beforeDestroy() {
        try {
            if (this.connection) {
                this.instance.detach(this.connection);
            }
        } catch (e) {
            //silently
        }
    },
    props: {
        flow: null,
        instance: null
    },
    ready() {
        this.connection = this.instance.connect(this.flow);
    },

});

export default EdgeComponent;
