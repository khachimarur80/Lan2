<template>
  <div id="CodeEditor">
    <div v-once @keydown.enter="compile" @keydown="textKeydown" @input="saveCode" contenteditable ref="text">
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
/* eslint-disable */

import EventBus from '@/event-bus.js';

export default {
  name: 'CodeEditor',

  data: () => ({
    code: "",
    graph: {
      nodes: [],
      edges: [],
      sets: [],
    },
    selectedPrediction: null,
    predictions: [],
    predictionCoords: {
      x: 0,
      y: 0,
    },
    currentWord: null,
    errors: [],
    functions: [],
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
      this.code = this.$refs.text.innerText
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
    highlightSyntax() {
      const sel = window.getSelection()
      const node = sel.focusNode
      const offset = sel.focusOffset
      const pos = this.getCursorPosition(this.$refs.text, node, offset, { pos: 0, done: false })

      this.$refs.text.innerHTML = this.code
        .replace('let', '<span class="let">let</span>')
        .replace("least", '<span class="least">least</span>')
        .replace("all", '<span class="all">all</span>')
        .replace("func", '<span class="func">func</span>')
        .replace("and", '<span class="and">and</span>')
        .replace("or", '<span class="or">or</span>')
        .replace("not", '<span class="not">not</span>')
        .replace("set", '<span class="set">set</span>')

      sel.removeAllRanges()

      const range = this.setCursorPosition(this.$refs.text, document.createRange(), {
        pos: pos.pos,
        done: false,
      })

      range.collapse(true)
      sel.addRange(range)
    },
    isConcept(word) {
      return word.startsWith('[') && word.endsWith(']')
    },
    isRelation(word) {
      return word.startsWith('-') && word.endsWith('-') ||
             word.startsWith('-') && word.endsWith('->') ||
             word.startsWith('<-') && word.endsWith('-')
    },
    isSet(word) {
      return word.startsWith('#')
    },
    evaluateImplication(sentence) {
      let sufficient = sentence.split('then')[0].split(/(\s+)/).filter(word => word.trim()!="").map(word => word.trim()).slice(1).join(' ').split(/\s+(and|or|not)\s+/)
      let necessary = sentence.split('then')[1].split(/(\s+)/).filter(word => word.trim()!="").map(word => word.trim()).join(' ').split(/\s+(and|or|not)\s+/)

      for (let i=0; i<sufficient.length; i++) {
        if (!['and', 'or', 'not'].includes(sufficient[i])) {
          let value = false
          let statement = ['let'].concat(sufficient[i].split(' '))
          if (statement.length == 2) {
            if (this.getNodeByName(statement[1].slice(1,-1))) {
              value = true
            }
          }
          else if (statement.length == 4 && this.isRelation(statement[2])) {
            //[]--[]
            if (this.isConcept(statement[1])&&this.isConcept(statement[3])) {
              let concept1 = this.getNodeByName(statement[1].slice(1,-1))
              let concept2 = this.getNodeByName(statement[3].slice(1,-1))

              if (concept1 && concept2) {
                if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null
                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (relationTo && relationFrom) {
                    value = true
                  }
                }
                if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (relationTo) {
                    value = true
                  }
                }
                if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (relationFrom) {
                    value = true
                  }
                }
              }
            }
            //#--[]
            if (this.isSet(statement[1])&&this.isConcept(statement[3])) {
              let targetSet = this.graph.sets.filter(set => set.name == statement[1].slice(1))
              let concept2 = this.getNodeByName(statement[3].slice(1,-1))

              if (targetSet.length && concept2) {
                for (let i in targetSet.concepts) {
                  let concept1 = targetSet.concepts[i]
                  if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                    let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null
                    let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                    if (relationTo && relationFrom) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                  if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                    let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                    if (relationTo) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                  if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                    let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                    if (relationFrom) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                }
              }
            }
            //[]--#
            if (this.isConcept(statement[1])&&this.isSet(statement[3])) {
              let targetSet = this.graph.sets.filter(set => set.name == statement[3].slice(1))
              let concept1 = this.getNodeByName(statement[1].slice(1,-1))

              if (targetSet.length && concept1) {
                for (let i in targetSet.concepts) {
                  let concept2 = targetSet.concepts[i]
                  if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                    let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null
                    let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                    if (relationTo && relationFrom) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                  if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                    let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                    if (relationTo) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                  if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                    let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                    if (relationFrom) {
                      value = value && true
                    }
                    else {
                      value = false
                      break
                    }
                  }
                }
              }
            }
            //#--#
            if (this.isSet(statement[1])&&this.isSet(statement[3])) {
              
            }
          }
          sufficient[i] = value
        }
      }

      let satisfies = this.evaluateExpression(sufficient)

      if (satisfies) {
        for (let i=0; i<necessary.length; i++) {
        if (!['and', 'or', 'not'].includes(necessary[i])) {
          let value = false
          let statement = ['let'].concat(necessary[i].split(' '))

          if (statement.length == 2) {
            if (!this.getNodeByName(statement[1].slice(1,-1))) {
              this.graph.nodes.push({
                id : Math.floor(Math.random() * 1000000),
                name:  statement[1].slice(1,-1),
              })
            }
          }
          else if (statement.length == 4 && this.isRelation(statement[2])) {
            //[]--[]
            if (this.isConcept(statement[1])&&this.isConcept(statement[3])) {
              let concept1 = this.getNodeByName(statement[1].slice(1,-1))
              let concept2 = this.getNodeByName(statement[3].slice(1,-1))

              if (!concept1) {
                concept1 = {
                  id : Math.floor(Math.random() * 1000000),
                  name:  statement[1].slice(1,-1),
                }
                this.graph.nodes.push(concept1)
              }
              if (!concept2) {
                concept2 = {
                  id : Math.floor(Math.random() * 1000000),
                  name:  statement[3].slice(1,-1),
                }
                this.graph.nodes.push(concept2)
              }

              if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                if (!relationTo) {
                  relationTo = {
                    from: concept1.id,
                    to: concept2.id,
                    name: statement[2].slice(1,-1),
                  }
                }

                this.graph.edges.push(relationTo)


                let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                if (!relationFrom) {
                  relationFrom = {
                    from: concept2.id,
                    to: concept1.id,
                    name: statement[2].slice(1,-1),
                  }
                }

                this.graph.edges.push(relationFrom)
              }
              if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                if (!relationTo) {
                  relationTo = {
                    from: concept1.id,
                    to: concept2.id,
                    name: statement[2].slice(1,-2),
                  }
                }

                this.graph.edges.push(relationTo)


                let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                if (relationFrom) {
                  this.errors.push({
                    type: 'Incongruence Error',
                    at: i
                  })
                }
              }
              if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                if (!relationTo) {
                  this.errors.push({
                    type: 'Incongruence Error',
                    at: i
                  })
                }


                let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                if (!relationFrom) {
                  relationFrom = {
                    from: concept2.id,
                    to: concept1.id,
                    name: statement[2].slice(2,-1),
                  }
                }
                
                this.graph.edges.push(relationFrom)
              }
            }
            //#--[]
            if (this.isSet(statement[1])&&this.isConcept(statement[3])) {
              let targetSet = this.graph.sets.filter(set => set.name == statement[1].slice(1))
              if (!targetSet) {
                targetSet = {
                  id : Math.floor(Math.random() * 1000000),
                  name: statement[1].slice(1),
                  concepts: []
                }
                this.graph.sets.push(targetSet)
              }
              else {
                targetSet = targetSet[0]
              }

              let concept2 = this.getNodeByName(statement[3].slice(1,-1))
              if (!concept2) {
                concept2 = {
                  id : Math.floor(Math.random() * 1000000),
                  name:  statement[3].slice(1,-1),
                }
                this.graph.nodes.push(concept2)
              }


              for (let i in targetSet.concepts) {
                let concept1 = targetSet.concepts[i]
                if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    relationTo = {
                      from: concept1.id,
                      to: concept2.id,
                      name: statement[2].slice(1,-1),
                    }
                  }

                  this.graph.edges.push(relationTo)


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (!relationFrom) {
                    relationFrom = {
                      from: concept2.id,
                      to: concept1.id,
                      name: statement[2].slice(1,-1),
                    }
                  }

                  this.graph.edges.push(relationFrom)
                }
                if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    relationTo = {
                      from: concept1.id,
                      to: concept2.id,
                      name: statement[2].slice(1,-2),
                    }
                  }

                  this.graph.edges.push(relationTo)


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (relationFrom) {
                    this.errors.push({
                      type: 'Incongruence Error',
                      at: i
                    })
                  }
                }
                if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    this.errors.push({
                      type: 'Incongruence Error',
                      at: i
                    })
                  }


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (!relationFrom) {
                    relationFrom = {
                      from: concept2.id,
                      to: concept1.id,
                      name: statement[2].slice(2,-1),
                    }
                  }
                  
                  this.graph.edges.push(relationFrom)
                }
              }
            }
            //[]--#
            if (this.isConcept(statement[1])&&this.isSet(statement[3])) {
              let targetSet = this.graph.sets.filter(set => set.name == statement[3].slice(1))
              if (!targetSet) {
                targetSet = {
                  id : Math.floor(Math.random() * 1000000),
                  name: statement[3].slice(1),
                  concepts: []
                }
                this.graph.sets.push(targetSet)
              }
              else {
                targetSet = targetSet[0]
              }

              let concept1 = this.getNodeByName(statement[1].slice(1,-1))
              if (!concept1) {
                concept2 = {
                  id : Math.floor(Math.random() * 1000000),
                  name:  statement[1].slice(1,-1),
                }
                this.graph.nodes.push(concept1)
              }

              for (let i in targetSet.concepts) {
                let concept2 = targetSet.concepts[i]
                if (statement[2].startsWith('-')&&statement[2].endsWith('-')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    relationTo = {
                      from: concept1.id,
                      to: concept2.id,
                      name: statement[2].slice(1,-1),
                    }
                  }

                  this.graph.edges.push(relationTo)


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (!relationFrom) {
                    relationFrom = {
                      from: concept2.id,
                      to: concept1.id,
                      name: statement[2].slice(1,-1),
                    }
                  }

                  this.graph.edges.push(relationFrom)
                }
                if (statement[2].startsWith('-')&&statement[2].endsWith('->')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    relationTo = {
                      from: concept1.id,
                      to: concept2.id,
                      name: statement[2].slice(1,-2),
                    }
                  }

                  this.graph.edges.push(relationTo)


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (relationFrom) {
                    this.errors.push({
                      type: 'Incongruence Error',
                      at: i
                    })
                  }
                }
                if (statement[2].startsWith('<-')&&statement[2].endsWith('-')) {
                  let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

                  if (!relationTo) {
                    this.errors.push({
                      type: 'Incongruence Error',
                      at: i
                    })
                  }


                  let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

                  if (!relationFrom) {
                    relationFrom = {
                      from: concept2.id,
                      to: concept1.id,
                      name: statement[2].slice(2,-1),
                    }
                  }
                  
                  this.graph.edges.push(relationFrom)
                }
              }
            }
            //#--#
            if (this.isSet(statement[1])&&this.isSet(statement[3])) {
              
            }
          }
        }
        }
      }
    },
    evaluateStatement(sentence) {
      let words = sentence.split(/(\s+)/).filter(word => word.trim()!="").map(word => word.trim()) 
      if (words.length == 2) {
        if (!this.getNodeByName(words[1].slice(1,-1))) {
          this.graph.nodes.push({
            id : Math.floor(Math.random() * 1000000),
            name:  words[1].slice(1,-1),
          })
        }
      }
      else if (words.length == 4 && this.isRelation(words[2])) {
        //[]--[]
        if (this.isConcept(words[1])&&this.isConcept(words[3])) {
          let concept1 = this.getNodeByName(words[1].slice(1,-1))
          let concept2 = this.getNodeByName(words[3].slice(1,-1))

          if (!concept1) {
            concept1 = {
              id : Math.floor(Math.random() * 1000000),
              name:  words[1].slice(1,-1),
            }
            this.graph.nodes.push(concept1)
          }
          if (!concept2) {
            concept2 = {
              id : Math.floor(Math.random() * 1000000),
              name:  words[3].slice(1,-1),
            }
            this.graph.nodes.push(concept2)
          }

          if (words[2].startsWith('-')&&words[2].endsWith('-')) {
            let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

            if (!relationTo) {
              relationTo = {
                from: concept1.id,
                to: concept2.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationTo)


            let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: concept2.id,
                to: concept1.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationFrom)
          }
          if (words[2].startsWith('-')&&words[2].endsWith('->')) {
            let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

            if (!relationTo) {
              relationTo = {
                from: concept1.id,
                to: concept2.id,
                name: words[2].slice(1,-2),
              }
            }

            this.graph.edges.push(relationTo)


            let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

            if (relationFrom) {
              this.errors.push({
                type: 'Incongruence Error',
                at: i
              })
            }
          }
          if (words[2].startsWith('<-')&&words[2].endsWith('-')) {
            let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==concept2.id) || null

            if (!relationTo) {
              this.errors.push({
                type: 'Incongruence Error',
                at: i
              })
            }


            let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==concept1.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: concept2.id,
                to: concept1.id,
                name: words[2].slice(2,-1),
              }
            }
            
            this.graph.edges.push(relationFrom)
          }
        }
        //#--[]
        if (this.isSet(words[1])&&this.isConcept(words[3])) {
          let targetSet = this.graph.sets.filter(set => set.name == words[1].slice(1))
          if (!targetSet) {
            targetSet = {
              id : Math.floor(Math.random() * 1000000),
              name: words[1].slice(1),
              concepts: []
            }
            this.graph.sets.push(targetSet)
          }
          else {
            targetSet = targetSet[0]
          }

          let concept2 = this.getNodeByName(words[3].slice(1,-1))
          if (!concept2) {
            concept2 = {
              id : Math.floor(Math.random() * 1000000),
              name:  words[3].slice(1,-1),
            }
            this.graph.nodes.push(concept2)
          }

          if (words[2].startsWith('-')&&words[2].endsWith('-')) {
            let relationTo = this.graph.edges.find(edge => edge.from==targetSet.id && edge.to==concept2.id) || null

            if (!relationTo) {
              relationTo = {
                from: targetSet.id,
                to: concept2.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationTo)


            let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==targetSet.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: concept2.id,
                to: targetSet.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationFrom)
          }
          if (words[2].startsWith('-')&&words[2].endsWith('->')) {
            let relationTo = this.graph.edges.find(edge => edge.from==targetSet.id && edge.to==concept2.id) || null

            if (!relationTo) {
              relationTo = {
                from: targetSet.id,
                to: concept2.id,
                name: words[2].slice(1,-2),
              }
            }

            this.graph.edges.push(relationTo)
          }
          if (words[2].startsWith('<-')&&words[2].endsWith('-')) {
            let relationFrom = this.graph.edges.find(edge => edge.from==concept2.id && edge.to==targetSet.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: concept2.id,
                to: targetSet.id,
                name: words[2].slice(2,-1),
              }
            }
            
            this.graph.edges.push(relationFrom)
          }
        }
        //[]--#
        if (this.isConcept(words[1])&&this.isSet(words[3])) {
          let targetSet = this.graph.sets.filter(set => set.name == words[3].slice(1))
          if (!targetSet) {
            targetSet = {
              id : Math.floor(Math.random() * 1000000),
              name: words[3].slice(1),
              concepts: []
            }
            this.graph.sets.push(targetSet)
          }
          else {
            targetSet = targetSet[0]
          }

          let concept1 = this.getNodeByName(words[1].slice(1,-1))
          if (!concept1) {
            concept1 = {
              id : Math.floor(Math.random() * 1000000),
              name:  words[1].slice(1,-1),
            }
            this.graph.nodes.push(concept1)
          }

          if (words[2].startsWith('-')&&words[2].endsWith('-')) {
            let relationTo = this.graph.edges.find(edge => edge.from==targetSet.id && edge.to==concept1.id) || null

            if (!relationTo) {
              relationTo = {
                from: targetSet.id,
                to: concept1.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationTo)


            let relationFrom = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==targetSet.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: concept1.id,
                to: targetSet.id,
                name: words[2].slice(1,-1),
              }
            }

            this.graph.edges.push(relationFrom)
          }
          if (words[2].startsWith('-')&&words[2].endsWith('->')) {
            let relationTo = this.graph.edges.find(edge => edge.from==concept1.id && edge.to==targetSet.id) || null

            if (!relationTo) {
              relationTo = {
                from: concept1.id,
                to: targetSet.id,
                name: words[2].slice(1,-2),
              }
            }

            this.graph.edges.push(relationTo)
          }
          if (words[2].startsWith('<-')&&words[2].endsWith('-')) {
            let relationFrom = this.graph.edges.find(edge => edge.from==targetSet.id && edge.to==concept1.id) || null

            if (!relationFrom) {
              relationFrom = {
                from: targetSet.id,
                to: concept1.id,
                name: words[2].slice(2,-1),
              }
            }
            
            this.graph.edges.push(relationFrom)
          }
        }
        //#--#
        if (this.isSet(words[1])&&this.isSet(words[3])) {
          
        }
      }
    },
    evaluateSet(sentence) {
      let words = sentence.split(/(\s+)/).filter(word => word.trim()!="").map(word => word.trim())  
      //Set declaration
      if (words[1].startsWith('#')) {
        let targetSet = this.graph.sets.filter(set => set.name == words[1].slice(1))

        if (targetSet.length == 1) {
          targetSet = targetSet[0]
          targetSet.concepts = []
        }
        else {
          targetSet = {
            id : Math.floor(Math.random() * 1000000),
            name: words[1].slice(1),
            concepts: [],
          }
          this.graph.sets.push(targetSet)
        }
        console.log(this.graph.sets)
        for (let i=2; i<words.length; i++) {
          let concept = this.getNodeByName(words[i])
          if (!concept) {
            concept = {
              id : Math.floor(Math.random() * 1000000),
              name:  words[i],
            }
            this.graph.nodes.push(concept)
          }
          targetSet.concepts.push(concept)
        }
      }
      //Set modification
      else {
        let targetSet = this.graph.sets.filter(set => set.name == words[1])
        if (!targetSet.length) {
          targetSet = {
            id : Math.floor(Math.random() * 1000000),
            name: words[1].slice(1),
            concepts: [],
          }
          this.graph.sets.push(targetSet)
        }
        else {
          targetSet = targetSet[0]
        }
        if (words[2] == '+') {
          for (let i=3; i<words.length; i++) {
            let concept = this.getNodeByName(words[i])
            if (!concept) {
              concept = {
                id : Math.floor(Math.random() * 1000000),
                name:  words[i],
              }
              this.graph.nodes.push(concept)
            }
            targetSet.concepts.push(concept)
          }
        }
        else if (words[2] == '-') {
          targetSet.concepts = targetSet.concepts.filter(concept => !words.slice(3).includes(concept.name))
        }
      }
    },
    evaluateExpression(array) {
      if (array.length === 0) return true;

      let result = array[0];
      for (let i = 1; i < array.length; i += 2) {
          const operator = array[i];
          const operand = array[i + 1];
          
          if (operator === "and") {
              result = result && operand;
          } else if (operator === "or") {
              result = result || operand;
          } else if (operator === "not") {
              result = !operand;
          } else {
              throw new Error("Invalid operator");
          }
      }

      return result;
    },
    compile() {
      let sentences = this.code.split('\n')
      let error = ""
      let funcBuffer = {
        name: null,
        code: [],
        args: [],
      }

      for (let i in sentences) {
        let sentence = sentences[i]

        let words = sentence.split(/(\s+)/).filter(word => word.trim()!="").map(word => word.trim())

        if (!sentence.startsWith('//')) {
          //Buffer function
          if (sentence.trim()=='') {
            this.functions.push(funcBuffer)
            funcBuffer = {
              name: null,
              code: [],
              args: [],
            }
          }
          //Statement
          if (words[0] == 'let') {
            if (!funcBuffer.name) {
              this.evaluateStatement(sentence)
            }
            else {
              funcBuffer.code.push(sentence)
            }
          }
          //Set
          else if (words[0] == 'set') {
            if (!funcBuffer.name) {
              this.evaluateSet(sentence)
            }
            else {
              funcBuffer.code.push(sentence)
            }
          }
          //Implication
          else if (words[0] == 'if') {
            if (!funcBuffer.name) {
              this.evaluateImplication(sentence)
            }
            else {
              funcBuffer.code.push(sentence)
            }
          }
          //Functions
          else if (words[0] == 'func') {
            if (sentence.slice(-1)==':') {
              let funcName = words.slice(1).join('').slice(0,-2).split('(')[0]
              let args = words.slice(1).join('').slice(0,-2).split('(')[1].split(',').map(arg => arg.trim())
              funcBuffer.name = funcName
              funcBuffer.args = args
            }
            else {
              let funcName = words.slice(1).join('').slice(0,-2).split('(')[0]
              let args = words.slice(1).join('').slice(0,-1).split('(')[1].split(',').map(arg => arg.trim())
              let targetFunc = this.functions.filter(func => func.name==funcName)
              if (targetFunc.length) {
                targetFunc = targetFunc[0]
                for (let i in targetFunc.code) {
                  let codeSentence = targetFunc.code[i]
                  for (let j in targetFunc.args) {
                    codeSentence = codeSentence.replace(targetFunc.args[j], args[j])
                  }
                  if (codeSentence.startsWith('if')) {
                    this.evaluateImplication(codeSentence)
                  }
                  else if (codeSentence.startsWith('set')) {
                    this.evaluateSet(codeSentence)
                  }
                  else if (codeSentence.startsWith('let')) {
                    this.evaluateStatement(codeSentence)
                  }
                }
              }
            }
          }
        }
        this.updateGraph()
      }
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
  opacity: 0;
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
