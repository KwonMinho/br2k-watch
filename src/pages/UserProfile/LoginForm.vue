<template>
  <card class="card" title="Login Form">
    <div>
      <form @submit.prevent>
        <div class="row">
          <div class="col-md-6">
            <fg-input type="text"
                      label="Account"
                      v-model="account">
            </fg-input>
          </div>
          <div class="col-md-6">
            <fg-input type="password"
                      label="Password"
                      v-model="password">
            </fg-input>
          </div>
        </div>

        <div>
          <p style="color:gray" class="mt-2">CA.crt </p>
          <b-form-file v-model="ca" id="file-ca"></b-form-file>
        </div>
        <div >
          <p style="color:gray" class="mt-2">Cert.pem </p>
          <b-form-file v-model="cert" id="file-cert"></b-form-file>
        </div>
        <div>
          <p style="color:gray" class="mt-2">Key.pemt </p>
          <b-form-file v-model="certKey" id="file-key"></b-form-file>
        </div><br>
        <div class="text-center">
          <p-button type="info"
                    round
                    @click.native.prevent="login">
            Login
          </p-button>
        </div>
        <div class="clearfix"></div>
      </form>
    </div>
  </card>
</template>
<script>
import web3 from 'web3'


export default {
  data() {
    return {
       account: null,
       password: null,
       ca:null,
       cert: null,
       certKey:null
    };
  },
  methods: {
    async login() {
      if(this.account==null || this.password==null ){
        this.notifyWarning("Empty account or password!");
        return
      }
      if(!web3.utils.isAddress(this.account)){
        this.notifyWarning("Invalid your account(etheruem)");
        return
      }
      this.$store.commit('login',{
        account: this.account,
        password: this.password,
        ca: this.ca,
        cert: this.cert,
        key: this.certKey
      })
      this.notifySuccess(this.account);
    },
    notifyWarning(msg){
      this.$notify.warning({
        position: 'bottom right',
        title: 'Failed Login',
        msg: msg,
      })
    },
    notifySuccess(msg){
      this.$notify.success({
        position: 'bottom right',
        title: 'Success Login',
        msg: msg,
      })  
    }
  }
};
</script>
<style>
</style>
