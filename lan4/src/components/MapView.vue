<template>
  <div id="map"></div>
</template>

<script>
import { Network } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import EventBus from '@/event-bus.js';

export default {
  name: 'MapView',

  data() {
    return {
      graph: {},
    };
  },

  methods: {
    renderGraph() {
      const container = document.getElementById('map');

      // Create a network
      const data = {
        nodes: this.graph.nodes,
        edges: this.graph.edges,
      };

      const options = {
        physics: {
          enabled: true,
          hierarchicalRepulsion: {
            nodeDistance: 1,
          },
          stabilization: {
            fit: true,
          },
        },
        nodes: {
          shape: 'box',
          size: 10,
          color: {
            background: '#fff',
            border: '#000',
          },
          font: {
            color: '#000',
            multi: 'html',
            align: 'center',
          },
        },
        edges: {
          color: '#fff',
          width: 1,
          smooth: false,
          font: {
            color: '#fff',
            multi: 'html',
            align: 'middle',
            strokeWidth: 0,
          },
        },

      };

      const network = new Network(container, data, options);

      network.on('click', this.handleNodeClick);
      network.on('dragEnd', (event) => {
        const nodeId = event.nodes[0];
        const node = network.body.nodes[nodeId];

        if (node) {
          // Snap the node position to the grid
          const gridSize = 50; // Set your desired grid size
          node.x = Math.round(node.x / gridSize) * gridSize;
          node.y = Math.round(node.y / gridSize) * gridSize;

          // Update the network with the new node positions
          network.redraw();
        }
      });
    },
    updateGraph(newGraph) {
      this.graph = newGraph
      this.renderGraph()

      window.electronAPI.saveGraphData(this.graph)
    },
    handleNodeClick(params) {
      const nodeId = params.nodes[0];
      console.log(`Node ${nodeId} clicked`);
    },
  },

  async created() {
    EventBus.$on('updateGraph', this.updateGraph)

    const data = await new Promise(resolve => {
      window.electronAPI.getGraphData()
      window.electronAPI.response('get-graph-data-response', resolve)
    })

    this.graph = {
  "nodes": [
    { "id": 1, "label": "Xyzzy", "group": "Concepts" },
    { "id": 2, "label": "Flibbertigibbet", "group": "Concepts" },
    { "id": 3, "label": "Bamboozle", "group": "Symptoms" },
    { "id": 4, "label": "Quixotic", "group": "Tests" },
    { "id": 5, "label": "Rambunctious", "group": "Treatments" },
    { "id": 6, "label": "Gobbledygook", "group": "Risk Factors" },
    // ... (repeat similar structures for more nodes)
    { "id": 100, "label": "Widdershins", "group": "Treatments" },
    // ... (add more nodes)
    { "id": 101, "label": "Whatchamacallit", "group": "Concepts" },
    { "id": 102, "label": "Brouhaha", "group": "Symptoms" },
    { "id": 103, "label": "Kaleidoscope", "group": "Tests" },
    { "id": 104, "label": "Pandemonium", "group": "Treatments" },
    { "id": 105, "label": "Higgledy-piggledy", "group": "Risk Factors" },
    // ... (repeat similar structures for more nodes)
  ],
  "edges": [
    { "from": 1, "to": 2, "label": "Related To" },
    { "from": 1, "to": 4, "label": "Indicates" },
    { "from": 2, "to": 5, "label": "Mitigates" },
    { "from": 3, "to": 1, "label": "Coexists With" },
    { "from": 4, "to": 1, "label": "Correlates With" },
    { "from": 5, "to": 6, "label": "Exacerbates" },
    // ... (repeat similar structures for more edges)
    { "from": 99, "to": 100, "label": "Augments" },
    { "from": 100, "to": 1, "label": "Ameliorates" },
    // ... (add more edges)
    { "from": 101, "to": 102, "label": "Causes" },
    { "from": 102, "to": 103, "label": "Diagnosed By" },
    { "from": 103, "to": 104, "label": "Treatment Involves" },
    { "from": 104, "to": 105, "label": "Associated With" },
    // ... (repeat similar structures for more edges)
  ]}
    console.log(data)
    this.renderGraph();
  },
};
</script>

<style scoped>
#map {
  height: calc(100% - 15px);
  width: calc(100% - 20px);
  margin: 10px;
  margin-bottom: 5px;
}
</style>
