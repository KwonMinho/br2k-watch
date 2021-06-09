<template>
  <div>
    <!--jumbotron-->
    <b-jumbotron
      bg-variant="info"
      text-variant="white"
      v-if="!isUserLogin"
      header="Welcome!"
      lead="Kube watching dashboard for replication app"
    >
      <h3>You login first</h3>
    </b-jumbotron>
    <!--Stats cards-->
    <div v-if="isUserLogin" class="row">
      <div
        class="col-md-2 col-xl-4"
        v-for="scv in this.serviceList"
        :key="scv.name"
      >
        <div id="app" v-cloak>
          <stats-card>
            <div class="icon-big text-center col-md-10" slot="header">
              <i class="ti-layers-alt"></i>
            </div>
            <div class="numbers" slot="content">
              <a
                href="#/detail"
                v-on:mouseover="detailMouseOverLeave(true, scv)"
                v-on:mouseleave="detailMouseOverLeave(false, scv)"
                v-on:click="detail(scv.name)"
              >
                <b-badge
                  v-if="!scv.isMouseOver"
                  :variant="`${readStateColor(scv, 'name')}`"
                  >{{ scv.name }}</b-badge
                >
                <b-badge
                  v-if="scv.isMouseOver"
                  :variant="`${readStateColor(scv, 'name')}`"
                  >Click Detail</b-badge
                >
              </a>
              <div>
                <p><b>Desc:&nbsp;&nbsp;</b>{{ scv.header.desc }}</p>
              </div>
              <div>
                <p><b>Replicas:&nbsp;&nbsp;</b>{{ scv.curReplicas }}</p>
              </div>
              <div>
                <p><b>State:&nbsp;</b>{{ scv.state }}</p>
              </div>
              <div v-if="isServiceStart(scv)">
                <p><b>Service:&nbsp;</b>{{ scv.curServiceLocation }}</p>
              </div>
              <div>
                <p>
                  <b :class="`${readStateColor(scv, 'sentences')}`"
                    >{{ readStateCategori(scv) }}&nbsp;&nbsp;</b
                  >{{ scv.readTime }}
                </p>
              </div>
              <br />
              <div v-if="isServiceStart(scv)">
                <p>
                  <b :class="`${readStateColor(scv, 'sentences')}`"
                    >State Of Replicas&nbsp;&nbsp;</b
                  >
                </p>
              </div>
              <a href="#/setting" v-on:click="appSetting(scv.name)">
                <div
                  style="float: left"
                  v-for="app in scv.replicas"
                  :key="app.podName"
                >
                  <i
                    :class="`${getAppStateIcon(
                      app.state
                    )} icon-${getAppStateColor(app.state)}`"
                  ></i>
                </div>
              </a>
            </div>
            <div slot="footer" class="text-center row">
              <b-form-group
                label="Kube API Server:"
                label-for="ratio"
                label-cols-md="auto"
                class="mb-0 col-md-9"
              >
                <b-form-select
                  id="ratio"
                  v-model="scv.curAPIServer"
                  :options="scv.context.location"
                ></b-form-select>
              </b-form-group>
              <b-button
                squared
                variant="outline-secondary"
                v-on:click="refresh(scv.name)"
                >REFRESH</b-button
              >
            </div>
          </stats-card>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { StatsCard, ChartCard } from "@/components/index";
import Chartist from "chartist";

import { mapState } from "vuex";

export default {
  components: {
    StatsCard,
    ChartCard,
  },
  computed: {
    ...mapState({
      serviceList: "serviceList",
      isUserLogin: "isUserLogin",
    }),
  },

  methods: {
    detailMouseOverLeave(isOver, scv) {
      if (isOver) scv.isMouseOver = true;
      else scv.isMouseOver = false;
    },
    refresh(target) {
      const self = this;
      this.serviceList.forEach((scv, index) => {
        if (scv.name == target) {
          if (!self.isServiceStart(scv)) {
            self.readWarningNotify(
              "Can't refresh..",
              `This service ${scv.name} is not running`
            );
            return;
          }
          self.$store.commit("refreshState", {
            index: index,
            target: target,
            curAPIServer: scv.curAPIServer,
          });
        }
      });
    },
    appSetting(scvName) {
      this.$store.commit("changeAppSetting", scvName);
    },
    detail(scvName) {
      this.$store.commit("changeDetailService", scvName);
      console.log("detail");
    },
    isServiceStart(scv) {
      return scv.state == "Service Running";
    },
    getServiceLocation(scv) {
      console.log(scv);
      if (scv.state == "Running") return scv.curServiceLocation;
      else return "Service point does not exist yet";
    },
    getAppStateIcon(state) {
      if (state == "Running") return "ti-heart";
      else return "ti-heart-broken";
    },
    getAppStateColor(state) {
      if (state == "Running") return "success";
      else return "danger";
    },
    readStateCategori(scv) {
      if (scv.isViewDeployState == 1) return "Refresh Time: ";
      else if (scv.isViewDeployState == -1)
        return "Failed to read state of replicas app ";
      else if (scv.isViewDeployState == 0)
        return "Not start service or Now reading...";
    },
    readStateColor(scv, mode) {
      if (mode == "name") {
        if (scv.isViewDeployState == 1) return "success";
        else if (scv.isViewDeployState == -1) return "danger";
        else if (scv.isViewDeployState == 0) return "warning";
      } else if (mode == "sentences") {
        if (scv.isViewDeployState == -1) return "text-danger";
        else if (scv.isViewDeployState == 0) return "text-warning";
      }
    },

    readErrorNotify(title, msg) {
      //https://github.com/noxludio/vuejs-notify
      this.$notify.error({
        position: "bottom right",
        title: title,
        msg: msg,
      });
    },

    readWarningNotify(title, msg) {
      this.$notify.warning({
        position: "bottom right",
        title: title,
        msg: msg,
      });
    },

    readSuccessNotify(title, msg) {
      this.$notify.success({
        position: "bottom right",
        title: title,
        msg: msg,
      });
    },
  },

  created() {
    setInterval(
      (self) => {
        self.serviceList.forEach((scv, index) => {
          if (scv.isRecentlyRead) {
            if (scv.isViewDeployState == -1)
              self.readErrorNotify(
                "Failed Read!",
                scv.name + " service: " + scv.readErrorMsg
              );
            else if (scv.isViewDeployState == 1)
              self.readSuccessNotify("Readed State", scv.name + " service");
            self.$store.commit("completedStateNotify", index);
          }
        });
      },
      3000,
      this
    );
  },
};
</script>
<style></style>
