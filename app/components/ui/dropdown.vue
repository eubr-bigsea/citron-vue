<template>
    <div :class="['btn-group', open ? 'open' : '']">
        <a type="button" :class="['btn', variant]" :href="link">
            <span :class="icon" v-if="icon"></span>
            {{label}}
        </a>
        <button type="button" :class="['btn', variant, 'dropdown-toggle']" data-toggle="dropdown" @click="toggle">
            <span class="caret"></span>
            <span class="sr-only">Toggle Dropdown</span>
        </button>
        <ul class="dropdown-menu">
            <slot></slot>
        </ul>
    </div>
</template>

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
            icon: {
                type: String,
                default: null,
            },
            label: {
                type: String,
                default: 'Action'
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