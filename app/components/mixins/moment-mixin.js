import moment from 'moment';

const MomentMixin = {
    /* Methods */
    methods: {
        formatDate(date, format) {
            return date ? moment(date).format(format): '';
        },
    }
}

export default MomentMixin;