<template>
  <card class="card"  title="Service List">
    <div>
      <ul class="list-unstyled team-members">
        <li>
          <div class="row" v-for="scv in scvList" :key="scv.name">
            <div class="col-1">
            </div>
            <div class="col-6">
              {{scv.name}}<br>
              <span :class="getStatusClass(scv)">
                <small>{{scv.state}}</small>
              </span>
            </div>
            <div class="col-3">
              <a href="#/detail" v-on:click="detail(scv.name)">
                <p-button type="success" icon><i class="ti-search"></i></p-button>
              </a>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </card>
</template>
<script>
import { mapState } from "vuex";


export default {
  computed: {
    ...mapState({
      scvList: "serviceList",
    })
  },
  data() {
    return {};
  },
  methods: {
    detail(scvName){
      this.$store.commit('changeDetailService', scvName);
      console.log("detail")
    },
    getStatusClass(scv) {
      switch (scv.isViewDeployState) {
        case 0: return "text-muted";
        case 1: return "text-success";
        case -1: return "text-danger";
      }
    }
  }
};
</script>
<style>
</style>
