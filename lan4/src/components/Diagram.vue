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

class Node {
  constructor() {
    this.x = null
    this.y = null
    this.text = ""
    this.id = Math.floor(Math.random() * 1000000)
    this.adjacents = []
    this.adjacentCount = 0
  }
}

export default {
  name: 'DiagramView',
  props: {
    treeNode: {
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
      height: 600,
      width: 800,
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
      this.canvas.ctx.strokeStyle = "#f00";
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
        this.canvas.ctx.fillStyle = "#888";
        this.canvas.ctx.strokeStyle = "#888";
        this.canvas.ctx.lineWidth = 1;

        let width = (this.nodes[i].text.length * Math.floor(6*(this.zoom/100))) + 10
        let tiles = Math.ceil(width/(this.baseTileSize*this.zoom/100))

        this.canvas.ctx.strokeRect(
          (this.nodes[i].x - tiles*.5) * this.baseTileSize * this.zoom/100 + this.canvas.width/2 + this.offset.x + 1,
          -(this.nodes[i].y+.5) * this.baseTileSize * this.zoom/100 + this.canvas.height/2 + this.offset.y + 1,
          (this.baseTileSize * this.zoom/100 - 1)*tiles,
          this.baseTileSize * this.zoom/100 - 1
        );

        this.canvas.ctx.fillStyle = "white";
        this.canvas.ctx.textAlign = "center";
        this.canvas.ctx.textBaseline = "middle";
        this.canvas.ctx.font = Math.floor(12*(this.zoom/100))+"px Arial";

        this.canvas.ctx.fillText(
            this.nodes[i].text,
            this.nodes[i].x * this.baseTileSize * this.zoom / 100 + this.canvas.width / 2 + this.offset.x,
            -this.nodes[i].y * this.baseTileSize * this.zoom / 100 + this.canvas.height / 2 + this.offset.y
        );
      }
    },
    generateEdges() {
      this.edges.map(edge => edge.sort((a, b) => a.x - b.x).sort((a,b) => b.y - a.y))

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
            transformationOrigin.x = .5*this.edges[i][0].width
            transformationDestin.x = -.5*this.edges[i][1].width
          }
          else {
            transformationOrigin.x = 0*this.edges[i][0].width
            transformationDestin.x = -.5 *this.edges[i][1].width
          }
        }

        else if (this.edges[i][0].x > this.edges[i][1].x) {
          if (this.edges[i][0].y == this.edges[i][1].y) {
            transformationOrigin.x = -.5*this.edges[i][0].width
            transformationDestin.x = .5
          }
          else {
            transformationOrigin.x = 0 *this.edges[i][0].width
            transformationDestin.x = .5*this.edges[i][1].width
          }
        }

        else {
          transformationDestin.y = 0*this.edges[i][1].width
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
        this.canvas.ctx.strokeStyle = '#333';
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
        this.canvas.ctx.strokeStyle = '#333';
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

      //this.generateGrid()
      //this.generateAxis()
      console.log(Array.from(this.treeNode.nodes.map(a=>a.name)))
      setTimeout(()=>{
        this.generateEdges()
        this.generateNodes()
      }, 100)
    },
    createNode(event) {
      let x = Math.floor((event.x  - this.canvas.width/2 + this.currentTileSize/2) / this.currentTileSize)
      let y = Math.floor((this.canvas.height/2 - event.y) / this.currentTileSize)

      let node = new Node()

      node.x = x
      node.y = y
      this.nodes.push(node)

      this.canvas.ctx.fillStyle = "#333";
      this.canvas.ctx.strokeStyle = "#333";
      this.canvas.ctx.lineWidth = 1;

      this.canvas.ctx.strokeRect(
        ...this.transformCoord(x,y),
        this.baseTileSize * this.zoom/100 - 1,
        this.baseTileSize * this.zoom/100 - 1
      );
    },
    incest(node, siblings) {
      let incestous = []
      for (let i in siblings) {
        if (siblings[i] != node) {
          if (node.adjacents.includes(siblings[i].id)) {
            incestous.push(siblings[i])
          }
        }
      }
      return incestous
    },
    positionNodes() {
      this.nodes = []
      this.edges = []
      this.sets = this.treeNode.sets

      this.treeNode.nodes.forEach((node)=>{
        let newNode = new Node()
        newNode.text = node.name
        newNode.id = node.id
        this.nodes.push(newNode)
      })
      this.treeNode.edges.forEach((edge)=>{
        let node1 = this.nodes.find(node => node.id == edge.from)
        let node2 = this.nodes.find(node => node.id == edge.to)
        let set1 = this.sets.find(set => set.id === edge.from);
        let set2 = this.sets.find(set => set.id === edge.to);

        if (node1 && node2) {
          node1.adjacents.push(node2.id)
          node1.adjacentCount += 1
        }
        else if (node1 && set2) {
          for (let i in set2.concepts) {
            let setNode = this.nodes.find(node => node.id == set2.concepts[i].id)
            node1.adjacents.push(setNode.id)
            node1.adjacentCount += 1
          }
        }
        else if (node2 && set1) {
          for (let i in set1.concepts) {
            let setNode = this.nodes.find(node => node.id == set1.concepts[i].id)
            setNode.adjacents.push(node2.id)
            setNode.adjacentCount += 1
          }
        }
      })

      let traversingNodes = [... this.nodes].sort((node1, node2) => node1.adjacentCount - node2.adjacentCount)

      let row = 0
      let col = 0

      function drawSubgraph(node, adjacentNodes, nodes, vm) {
        traversingNodes = traversingNodes.filter(node => !adjacentNodes.includes(node))
        let carry = 0
        let placedNodes = []

        for (let i in adjacentNodes) {
          if (placedNodes.some(node => vm.incest(adjacentNodes[i], adjacentNodes).includes(node))) {
            carry += 2
          }
          adjacentNodes[i].x = node.x + 2 + Math.floor(node.text.length/5) + carry + col
          adjacentNodes[i].y = node.y - i*2 + row

          placedNodes.push(adjacentNodes[i])

          let childAdjacentNodes = nodes.filter(node => adjacentNodes[i].adjacents.includes(node.id))
          childAdjacentNodes = childAdjacentNodes.filter(node => traversingNodes.includes(node))
          childAdjacentNodes = childAdjacentNodes.sort((node1, node2) => node1.adjacentCount - node2.adjacentCount)
          childAdjacentNodes = childAdjacentNodes.sort((node1, node2) => vm.incest(node2, childAdjacentNodes).length - vm.incest(node1, childAdjacentNodes).length)

          if (childAdjacentNodes.length) {
            drawSubgraph(adjacentNodes[i], childAdjacentNodes, nodes, vm)
          }
        }
      }

      while (traversingNodes.length) {
        let currentNode = traversingNodes.pop()
        currentNode.x = col
        currentNode.y = row

        let adjacentNodes = this.nodes.filter(node => currentNode.adjacents.includes(node.id))
        adjacentNodes = adjacentNodes.sort((node1, node2) => node1.adjacentCount - node2.adjacentCount)
        adjacentNodes = adjacentNodes.sort((node1, node2) => this.incest(node2, adjacentNodes).length - this.incest(node1, adjacentNodes).length)

        drawSubgraph(currentNode, adjacentNodes, this.nodes, this)
        row += 2
      }

      const centroid = {
          x: Math.round(this.nodes.reduce((sum, node) => sum + node.x, 0) / this.nodes.length),
          y: Math.round(this.nodes.reduce((sum, node) => sum + node.y, 0) / this.nodes.length),
      };
      this.nodes.forEach(node => {
        node.x -= centroid.x;
        node.y -= centroid.y;
      });

      this.treeNode.edges.forEach(edge => {
        const node1 = this.nodes.find(node => node.id === edge.from);
        const node2 = this.nodes.find(node => node.id === edge.to);
        const set1 = this.sets.find(set => set.id === edge.from);
        const set2 = this.sets.find(set => set.id === edge.to);

        if (set1 && !set2) {
          for (let i in set1.concepts) {
            let setNode = this.nodes.find(node => node.id === set1.concepts[i].id)
            let width1 = (setNode.text.length * Math.floor(6*(this.zoom/100))) + 10
            let tiles1 = Math.ceil(width1/(this.baseTileSize*this.zoom/100))

            let width2 = (node2.text.length * Math.floor(6*(this.zoom/100))) + 10
            let tiles2 = Math.ceil(width2/(this.baseTileSize*this.zoom/100))

            this.edges.push([
              { x: setNode.x, y: setNode.y, width: tiles1 },
              { x: node2.x, y: node2.y, width: tiles2 },
            ]);
          }
        }
        if (set2 && !set1) {
          for (let i in set2.concepts) {
            let setNode = this.nodes.find(node => node.id === set2.concepts[i].id)
            let width1 = (node1.text.length * Math.floor(6*(this.zoom/100))) + 10
            let tiles1 = Math.ceil(width1/(this.baseTileSize*this.zoom/100))

            let width2 = (setNode.text.length * Math.floor(6*(this.zoom/100))) + 10
            let tiles2 = Math.ceil(width2/(this.baseTileSize*this.zoom/100))

            this.edges.push([
              { x: node1.x, y: node1.y, width: tiles1 },
              { x: setNode.x, y: setNode.y, width: tiles2 },
            ]);
          }
        }
        else {
          let width1 = (node1.text.length * Math.floor(6*(this.zoom/100))) + 10
          let tiles1 = Math.ceil(width1/(this.baseTileSize*this.zoom/100))

          let width2 = (node2.text.length * Math.floor(6*(this.zoom/100))) + 10
          let tiles2 = Math.ceil(width2/(this.baseTileSize*this.zoom/100))

          this.edges.push([
            { x: node1.x, y: node1.y, width: tiles1 },
            { x: node2.x, y: node2.y, width: tiles2 },
          ]);
        }
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
    treeNode: {
      handler() {
        this.positionNodes()
        setTimeout(()=>{
          this.generateBoard();
        })
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
</style>