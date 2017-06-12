import Vue from 'vue';
import VueResource from 'vue-resource';



import ToolboxComponent from './components/toolbox/toolbox';

import jsPlumb from 'jsplumb';

import './components/diagram/diagram.scss';
import "bootstrap-sass/assets/stylesheets/_bootstrap.scss";
import './components/app/app.scss';
import store from './components/vuex/store'

import VueProgressBar from 'vue-progressbar'
import Toastr from 'vue-toastr';
import UserCardComponent from './components/user-card/user-card.vue';
import AppComponent from './components/app/app';
import router from './router';

Vue.use(VueResource);
Vue.use(VueProgressBar, {
    color: '#ed8',
    failedColor: '#874b4b',
    thickness: '5px',
    transition: {
        speed: '0.2s',
        opacity: '0.6s'
    },
    autoRevert: true,
    inverse: false
})
let requestCounter = 0;

Vue.http.interceptors.push((request, next) => {
    /*if (requestCounter === 0){
        Vue.prototype.$Progress.start(1000*30);
    } else {
        Vue.prototype.$Progress.increase(100);
    }*/
    //document.querySelector('.page-overlay').style.visibility = 'visible';
    requestCounter++;
    next((response) => {
        requestCounter--;
        if (requestCounter === 0) {
            //Vue.prototype.$Progress.finish();
            document.querySelector('.page-overlay').style.visibility = 'hidden';
        }
    });
});

Vue.component('vue-toastr', Toastr);
Vue.config.async = false;

/** */
new Vue({
    el: '#app',
    mounted(){
         document.querySelector('.page-overlay').style.visibility = 'hidden';
    },
    components: {
        'app-component': AppComponent,
        'toolbox-component': ToolboxComponent,
        'user-card': UserCardComponent
    },
    router,
    store,
}).$mount('#app');

Vue.config.errorHandler = function(err, vm) {
    console.debug('Erro no VUE', err, vm);
    return false;
}
Vue.filter('json', value => { return JSON.stringify(value, null, 2) } )

export {router};