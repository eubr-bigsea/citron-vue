<template>
    <ul class="nav navbar-nav">
        <li class="dropdown" :class="[open ? 'open' : '']">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" @click.prevent="toggle"><span v-if="icon" :class="icon"></span> 
                {{label}} <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
                <slot></slot>
            </ul>
        </li>
    </ul>
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
                default: 'Dropdown'
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