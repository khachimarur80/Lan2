<template>
  <div id="dictionary">
    <div class="details" v-if="currentConcept">
      <button class="close" @click="hideItem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="#fff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </button><br>
      {{ currentConcept }}
    </div>
    <div class="details" v-if="currentRelation">
      <button class="close" @click="hideItem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="#fff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </button><br>
      {{ currentRelation }}
    </div>
    <div class="details" v-if="currentSet">
      <button class="close" @click="hideItem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="#fff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
      </button><br>
      {{ currentSet }}
    </div>
    <div class="toolbar">
      <input placeholder="search" v-model="filter"/>
    </div>
    <div class="contents">
      <div class="concepts">
        <p>Concepts</p>
        <div class="concept" v-for="(concept, i) in filteredConcepts" :key="i" @click="showConcept(concept)">
          {{ concept }}
        </div>
      </div>
      <div class="relations">
        <p>Relations</p>
        <div class="relation" v-for="(relation, i) in filteredRelations" :key="i" @click="showRelation(relation)">
          {{ relation }}
        </div>
      </div>
      <div class="sets">
        <p>Sets</p>
        <div class="set1" v-for="(set, i) in filteredSets" :key="i" @click="showSet(set)">
          {{ set }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
//import EventBus from '@/event-bus.js';

export default {
  name: 'vDictonary',

  data: () => ({
    filter: '',
    currentConcept: null,
    currentRelation: null,
    currentSet: null,
  }),

  props: {
    dictionary: {
      required: true,
    },
    graph: {
      required: true,
    }
  },

  methods: {
    showConcept(concept) {
      this.currentConcept = this.graph.nodes.filter(node => node.name == concept)
    },
    showRelation(relation) {
      this.currentRelation = this.graph.edges.filter(edge => edge.name == relation)
    },
    showSet(set) {
      this.currentSet = this.graph.sets.filter(a => a.name == set)
    },
    hideItem() {
      this.currentConcept = null
      this.currentRelation = null
      this.currentSet = null
    }
  },

  computed: {
    filteredRelations() {
      return this.dictionary.relations.filter(relation => relation.startsWith(this.filter))
    },
    filteredConcepts() {
      return this.dictionary.concepts.filter(concept => concept.startsWith(this.filter))
    },
    filteredSets() {
      return this.dictionary.sets.filter(set => set.startsWith(this.filter))
    },
  },

  async created() {
  },
}
</script>

<style scoped>
  
#dictionary {
  height: 100%;
  width: 100%;
  position: relative;
  border-right: 1px solid var(--v-secondary-base);
  border-top: 1px solid var(--v-secondary-base);
  display: flex;
  flex-direction: column;
}
.toolbar {
  width: 100%;
  display: flex;
  padding: 10px;
  height: 60px;

}
input {
  border: 1px solid #333;
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
  outline: none;
  color: white;
}
.contents {
  height: calc(100% - 60px);
  width: 100%;
}
.concepts, .relations, .sets {
  width: 33%;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 20px;
}
.contents p {
  font-weight: bold;
}
.concepts p {
  color: var(--v-success-base);
}
.relations p {
  color: var(--v-primary-base);
}
.sets p {
  color: var(--v-error-base);
}

.details {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 90%;
  width: 90%;
  background: #121212;
  border: 1px solid #333;
}
.close {
  height: 30px;
  width: 30px;
  background: #161616;
  border: none;
  border-radius: 50%;
  margin-top: 10px;
  margin-left: calc(100% - 40px);
  border: 1px solid #121212;
  transition: borderColor .2s ease-out, background .2s ease-out;
  display: flex;
  justify-content: center;
  align-items: center;
}
.close:hover {
  border-color: #222;
  background: #222;
}
</style>
