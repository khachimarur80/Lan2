<template>
  <div id="RawText">
    <textarea v-model="text" @dblclick="transformText" v-if="file"></textarea>
  </div>
</template>

<script>
import EventBus from '@/event-bus.js';

export default {
  name: 'RawText',

  data: () => ({
    text: "",
    file: null,
    dictionary: {
      concepts: [],
      relations: [],
    }
  }),

  props: {
    mode: {
      required: true,
    }
  },

  methods: {
    importText() {
      EventBus.$emit('importText', this.text)
    },
    async openFile(file) {
      const data = await new Promise(resolve => {
        window.electronAPI.requestFileData(file)
        window.electronAPI.response('file-data-response', resolve)
      });
      if (data) {
        this.text = data
        this.file = file
      }
      else {
        this.file = file
        this.text = ""
      }
    },
    transformText() {
      if (this.mode == 'concept') {
        this.makeConcept()
      }
      else if (this.mode == 'relation') {
        this.makeRelation()
      }
    },
    makeConcept() {
      const selectedText = this.getSelectedText();

      const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = new RegExp(escapedText, 'g');
      const newText = this.text.replace(regexPattern, `${selectedText}`);

      this.text = newText;

      if (!this.dictionary.concepts.includes(selectedText)) {
        this.dictionary.concepts.push(selectedText)
      }
      EventBus.$emit('updateDictionary', this.dictionary)
    },
    makeRelation() {
      const selectedText = this.getSelectedText();

      const escapedText = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = new RegExp(escapedText, 'g');
      const newText = this.text.replace(regexPattern, `${selectedText}`);

      this.text = newText;

      if (!this.dictionary.relations.includes(selectedText)) {
        this.dictionary.relations.push(selectedText)
      }
      EventBus.$emit('updateDictionary', this.dictionary)
    },
    getSelectedText() {
      const textarea = this.$el.querySelector('textarea');
      return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    },
    saveText() {
      if (this.file) {
        let newNodes = []
        let concepts = (this.text.match(/(?<=\[)[^\]]+(?=\])/g) || [])

        for (let i=0; i<concepts.length; i++) {
          newNodes.push({
            id : Math.floor(Math.random()*100000),
            label: concepts[i],
          })
        }

        EventBus.$emit('updateNodes', newNodes)
        window.electronAPI.requestSaveFile(this.file, this.text)
      }
    }
  },

  computed: {
  },

  async created() {
    EventBus.$on('fileopened', this.openFile);
  },

  watch : {
    text : 'saveText',
  },
}
</script>

<style scoped>
  
#RawText {
  height: calc(100%);
  width: calc(100%);
  position: relative;
  border-right: 1px solid var(--v-secondary-base);
}
textarea {
  height: 100%;
  width: 100%;
  outline: none;
  color: white;
  resize: none;
  background: #191919;
  padding: 5px 10px 5px 10px;
}
</style>
