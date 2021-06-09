<template>
    <div >
      <div v-if="isUserLogin">
        <user-card>
        </user-card>
        <members-card>
        </members-card>
      </div>
      <div v-if="!isUserLogin" >
        <loginForm>
        </loginForm>
      </div>
    </div>
</template>
<script>
import LoginForm from "./UserProfile/LoginForm.vue";
import UserCard from "./UserProfile/UserCard.vue";
import MembersCard from "./UserProfile/MembersCard.vue";
import { mapState } from "vuex";

export default {
  components: {
    LoginForm,
    UserCard,
    MembersCard
  },
  computed: {
    ...mapState({
      isUserLogin: "isUserLogin"
    })
  },
};
</script>
<style>
</style>
