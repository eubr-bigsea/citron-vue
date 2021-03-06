import Vue from 'vue';
import { getOperations } from '../vuex/getters';

const WebSocketComponent = Vue.extend({
    beforeDestroy() {
        try {
            if (this.connection) {
                //this.instance.detach(this.connection);
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
        let uuids = this.flow.uuids;
        if (! uuids) {
            uuids = [`${this.flow['source_id']}/${this.flow['source_port']}`, 
                `${this.flow['target_id']}/${this.flow['target_port']}`];
        }
        this.connection = this.instance.connect({uuids: uuids});
    },
    template: '<div class="hide" id="{{ flow.id }}""></div>'
});

export default FlowComponent;
