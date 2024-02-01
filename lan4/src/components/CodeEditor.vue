<template>
  <div id="CodeEditor">
    <div v-once @keydown.enter="codeToGraph" @keydown="textKeydown" @input="saveCode" contenteditable ref="text">
      {{ code }}
    </div>
    <div class="predictions" :style="{'top':predictionCoords.y+'px', 'left':predictionCoords.x+'px'}" v-if="predictions.length > 0">
      <span v-for="(prediction, i) in predictions" :key="i" :class="['prediction', i==selectedPrediction ? 'selected-prediction' : '']" >
        {{ prediction.slice(1,-1) }}
      </span>
    </div>
  </div>
</template>

<script>
import EventBus from '@/event-bus.js';

export default {
  name: 'CodeEditor',

  data: () => ({
    code: "",
    graph: {
      nodes: [],
      edges: [],
    },
    selectedPrediction: null,
    predictions: [],
    predictionCoords: {
      x: 0,
      y: 0,
    },
    currentWord: null,
  }),

  props: {
    dictionary: {
      required: true,
    }
  },

  methods: {
    setCursorPosition(parent, range, stat) {
      if (stat.done) return range;

      if (parent.childNodes.length == 0) {
        if (parent.textContent.length >= stat.pos) {
          range.setStart(parent, stat.pos);
          stat.done = true;
        } 
        else {
          stat.pos = stat.pos - parent.textContent.length;
        }
      } 
      else {
        for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
          let currentNode = parent.childNodes[i];
          this.setCursorPosition(currentNode, range, stat);
        }
      }
      return range;
    },
    textKeydown(event) {
      if (event.key == 'ArrowUp') {
        this.selectedPrediction -= 1
        this.selectedPrediction = Math.max(0, this.selectedPrediction)
      }
      else if (event.key == 'ArrowDown') {
        this.selectedPrediction += 1
        this.selectedPrediction = Math.min(this.predictions.length-1, this.selectedPrediction)
      }
      else if (event.key == 'Tab') {
        event.preventDefault()

        if (this.predictions.length) {
          const sel = window.getSelection()
          const node = sel.focusNode
          const offset = sel.focusOffset
          const pos = this.getCursorPosition(this.$refs.text, node, offset, { pos: 0, done: false })

          let predictionLength = this.fillPrediction(this.predictions[this.selectedPrediction])
                              
          sel.removeAllRanges()

          console.log(pos.pos)

          const range = this.setCursorPosition(this.$refs.text, document.createRange(), {
            pos: pos.pos + predictionLength,
            done: false,
          })

          range.collapse(true)
          sel.addRange(range)

          this.predictions = []
          this.selectedPrediction = null
        }
      }
    },
    fillPrediction(word) {

      const selection = window.getSelection();
      const node = selection.focusNode;
      const offset = selection.focusOffset;
      const pos = this.getCursorPosition(this.$refs.text, node, offset, { pos: 0, done: false });

      this.code = this.code.slice(0,pos.pos-this.currentWord.length)+word+this.code.slice(pos.pos,-1)
      this.$refs.text.textContent = this.code

      return word.length
    },
    getCursorPosition(parent, node, offset, stat) {
      if (stat.done) return stat;

      let currentNode = null;
      if (parent.childNodes.length == 0) {
          stat.pos += parent.textContent.length;
      } else {
          for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
          currentNode = parent.childNodes[i];
          if (currentNode === node) {
              stat.pos += offset;
              stat.done = true;
              return stat;
          } else this.getCursorPosition(currentNode, node, offset, stat);
          }
      }
      return stat;
    },
    setCode(text) {
      this.code = text
    },
    getCurrentWord() {
      const selection = window.getSelection();
      const node = selection.focusNode;
      const offset = selection.focusOffset;
      const pos = this.getCursorPosition(this.$refs.text, node, offset, { pos: 0, done: false });

      let word = ""
      let index = pos.pos - 1
      while (this.code[index]!=' ' && index > -1) {
        word = this.code[index] + word
        index -= 1
      }

      return word
    },
    getPredictions(word) {
      let matchingConcepts = this.dictionary.concepts.filter(concept => concept.toLowerCase().startsWith(word.toLowerCase()))

      let matchingRelations = this.dictionary.relations.filter(relation => relation.toLowerCase().startsWith(word.toLowerCase()))

      matchingConcepts = matchingConcepts.map((concept) => '['+concept+']')
      matchingRelations = matchingRelations.map((relation) => '-'+relation+'-')

      return matchingConcepts.concat(matchingRelations)
    },
    saveCode() {
      this.code = this.$refs.text.textContent
      window.electronAPI.saveCodeData(this.code)

      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      this.predictionCoords.x = rect.x + rect.width
      this.predictionCoords.y = rect.y + rect.height

      this.currentWord = this.getCurrentWord()

      this.predictions = this.getPredictions(this.currentWord)

      if (this.predictions.length) {
        this.selectedPrediction = 0
      }
      else {
        this.selectedPrediction = null
      }
    },
    updateGraph() {
      EventBus.$emit('updateGraph', this.graph)
    },
    getNodeByName(name) {
      return this.graph.nodes.find(node => node.name === name) || null;
    },
    getEdgeByName(name) {
      return this.graph.edges.find(edge => edge.name === name) || null;
    },
    codeToGraph() {
      let sentences = this.code.split('\n')

      for (let i=0; i<sentences.length; i++) {
        let sentencia = sentences[i]
        let hayNodo = /\[.*\]/.test(sentencia);
        let hayRelacion = /-.*-/.test(sentencia);
        let derecha = sentencia.includes('<')
        let izquierda = sentencia.includes('>') 
        //Nuevo nodo
        if (hayNodo && !hayRelacion) {
          let nodo = (/\[([^\]]+)\]/.exec(sentencia) || [])[1] || null;
          if (!this.getNodeByName(nodo)) {
            this.graph.nodes.push({
              id : Math.floor(Math.random() * 1000000),
              name:  nodo,
            })
          }
        }

        if (hayNodo && hayRelacion) {
          //Nueva asociación unidireccional derecha
          if (derecha) {
            let [nodoIzquierda, nodoDerecha] = (sentencia.match(/\[([^\]]+)\]/g) || []).slice(0, 2);
            let relacion = (sentencia.match(/-([^]+)-/) || [])[1] || null;

            let idNodoIzquierda
            let idNodoDerecha

            if (!this.getNodeByName(nodoIzquierda)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoIzquierda,
              })
              idNodoIzquierda = randomNum;
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoDerecha,
              })
              idNodoDerecha = randomNum;
            }
            else {
              idNodoDerecha = this.getNodeByName(nodoDerecha).id
            }

            let existeRelacion =  this.graph.edges.find(edge => edge.from==idNodoIzquierda && edge.to==idNodoDerecha) || null;

            if (!existeRelacion) {
              this.graph.edges.push({
                from: idNodoIzquierda,
                to: idNodoDerecha,
                arrows: 'from',
                name: relacion,
              })
            }
          }
          //Nueva asociación unidireccional izquierda
          if (izquierda) {
            let [nodoIzquierda, nodoDerecha] = (sentencia.match(/\[([^\]]+)\]/g) || []).slice(0, 2);
            let relacion = (sentencia.match(/-([^]+)-/) || [])[1] || null;

            let idNodoIzquierda
            let idNodoDerecha

            if (!this.getNodeByName(nodoIzquierda)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoIzquierda,
              })
              idNodoIzquierda = randomNum
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoDerecha,
              })
              idNodoDerecha = randomNum;
            }
            else {
              idNodoDerecha = this.getNodeByName(nodoDerecha).id
            }

            let existeRelacion =  this.graph.edges.find(edge => edge.from==idNodoDerecha && edge.to==idNodoIzquierda) || null;

            if (!existeRelacion) {
              this.graph.edges.push({
                from: idNodoDerecha,
                to: idNodoIzquierda,
                arrows: 'from',
                name: relacion,
              })
            }
          }

          else {
            let [nodoIzquierda, nodoDerecha] = (sentencia.match(/\[([^\]]+)\]/g) || []).map(match => match.slice(1, -1));
            let relacion = (sentencia.match(/-([^]+)-/) || [])[1] || null;

            let idNodoIzquierda
            let idNodoDerecha

            if (!this.getNodeByName(nodoIzquierda)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoIzquierda,
              })
              idNodoIzquierda = randomNum;
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              let randomNum = Math.floor(Math.random() * 1000000)
              this.graph.nodes.push({
                id : randomNum,
                name:  nodoDerecha,
              })
              idNodoDerecha = randomNum;
            }
            else {
              idNodoDerecha = this.getNodeByName(nodoDerecha).id
            }

            let existeRelacion =  this.graph.edges.find(edge => edge.from==idNodoDerecha && edge.to==idNodoIzquierda) || this.graph.edges.find(edge => edge.to==idNodoDerecha && edge.from==idNodoIzquierda) || null;

            if (!existeRelacion) {
              this.graph.edges.push({
                from: idNodoDerecha,
                to: idNodoIzquierda,
                name: relacion,
              })
            }
          }
        }

        //Sets ...
      }

      this.updateGraph()
    }
  },

  computed: {
  },

  watch: {
    graph: 'updateGraph',
  },

  async created() {
    const data = await new Promise(resolve => {
      window.electronAPI.getCodeData()
      window.electronAPI.response('get-code-data-response', resolve)
    })

    this.code = data
  },
}
</script>

<style scoped>
  
#CodeEditor {
  height: calc(100%);
  width: calc(100%);
}
div[contenteditable] {
  height: 100%;
  width: 100%;
  outline: none;
  color: white;
  resize: none;
  background: #191919;
  padding: 5px 10px 5px 10px;
}
.predictions {
  position: absolute;
  border: 1px solid #444;
  min-width: 50px;
  min-height: 10px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
}
.prediction {
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  cursor: pointer;
  transition: background .15s ease-in-out;
}
.prediction:first-child {
  border-radius: 5px 5px 0px 0px;
  border-bottom: 1px solid #444;
}
.prediction:last-child {
  border-radius: 0px 0px 5px 5px;
  border-bottom: none;
}
.prediction:hover {
  background: #333;
}
.selected-prediction {
  color: var(--v-error-base);
}
</style>
