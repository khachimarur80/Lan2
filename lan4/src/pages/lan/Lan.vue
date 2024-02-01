<template>
  <v-app>
    <v-main>
      <div id="titlebar" class="d-flex pt-2 pr-2">
      </div>
      <div id="main">
        <div class="sidebar">
          <!--
          <div class="toggle-mode">
            <v-btn 
              icon solo dense small 
              @click="switchMode('folder')"
              :color="sidebarView == 'folder' ? 'error' : ''">
              <v-icon>
                mdi-folder-outline
              </v-icon>
            </v-btn>
            <v-btn 
              icon solo dense small 
              @click="switchMode('search')" 
              :color="sidebarView == 'search' ? 'error' : ''">
              <v-icon>
                mdi-magnify
              </v-icon>
            </v-btn>
          </div>--><br>
          <div class="sidebar-contents">
            <TreeView :items="folderStructure" :vault="vault"/>
          </div>
        </div>
        <div class="contents">
          <div class="horizontal-half">
            <div class="vertical-half">
              <RawText :mode="rawTextMode"/>
            </div>
            <div class="vertical-half">
              <vDictionary :dictionary="dictionary"/>
            </div>
          </div>
          <div class="horizontal-half">
            <div class="vertical-half">
              <CodeEditor :dictionary="dictionary"/>
            </div>
            <div class="vertical-half">
              <vDiagram :treeNode="graph"/>
            </div>
          </div>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script>

import EventBus from '@/event-bus.js';

//import {Statement, Action, Condition, Category, Concept, Relation, Lan, Tab, Line, Table, Cell} from '@/classes/classes.js';

import vDiagram from '@/components/Diagram';
import RawText from '@/components/RawText';
import CodeEditor from '@/components/CodeEditor';
import vDictionary from '@/components/vDictionary';
import TreeView from '@/components/TreeView';

export default {
  name: 'App',

  components: {
    vDiagram,
    RawText,
    CodeEditor,
    TreeView,
    vDictionary
  },

  data: () => ({
    sidebarView: "",
    folderStructure: [],
    graph: {},
    dictionary: {
      concepts: [],
      relations: [],
    },
    vault: "/Users/Kei/Desktop/Github/lan2/lan4/src/assets/files",
    rawTextMode: '',
  }),

  methods: {
    updateDictionary(newDictionary) {
      this.dictionary = newDictionary
    },

    async updateFolderStructure() {
      const folderStructure = await new Promise(resolve => {
        window.electronAPI.getFolderStructure(this.vault)
        window.electronAPI.response('get-folder-structure-response', resolve)
      })

      this.folderStructure = folderStructure
    },

    // ------------------------------------------ TREEVIEW ------------------------------------------- //
    
    //Open a directory
    openNode(node) {
      node.open = !node.open
    },
    //Save new name for a node
    saveFileNode(node, new_name) {
        if (this.file==node.id) {
            this.file = new_name
        }
        for (let i=0; i<this.tabs.length; i++) {
            if (this.tabs[i].path==node.id) {
                this.tabs[i].path = new_name
                this.tabs[i].name = this.fileName(new_name)
            }
        }
    },
    //Change location of a node
    moveFile(origin, destiny) {
        window.electronAPI.moveFileRequest(origin, destiny)
        setTimeout(()=>{this.updateFolderStructure()}, 100)
    },

    switchMode(newMode) {
      if (newMode == this.sidebarView) {
        this.sidebarView = ""
      }
      else {
        this.sidebarView = newMode
      }
    },

    updateGraph(graph) {
      this.graph = graph
    }
  },

  watch: {
  },

  computed : {
  },

  async created() {
    EventBus.$on('openNode', this.openNode);
    EventBus.$on('saveFileNode', this.saveFileNode)
    EventBus.$on('filemove', this.moveFile);
    EventBus.$on('updateGraph', this.updateGraph)
    EventBus.$on('updateDictionary', this.updateDictionary)

    this.updateFolderStructure()

    window.addEventListener('keydown', (event) => {
      if (event.key == 'Meta') {
        this.rawTextMode = 'concept'
      }
      else if (event.key == 'Alt') {
        this.rawTextMode = 'relation'
      }
    })
    window.addEventListener('keyup', () => {
      this.rawTextMode = ''
    })
  }
};
</script>

<style>
  ::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
  ::selection {
    background: rgba(255, 0, 0, .2);
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
  .contents {
    width: calc(100% - 150px);
    height: 100%;
    display: flex;
  }
  .sidebar {
    width: 150px;
    height: 100%;
    border-right: 1px solid var(--v-secondary-base);
  }
  .toggle-mode {
    width: 100%;
    background: transparent;
    padding: 5px;
    padding-right: 10px;
    padding-left: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
  .sidebar-contents {
    height: calc(100vh - 50px - 20px);
  }
</style>