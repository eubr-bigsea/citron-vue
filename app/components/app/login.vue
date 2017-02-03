<template>
    <div class="container">
        <div class="row small-padding">
            <div class="mainbox col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <div class="panel-title">Sign In</div>
                    </div>

                    <div class="panel-body">

                        <form id="loginform" class="form-horizontal" role="form">

                            <div class="input-group bottom-margin">
                                <span class="input-group-addon"><i class="glyphicon glyphicon-user"></i></span>
                                <input id="login-username" type="text" class="form-control" name="username" 
                                    value="" placeholder="username or email" v-model="login">
                            </div>

                            <div class="input-group bottom-margin">
                                <span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>
                                <input id="login-password" type="password" class="form-control" name="password"
                                     placeholder="password" v-model="password">
                            </div>

                            <div class="input-group bottom-margin">
                                <div class="checkbox">
                                    <label>
                                        <input id="login-remember" type="checkbox" name="remember" value="1" v-model="remember"/> Remember me
                                    </label>
                                </div>
                            </div>

                            <div class="form-group bottom-margin">
                                <!-- Button -->
                                <div class="col-sm-12 controls">
                                    <a id="btn-login" href="#" class="btn btn-success">Login  </a>
                                </div>
                            </div>
                            <div class="form-group bottom-margin">
                                <div class="col-md-12 control">
                                    <div> Don't have an account!
                                        <a href="#"> Sign Up Here</a>
                                    </div>
                                </div>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="css" scoped>
.bottom-margin {
    margin-bottom: 5px;
}
.form-group {
    margin-left: 0px;
}
</style>

<script>
    import Vue from 'vue';

    const tahitiUrl = 'http://beta.ctweb.inweb.org.br/tahiti';
    const LoginComponent = Vue.extend({
        data() {
            return {
                login: 'admin',
                password: '123456',
                remember: false
            }
        },
        mounted: function () {
            this.$el.querySelector('#login-username').focus();
        },
        methods: {
        },
        watch: {
        }
    });
    export default LoginComponent;
</script>