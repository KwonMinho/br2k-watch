<template>
  <card class="card-user">
    <div slot="image">
      <img src="@/assets/img/background.jpg" alt="...">
    </div>
    <div>
      <div class="author">
        <img class="avatar border-white" src="@/assets/img/faces/face-1.jpg" alt="...">
        <h4 class="title">{{user.account}}
          <br>
          <a href="#">
            <small>@Ethereum</small>
          </a>
        </h4>
      </div>
      <p class="description text-center">
      </p>
    </div>
    <hr>
  </card>
</template>
<script>
import { mapState } from "vuex";


export default {
  computed: {
    ...mapState({
      user: "user"
    })
  },
  data() {
    return {
      details: [
        {
          title: "12",
          subTitle: "Files"
        },
        {
          title: "2GB",
          subTitle: "Used"
        },
        {
          title: "24,6$",
          subTitle: "Spent"
        }
      ]
    };
  },
  methods: {
    getClasses(index) {
      var remainder = index % 3;
      if (remainder === 0) {
        return "col-lg-3 offset-lg-1";
      } else if (remainder === 2) {
        return "col-lg-4";
      } else {
        return "col-lg-3";
      }
    }
  }
};
</script>
<style>
</style>
