<template>
  <div>
    <div v-if="curIsUpdating" class="text-center">
        <b-spinner variant="primary" label="Text Centered"></b-spinner></br></br>
      <strong>updating...</strong>
    </div>
  <div v-if="isView() && !curIsUpdating">
    <b-badge variant="primary">Service Name</b-badge>
    <h1>{{ scvList[curSettingIndex].name }}</h1>
    <br />
    <div class="text-center col-md-7 col-xl-3">
      <b-card header-tag="header" footer-tag="footer">
        <b-card-text>
          <h4>
            Current Replicas:<span></span
            ><b-badge variant="light">{{
              scvList[curSettingIndex].replicas.length
            }}</b-badge>
          </h4>
          <h4>
            Number Of Failed:<span></span
            ><b-badge :variant="hasExistFailed()?'danger':'light'">{{ this.getFailedNumber() }}</b-badge>
          </h4>
        </b-card-text>
        <template #footer>
          <em>
            <b-button
              :disabled="hasExistFailed()"
              v-on:click="changeSelectedBtn('REDUCE_REPLICAS')"
              v-b-modal.modal-prevent-closing
              style="margin-right: 8px"
              :variant="hasExistFailed()?'':'danger'"
              >REDUCE</b-button
            >
            <b-button
              :disabled="hasExistFailed()"
              v-on:click="changeSelectedBtn('ADD_REPLICAS')"
              v-b-modal.modal-prevent-closing
              style="margin-right: 8px"
              :variant="hasExistFailed()?'':'success'"
              >ADD</b-button
            >
            <b-button
              :disabled="!hasExistFailed()"
              :class="hasExistFailed()?'fbutton':''"
              v-on:click="recovery()"
            >RECOVERY</b-button>
          </em>
        </template>
      </b-card>
    </div>
    <b-card>
      <b-tabs card>
        <b-tab
          v-on:click="askReadLogStream(app.podName)"
          :title="app.podName"
          v-for="app in scvList[curSettingIndex].replicas"
          :key="app.podName"
        >
          <div
            style="
              background-color: #101010;
              color: #a9a9a9;
              overflow: auto;
              position: relative;
              height: 400px;
            "
          >
            <span style="white-space: pre-line">{{ curReadLog }}</span>
          </div>
        </b-tab>
      </b-tabs>
    </b-card>
    <!--- Add, Reduce modal area -->
    <b-modal
      id="modal-prevent-closing"
      ref="modal"
      :title="curUpdateBtn"
      @show="resetModal"
      @hidden="resetModal"
      @ok="updateModalOk"
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          label="Number of update"
          label-for="replicas-input"
          invalid-feedback="Replicas(Positive number) is required"
          :state="updateNumberValid"
        >
          <b-form-input
            type="number"
            id="name-input"
            v-model="updateNumber"
            :state="updateNumberValid"
            required
          ></b-form-input>
        </b-form-group>
      </form>
    </b-modal>
  </div>
  </div>
</template>



<script>
import { mapState } from "vuex";

export default {
  components: {},

  computed: {
    ...mapState({
      scvList: "serviceList",
      curSettingIndex: "curSettingScvIndex",
      curReadLog: "curReadLog",
      curIsUpdating: "curIsUpdating"
    }),
  },

  data() {
    return {
      tableScvInfo: this.serviceList,
      intro: this.curReadLog,
      updateNumber: null,
      updateNumberValid: null,
      curUpdateBtn: "",
    };
  },
  methods: {
    hasExistFailed(){
      const curIndex = this.curSettingIndex;
      const scv = this.scvList[curIndex];    
      const curReplicasLen = scv.replicas.length;
      for(let i=0; i<curReplicasLen; i++){
        if(scv.replicas[i].state != 'Running') 
          return true;
      }
      return false;
    },
    recovery(){
      if(!this.hasExistFailed()){
        this.warningNotify(
          "Can't recovery",
          'There is nothing to recover'
        );
        return;
      }else{
        this.$store.commit("recoveryReplicas", {
          curScvIndex: this.curSettingIndex,
          failedList: this.extractFailedList(),
        });  
      }
    },
    extractFailedList(){
      const curIndex = this.curSettingIndex;
      const scv = this.scvList[curIndex];    
      const curReplicasLen = scv.replicas.length;

      let failedList = [];
      for(let i=0; i<curReplicasLen; i++){
        if(scv.replicas[i].state != 'Running') {
          failedList.push(i);
        };
      }
      return failedList;   
    },
    changeSelectedBtn(type) {
      this.curUpdateBtn = type;
    },
    updateAddReplicas() {
      if (!this.checkFormValidity()) {
        return;
      }

      const curIndex = this.curSettingIndex;
      const scv = this.scvList[curIndex];
      const maxReplicas = scv.context.servicePoints.length;
      const curReplicas = scv.curReplicas;
      const availableNumber = maxReplicas - curReplicas;

      //check update number
      if (availableNumber < this.updateNumber) {
        this.warningNotify(
          "Can't update...",
          `The maximum add number is ${availableNumber}`
        );
        return;
      }

      this.$store.commit("addReplicas", {
        curScvIndex: curIndex,
        updateNumber: this.updateNumber,
      });      
      // 내가 원하는 코드 작성

      this.$nextTick(() => {
        this.$bvModal.hide("modal-prevent-closing");
      });
    },
    updateReduceReplicas() {
      console.log("reduce");
      if (!this.checkFormValidity()) {
        return;
      }

      const curIndex = this.curSettingIndex;
      const scv = this.scvList[curIndex];
      const curReplicas = scv.curReplicas;
      console.log(scv)
      if(curReplicas-this.updateNumber<3){
        this.warningNotify(
          "Can't update...",
          'The Minimum number of replicas should be kept at least 3'
        );
        return;
      }
      this.$store.commit("reduceReplicas", {
        curScvIndex: curIndex,
        updateNumber: this.updateNumber,
      });      
      // 내가 원하는 코드 작성
      this.$nextTick(() => {
        this.$bvModal.hide("modal-prevent-closing");
      });
    },
    askReadLogStream(podName) {
      const curIndex = this.curSettingIndex;
      const scvList = this.scvList;

      this.$store.commit("readLogStream", {
        scvName: scvList[curIndex].name,
        curScvIndex: curIndex,
        podName: podName,
      });
    },
    isView() {
      return this.curSettingIndex != -1;
    },
    getFailedNumber() {
      let number = 0;
      const curIndex = this.curSettingIndex;
      const scvList = this.scvList;
      scvList[curIndex].replicas.forEach((app) => {
        if (app.state != "Running") ++number;
      });
      return number;
    },
    readStateColor(scv) {
      if (scv.isViewDeployState == 1) return "success";
      else if (scv.isViewDeployState == -1) return "danger";
      else if (scv.isViewDeployState == 0) return "warning";
    },
    //For modal functions
    resetModal() {
      this.updateNumber = null;
      this.updateNumberValid = null;
    },
    updateModalOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      if (this.curUpdateBtn == "ADD_REPLICAS") this.updateAddReplicas();
      else this.updateReduceReplicas();
    },
    checkFormValidity() {
      if (this.updateNumber <= 0) {
        this.updateNumberValid = false;
        return false;
      }
      const valid = this.$refs.form.checkValidity();
      this.updateNumberValid = valid;
      return valid;
    },
    //notify
    warningNotify(title, msg) {
      this.$notify.warning({
        position: "bottom right",
        title: title,
        msg: msg,
      });
    },
  },
};
</script>
<style>
</style>
