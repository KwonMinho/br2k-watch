<template>
  <div v-if='isView()'>
    <h2>Service Detail</h2><br>
    <b-table-simple hover small caption-top responsive>
      <colgroup><col><col></colgroup>
      <colgroup><col><col><col></colgroup>
      <colgroup><col><col></colgroup>
      <b-thead head-variant="dark">
        <b-tr>
          <b-th>Attribute</b-th>
          <b-th></b-th>
          <b-th>Value</b-th>
        </b-tr>
     </b-thead>
      <b-tbody>
        <b-tr>
          <b-th :variant="readStateColor(scvList[curIndex])" rowspan="5">Current State</b-th>
          <b-th class="text-right">State</b-th>
          <b-td>{{scvList[curIndex].state}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Current Replica</b-th>
          <b-td>{{scvList[curIndex].curReplicas}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Current Service Location</b-th>
          <b-td>{{scvList[curIndex].curServiceLocation}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Start Time</b-th>
          <b-td>{{scvList[curIndex].serviceStartTime}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service End Time</b-th>
          <b-td>{{scvList[curIndex].serviceEndTime}}</b-td>
        </b-tr>
        <!---Header---> 
        <b-td colspan="7" variant="secondary"></b-td>    
        <b-tr>
          <b-th rowspan="7">Header</b-th>
          <b-th class="text-right">Name</b-th>
          <b-td >{{scvList[curIndex].name}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Description</b-th>
          <b-td>{{scvList[curIndex].header.desc}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Manager</b-th>
          <b-td>{{scvList[curIndex].header.manager}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Account</b-th>
          <b-td>{{scvList[curIndex].header.serviceAccount}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Company</b-th>
          <b-td>{{scvList[curIndex].header.name}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Company Email</b-th>
          <b-td>{{scvList[curIndex].header.email}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Company Contact</b-th>
          <b-td>{{scvList[curIndex].header.contact}}</b-td>
        </b-tr>
        <!--- Context--->
        <b-td colspan="7" variant="secondary"></b-td>
        <b-tr>
          <b-th rowspan="10">Context</b-th>
          <b-th class="text-right">API server</b-th>
          <b-td>{{scvList[curIndex].context.location}}</b-td>
        </b-tr>
        <b-tr>
          <b-th  class="text-right">Access Token</b-th>
          <b-td>{{scvList[curIndex].context.accessToken}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Secret</b-th>
          <b-td>{{scvList[curIndex].context.secret}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Node ID</b-th>
          <b-td>{{scvList[curIndex].context.nodeID}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Network ID</b-th>
          <b-td>{{scvList[curIndex].context.networkID}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Protocol</b-th>
          <b-td>{{scvList[curIndex].context.serviceProtocol}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Port</b-th>
          <b-td>{{scvList[curIndex].context.servicePort}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Available Points</b-th>
          <b-td>{{scvList[curIndex].context.servicePoints}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Service Mount</b-th>
          <b-td>{{scvList[curIndex].context.nodeMountScv}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">ETCD Mount</b-th>
          <b-td>{{scvList[curIndex].context.nodeMountETCD}}</b-td>
        </b-tr>
        <!--- Context--->
        <b-td colspan="7" variant="secondary"></b-td>
        <b-tr>
          <b-th rowspan="2">Container Image</b-th>
          <b-th class="text-right">Image</b-th>
          <b-td>{{scvList[curIndex].imageInfo.image}}</b-td>
        </b-tr>
        <b-tr>
          <b-th class="text-right">Access user</b-th>
          <b-td>{{scvList[curIndex].imageInfo.accessUser}}</b-td>
        </b-tr>
      </b-tbody>
    </b-table-simple>
  </div>
</template>
<script>

// //variant="danger" warning success secondary
import { PaperTable } from "@/components";
import { mapState } from "vuex";


export default {
  components: {
    PaperTable
  },

  computed: {
    ...mapState({
      scvList: "serviceList",
      curIndex: "curDetailScvIndex"
    })
  },

  data() {
    return {
      tableScvInfo: this.serviceList
    };
  },
  methods:{
    isView(){
      return (this.curIndex != -1)
    },
    readStateColor(scv){
      if(scv.isViewDeployState == 1) return "success"
      else if(scv.isViewDeployState == -1) return "danger"
      else if(scv.isViewDeployState == 0) return "warning"
    }
  }
};
</script>
<style>
</style>
