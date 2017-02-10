const ListingMixin = {
    /* Data related*/
    computed: {
        pageData: function () {
            return this.$store.getters.getJobPage;
        },
    },
    data() {
        return {
            page: 1,
            asc: 'true',
            orderBy: 'name',
        }
    },
    /* Methods */
    methods: {
        sort(orderBy) {
            this.orderBy = orderBy;
            this.performLoad(true, orderBy);
        },
        load(parameters) {
            this.$store.dispatch('updatePageParameters', {
                page: 'job-list',
                parameters
            });
            this.$store.dispatch('loadJobPage', parameters);
        },
        performLoad(reload, orderBy) {
            let saved = this.$store.getters.getPageParameters['job-list'];
            if (this.$route.params.page || !saved || reload) {
                if (!reload) {
                    this.page = parseInt(this.$route.params.page) || 1;
                } else {
                    this.page = 1;
                }
                if (orderBy) {
                    this.asc = (this.asc === 'true') ? 'false' : 'true';
                }
                let data = this.getLoadData({
                    fields: this.fields,
                    page: this.page,
                    size: 20,
                    sort: orderBy || '',
                    asc: this.asc,
                });
                this.load(data);
            } else {
                this.page = saved.page;
                //this.platform = saved.platform || 'spark';
                this.load(saved);
            }
        },
        // To be redefined in component using mixin
        getLoadData(data){
            return data;
        }
    }
}

export default ListingMixin;