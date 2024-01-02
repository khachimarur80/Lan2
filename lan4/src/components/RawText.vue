<template>
  <div id="RawText">
    <textarea v-model="text"></textarea>
    <v-btn id="import" text tile icon @click="importText" >
      <v-icon>
        mdi-arrow-down
      </v-icon>
    </v-btn>
  </div>
</template>

<script>
import EventBus from '@/event-bus.js';

export default {
  name: 'RawText',

  data: () => ({
    text: "",
  }),

  props: {
  },

  methods: {
    importText() {
      EventBus.$emit('importText', this.text)
    },
  },

  computed: {
  },

  async created() {
    const data = await new Promise(resolve => {
      window.electronAPI.getTextData()
      window.electronAPI.response('get-text-data-response', resolve)
    })

    this.text = data
  },
}
</script>

<style scoped>
  
#RawText {
  height: calc(100%);
  width: calc(100%);
  padding: 10px;
  padding-bottom: 5px;
  position: relative;
}
textarea {
  height: 100%;
  width: 100%;
  outline: none;
  color: white;
  resize: none;
  background: #222;
  padding: 5px;
}
#import {
  background: #222;
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
