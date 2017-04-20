<template>
    <li :class="['dropdown', open ? 'open' : '']">
        <a href="#" class="dropdown-toggle" data-toggle="dropdown" @click="toggle">
            <span class="fa fa-user-circle"></span>&nbsp;
            <strong>{{label}}</strong>
            <span class="fa fa-chevron-down"></span>
        </a>
        <ul class="dropdown-menu dropdown-menu-right">
            <slot></slot>
        </ul>
    </li>
</template>

<style lang="css" scoped>
    .dropdown-toggle {
        margin-right: 25px;
    }
    .dropdown-menu {
        width: 320px;
        margin-right: 25px;
        padding: 20px;
    }
</style>
<script>
    export default {
        data() {
            return {
                open: false
            }
        },
        methods: {
            clickOut() {
                if (event.target)
                    this.open = false;
            },
            toggle(ev) {
                this.open = !this.open;
                ev.stopPropagation();
            }
        },
        mounted() {
            if (typeof document !== 'undefined') {
                document.documentElement.addEventListener('click', this.clickOut);
            }
        },
        props: {
            label: {
                type: String,
                default: 'User'
            },
            variant: {
                type: String,
                default: 'btn-default'
            },
            link: {
                type: String,
                default: null
            }
        }
    };
</script>