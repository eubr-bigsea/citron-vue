import Vue from 'vue';

const FlowComponent = Vue.extend({
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
    mounted() {
        console.debug('Flow mounted')
        this.$nextTick(()=>{
            let uuids = this.flow.uuids;
            if (! uuids) {
                uuids = [`${this.flow['source_id']}/${this.flow['source_port']}`, 
                    `${this.flow['target_id']}/${this.flow['target_port']}`];
            }
            this.connection = this.instance.connect({uuids: uuids});
            if (this.connection){
                let currentStyle = this.connection.getPaintStyle();
                currentStyle['strokeStyle'] = this.connection.endpoints[0].getPaintStyle().fillStyle;
                this.connection.setPaintStyle(currentStyle);
            }
        });
    },
    template: '<div class="hide" :id="flow.id"></div>'
});

export default FlowComponent;
