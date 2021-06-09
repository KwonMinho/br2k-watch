<template>
  <nav class="navbar navbar-expand-lg navbar-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">{{routeName}}</a>
      <button class="navbar-toggler navbar-burger"
              type="button"
              @click="toggleSidebar"
              :aria-expanded="$sidebar.showSidebar"
              aria-label="Toggle navigation">
        <span class="navbar-toggler-bar"></span>
        <span class="navbar-toggler-bar"></span>
        <span class="navbar-toggler-bar"></span>
      </button>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="ti-panel"></i>
              <p>Stats</p>
            </a>
          </li>
          <li class="nav-item">
            <a href="#/stats" v-on:click="logOut()" class="nav-link">
              <i class="ti-user"></i>
              <p>
                {{loginState()}}
              </p>
            </a>
          </li>
        </ul>
      </div>
    </div></nav>
</template>
<script>
import { mapState } from "vuex";

export default {
  computed: {
    routeName() {
      const { name } = this.$route;
      return this.capitalizeFirstLetter(name);
    },
    ...mapState({
      isUserLogin: "isUserLogin"
    })
  },
  data() {
    return {
      activeNotifications: false
    };
  },
  methods: {
    logOut(){
      if(this.isUserLogin){
        this.$store.commit('logout');
      }
    },
    loginState(){
      if(this.isUserLogin) return 'LOGOUT'
      else return 'LOGIN'
    },
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    toggleNotificationDropDown() {
      this.activeNotifications = !this.activeNotifications;
    },
    closeDropDown() {
      this.activeNotifications = false;
    },
    toggleSidebar() {
      this.$sidebar.displaySidebar(!this.$sidebar.showSidebar);
    },
    hideSidebar() {
      this.$sidebar.displaySidebar(false);
    }
  }
};
</script>
<style>
</style>
