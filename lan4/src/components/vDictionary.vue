<template>
  <div id="dictionary">
    <div class="toolbar">
      <input placeholder="search" v-model="filter"/>
    </div>
    <div class="contents">
      <div class="concepts">
        <p>Concepts</p>
        <div class="concept" v-for="(concept, i) in filteredConcepts" :key="i">
          {{ concept }}
        </div>
      </div>
      <div class="relations">
        <p>Relations</p>
        <div class="relation" v-for="(relation, i) in filteredRelations" :key="i">
          {{ relation }}
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
  }),

  props: {
    dictionary: {
      required: true,
    }
  },

  methods: {
  },

  computed: {
    filteredRelations() {
      return this.dictionary.relations.filter(relation => relation.startsWith(this.filter))
    },
    filteredConcepts() {
      return this.dictionary.concepts.filter(concept => concept.startsWith(this.filter))
    }
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
.concepts, .relations {
  width: 50%;
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
</style>
