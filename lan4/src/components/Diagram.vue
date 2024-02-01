<template>
  <div id="contents">
    <canvas 
      id="canvas" 
      :height="canvas.height" 
      :width="canvas.width"
      @mousewheel="changeZoom"
      @mousedown.right.prevent="startDragging"
      @mousemove.right="dragging"
      @mouseup.right="stopDragging"
      >

    </canvas>
  </div>
</template>

<script>
import seedrandom from 'seedrandom';

class Node {
  constructor() {
    this.x = null
    this.y = null
    this.text = ""
    this.id = Math.floor(Math.random() * 1000000)
  }
}

export default {
  name: 'DiagramView',
  props: {
    graph: {
      type: Object,
    }
  },
  data:() => ({
    zoom: 100,
    offset: {
      x: 0,
      y: 0,
    },
    minTileSize: 15, 
    maxTileSize: 60,
    baseTileSize: 0,
    currentTileSize: 0,
    canvas: {
      ctx: null,
      height: 300,
      width: 300,
    },
    isDragging: false,
    dragStart: {
      x: 0,
      y: 0,
    },
    nodes: [
    ],
    edges: [
    ],
    seed: 0,
  }),
  methods : {
    transformCoord(x, y) {
      let newX = (x-1) * this.baseTileSize * this.zoom/100 + this.canvas.width/2 + this.offset.x + 1
      let newY = -(y+1) * this.baseTileSize * this.zoom/100 + this.canvas.height/2 + this.offset.y + 1

      return [newX, newY]
    },
    startDragging(event) {
      this.isDragging = true;
      this.dragStart = { x: event.clientX, y: event.clientY };
      document.addEventListener("mousemove", this.dragging);
      document.addEventListener("mouseup", this.stopDragging);

      document.getElementById('canvas').style.cursor = 'grab'
    },
    dragging(event) {
      if (this.isDragging) {
        const offsetX = event.clientX - this.dragStart.x;
        const offsetY = event.clientY - this.dragStart.y;
        this.offset.x += offsetX;
        this.offset.y += offsetY;
        this.dragStart = { x: event.clientX, y: event.clientY };
      }
    },
    stopDragging() {
      this.isDragging = false;
      document.removeEventListener("mousemove", this.dragging);
      document.removeEventListener("mouseup", this.stopDragging);

      document.getElementById('canvas').style.cursor = 'auto'
    },
    changeZoom(event) {
      this.zoom = Math.min(1000, Math.max(10, this.zoom+Math.ceil(event.deltaY*.5)))
    },
    generateTile(x, y, tileSize) {
      this.canvas.ctx.fillStyle = "transparent";
      this.canvas.ctx.strokeStyle = "#333";
      this.canvas.ctx.lineWidth = 0.1;

      const halfSize = tileSize / 2;

      this.canvas.ctx.strokeRect(
        Math.floor(x - halfSize + this.canvas.width / 2) + 0.5,
        Math.floor(y - halfSize + this.canvas.height / 2) + 0.5,
        tileSize,
        tileSize
      );
    },
    generateAxis() {
      this.canvas.ctx.beginPath();
      this.canvas.ctx.moveTo(0, this.canvas.height / 2 + this.offset.y);
      this.canvas.ctx.lineTo(this.canvas.width, this.canvas.height / 2 + this.offset.y);
      this.canvas.ctx.strokeStyle = 'black';
      this.canvas.ctx.lineWidth = 2;
      this.canvas.ctx.stroke();

      this.canvas.ctx.beginPath();
      this.canvas.ctx.moveTo(this.canvas.width / 2 + this.offset.x, 0);
      this.canvas.ctx.lineTo(this.canvas.width / 2 + this.offset.x, this.canvas.height);
      this.canvas.ctx.strokeStyle = 'black';
      this.canvas.ctx.lineWidth = 2;
      this.canvas.ctx.stroke();
    },
    generateNodes() {
      for (let i=0; i<this.nodes.length; i++) {
        this.canvas.ctx.fillStyle = "red";
        this.canvas.ctx.strokeStyle = "red";
        this.canvas.ctx.lineWidth = 2;

        this.canvas.ctx.strokeRect(
          (this.nodes[i].x - .5) * this.baseTileSize * this.zoom/100 + this.canvas.width/2 + this.offset.x + 1,
          -(this.nodes[i].y+.5) * this.baseTileSize * this.zoom/100 + this.canvas.height/2 + this.offset.y + 1,
          this.baseTileSize * this.zoom/100 - 1,
          this.baseTileSize * this.zoom/100 - 1
        );

        this.canvas.ctx.fillStyle = "white";
        this.canvas.ctx.textAlign = "center";
        this.canvas.ctx.textBaseline = "middle";
        this.canvas.ctx.font = "12px Arial";

        this.canvas.ctx.fillText(
            this.nodes[i].text,
            this.nodes[i].x * this.baseTileSize * this.zoom / 100 + this.canvas.width / 2 + this.offset.x,
            -this.nodes[i].y * this.baseTileSize * this.zoom / 100 + this.canvas.height / 2 + this.offset.y
        );
      }
    },
    generateEdges() {
      for (let i=0; i<this.edges.length; i++) {

        let transformationOrigin = {
          x: 0,
          y: 0, 
        }

        let transformationDestin = {
          x: 0,
          y: 0, 
        }

        if (this.edges[i][0].x < this.edges[i][1].x) {
          if (this.edges[i][0].y == this.edges[i][1].y) {
            transformationOrigin.x = .5
            transformationDestin.x = -.5
          }
          else {
            transformationOrigin.x = 0
            transformationDestin.x = -.5 
          }
        }

        else if (this.edges[i][0].x > this.edges[i][1].x) {
          if (this.edges[i][0].y == this.edges[i][1].y) {
            transformationOrigin.x = -.5
            transformationDestin.x = .5
          }
          else {
            transformationOrigin.x = 0 
            transformationDestin.x = .5
          }
        }

        else {
          transformationDestin.y = 0
        }

        if (this.edges[i][0].y > this.edges[i][1].y) {
          if (this.edges[i][0].x == this.edges[i][1].x) {
            transformationOrigin.y = -.5
            transformationDestin.y = .5
          }
          else {
            transformationOrigin.y = -.5
            transformationDestin.y = 0
          }
        }

        else if (this.edges[i][0].y < this.edges[i][1].y) {
          if (this.edges[i][0].x == this.edges[i][1].x) {
            transformationOrigin.y = .5
            transformationDestin.y = -.5
          }
          else {
            transformationOrigin.y = .5
            transformationDestin.y = 0
          }
        }


        this.canvas.ctx.beginPath()
        this.canvas.ctx.moveTo(
          ... this.transformCoord(
            this.edges[i][0].x + 1 + transformationOrigin.x,
            this.edges[i][0].y - 1 + transformationOrigin.y,
          )
        )
        this.canvas.ctx.lineTo(
          ... this.transformCoord(
            this.edges[i][0].x + 1 + transformationOrigin.x,
            this.edges[i][1].y - 1 + transformationDestin.y,
          )
        )
        this.canvas.ctx.strokeStyle = 'blue';
        this.canvas.ctx.lineWidth = 2;
        this.canvas.ctx.stroke();

        this.canvas.ctx.beginPath()
        this.canvas.ctx.moveTo(
          ... this.transformCoord(
            this.edges[i][0].x + 1 + transformationOrigin.x,
            this.edges[i][1].y - 1 + transformationDestin.y,
          )
        )
        this.canvas.ctx.lineTo(
          ... this.transformCoord(
            this.edges[i][1].x + 1 + transformationDestin.x,
            this.edges[i][1].y - 1 + transformationDestin.y,
          )
        )
        this.canvas.ctx.strokeStyle = 'blue';
        this.canvas.ctx.lineWidth = 2;
        this.canvas.ctx.stroke();


      }
    },
    generateGrid() {
      let currentTileSize = this.baseTileSize

      if (this.zoom > 100) {
        currentTileSize *= this.zoom/100
        while (currentTileSize>this.maxTileSize) {
          currentTileSize = currentTileSize/Math.floor(this.maxTileSize/this.minTileSize)
        }
      }
      else if (this.zoom < 100) {
        currentTileSize *= this.zoom/100
        while (currentTileSize<this.minTileSize) {
          currentTileSize = Math.floor(this.maxTileSize/this.minTileSize)*currentTileSize
        }
      }
      
      this.currentTileSize = currentTileSize

      let rowsNum = Math.ceil((this.canvas.height/2) / currentTileSize)
      let colsNum = Math.ceil((this.canvas.width/2) / currentTileSize)

      for (let i=1; i<=colsNum+1; i++) {
        for (let j=1; j<=rowsNum+1; j++) {
          this.generateTile(
            i*currentTileSize - currentTileSize + this.offset.x%currentTileSize,
            j*currentTileSize - currentTileSize + this.offset.y%currentTileSize,
            currentTileSize
          )
          this.generateTile(
            -(i*currentTileSize) + this.offset.x%currentTileSize,
            -(j*currentTileSize) + this.offset.y%currentTileSize,
            currentTileSize
          )
          this.generateTile(
            -(i*currentTileSize) + this.offset.x%currentTileSize,
            j*currentTileSize - currentTileSize  + this.offset.y%currentTileSize,
            currentTileSize
          )
          this.generateTile(
            (i*currentTileSize - currentTileSize) + this.offset.x%currentTileSize,
            -(j*currentTileSize) + this.offset.y%currentTileSize,
            currentTileSize
          )
        }
      }
    },
    generateBoard() {
      const canvas = document.getElementById("canvas")
      this.canvas.ctx = canvas.getContext("2d")
      this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.generateGrid()
      this.generateEdges()
      this.generateNodes()
    },
    createNode(event) {
      let x = Math.floor((event.x  - this.canvas.width/2 + this.currentTileSize/2) / this.currentTileSize)
      let y = Math.floor((this.canvas.height/2 - event.y) / this.currentTileSize)

      let node = new Node()

      node.x = x
      node.y = y
      this.nodes.push(node)

      this.canvas.ctx.fillStyle = "red";
      this.canvas.ctx.strokeStyle = "red";
      this.canvas.ctx.lineWidth = 1;

      this.canvas.ctx.strokeRect(
        ...this.transformCoord(x,y),
        this.baseTileSize * this.zoom/100 - 1,
        this.baseTileSize * this.zoom/100 - 1
      );

    },
    positionNodes() {
      this.edges = []
      this.nodes = []

      const nodes = [...this.graph.nodes]
      const edges = [...this.graph.edges]

      const rng = seedrandom(this.seed)
      nodes.forEach(node => {
        const newNode = new Node()
        newNode.id = node.id
        newNode.text = node.name
        newNode.x = Math.floor(rng() * 10) - 5
        newNode.y = Math.floor(rng() * 18) - 9
        this.nodes.push(newNode)
      });

      const k = 1
      const c = 0.25
      const iterations = 1000

      for (let iter = 0; iter < iterations; iter++) {
        // eslint-disable-next-line no-unused-vars
        const forces = this.nodes.map(node => ({ x: 0, y: 0 }));

        this.nodes.forEach((node1, i) => {
          this.nodes.forEach((node2, j) => {
            if (i !== j) {
              const dx = node2.x - node1.x;
              const dy = node2.y - node1.y;
              const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              const forceX = (dx / distance) * k * k / distance;
              const forceY = (dy / distance) * k * k / distance;

              forces[i].x -= forceX;
              forces[i].y -= forceY;
            }
          });
        });

        edges.forEach(edge => {
          const node1 = this.nodes.find(node => node.id === edge.from);
          const node2 = this.nodes.find(node => node.id === edge.to);

          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const forceX = (dx / distance) * distance * c;
          const forceY = (dy / distance) * distance * c;

          const index1 = this.nodes.findIndex(node => node.id === edge.from);
          const index2 = this.nodes.findIndex(node => node.id === edge.to);

          forces[index1].x += forceX;
          forces[index1].y += forceY;

          forces[index2].x -= forceX;
          forces[index2].y -= forceY;
        });

        this.nodes.forEach((node, i) => {
          node.x = Math.round(node.x + forces[i].x);
          node.y = Math.round(node.y + forces[i].y);
        });
      }

      const centroid = {
        x: Math.round(this.nodes.reduce((sum, node) => sum + node.x, 0) / this.nodes.length),
        y: Math.round(this.nodes.reduce((sum, node) => sum + node.y, 0) / this.nodes.length),
      };

      this.nodes.forEach(node => {
        node.x -= centroid.x;
        node.y -= centroid.y;
      });

      edges.forEach(edge => {
        const node1 = this.nodes.find(node => node.id === edge.from);
        const node2 = this.nodes.find(node => node.id === edge.to);

        this.edges.push([
          { x: node1.x, y: node1.y },
          { x: node2.x, y: node2.y }
        ]);
      });
    }
  },
  mounted() {
    this.baseTileSize = Math.ceil((this.minTileSize + this.maxTileSize) / 2);

    let container = document.getElementById('contents')
    this.canvas.height = container.getBoundingClientRect().height
    this.canvas.width = container.getBoundingClientRect().width

    setTimeout(()=>{
      this.generateBoard();
    })

    /*window.addEventListener('resize', () => {
      let container = document.getElementById('contents');

      this.canvas.height = container.getBoundingClientRect().height;
      this.canvas.width = container.getBoundingClientRect().width;
      this.baseTileSize = Math.ceil((this.minTileSize + this.maxTileSize) / 2);
      this.generateBoard();
    })*/
  },

  watch: {
    zoom() {
      this.generateBoard()
    },
    offset: {
      handler() {
        this.generateBoard()
      },
      deep: true,
    },
    graph: {
      handler() {
        this.positionNodes()
        this.generateBoard()
      },
      deep: true,
    }
  }
}
</script>

<style scoped>
#contents {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  border-top: 1px solid var(--v-secondary-base);
}
#zoom {
  position: absolute;
  top: 30px;
  transform: translateX(-100px);
}
#offset {
  position: absolute;
  top: 30px;
  transform: translateX(100px);
}
</style>
