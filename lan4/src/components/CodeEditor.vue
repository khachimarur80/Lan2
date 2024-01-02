<template>
  <div id="CodeEditor">
    <textarea v-model="code" @keydown.enter="codeToGraph" @input="saveCode"></textarea>
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
  }),

  props: {
  },

  methods: {
    setCode(text) {
      this.code = text
    },
    saveCode() {
      window.electronAPI.saveCodeData(this.code)
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
              id : this.graph.nodes.length + 1,
              label: nodo,
              name:  nodo,
              shape: 'circle'
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
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoIzquierda,
                name:  nodoIzquierda,
                shape: 'circle'
              })
              idNodoIzquierda = this.graph.nodes.length;
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoDerecha,
                name:  nodoDerecha,
                shape: 'circle'
              })
              idNodoDerecha = this.graph.nodes.length;
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
                label: relacion,
                smooth: { type: 'straightCross' }
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
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoIzquierda,
                name:  nodoIzquierda,
              })
              idNodoIzquierda = this.graph.nodes.length;
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoDerecha,
                name:  nodoDerecha,
              })
              idNodoDerecha = this.graph.nodes.length;
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
                label: relacion,
                smooth: { type: 'straightCross' }
              })
            }
          }

          else {
            let [nodoIzquierda, nodoDerecha] = (sentencia.match(/\[([^\]]+)\]/g) || []).map(match => match.slice(1, -1));
            let relacion = (sentencia.match(/-([^]+)-/) || [])[1] || null;

            let idNodoIzquierda
            let idNodoDerecha

            if (!this.getNodeByName(nodoIzquierda)) {
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoIzquierda,
                name:  nodoIzquierda,
              })
              idNodoIzquierda = this.graph.nodes.length;
            }
            else {
              idNodoIzquierda = this.getNodeByName(nodoIzquierda).id
            }

            if (!this.getNodeByName(nodoDerecha)) {
              this.graph.nodes.push({
                id : this.graph.nodes.length + 1,
                label: nodoDerecha,
                name:  nodoDerecha,
              })
              idNodoDerecha = this.graph.nodes.length;
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
                label: relacion,
                smooth: { type: 'straightCross' }
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
  padding: 10px;
  padding-top: 5px;
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
</style>
