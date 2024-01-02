<template>
  <v-app>
    <v-main>
      <div id="titlebar" class="d-flex pt-2 pr-2">
      </div>
      <div id="main">
        <div class="horizontal-half">
          <div class="vertical-half">
            <RawText/>
          </div>
          <div class="vertical-half">
            <CodeEditor/>
          </div>
        </div>
        <div class="horizontal-half">
          <MapView/>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script>

//import EventBus from '@/event-bus.js';

//import {Statement, Action, Condition, Category, Concept, Relation, Lan, Tab, Line, Table, Cell} from '@/classes/classes.js';

import MapView from '@/components/MapView';
import RawText from '@/components/RawText';
import CodeEditor from '@/components/CodeEditor';

export default {
  name: 'App',

  components: {
    MapView,
    RawText,
    CodeEditor,
  },

  data: () => ({
  }),

  methods: {
  },

  watch: {
  },

  computed : {
  },

  async created() {
  }
};
</script>

<style>
  ::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
  body, html {
    height: 100vh;
    width: 100h;
    margin: 0px;
    padding: 0px;
    overflow: hidden;
  }
  #titlebar {
    width: 100%;
    height: 28px;
    background: #222;
    -webkit-app-region: drag;
  }
  #main {
    height: calc(100vh - 28px);
    width: 100h;
    display: flex;
  }
  .horizontal-half {
    height: 100%;
    width: 50%;
  }
  .vertical-half {
    height: 50%;
    width: 100%;
    flex: 1;
  }
</style>