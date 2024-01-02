
class Lan {
  constructor(name, location) {
    this.name = name
    this.location = location


    this.concepts =  []
    this.relations =  []
    this.categories =  []
    this.statements = []
    this.conditions =  []
    this.actions =  []
    this.tables = []
    this.sentences = []


    this.selectingArea =  false
    this.drawer =  false
    this.loaded =  false
    this.showing =  'board'
    this.zoomVal =  1
    this.objectType =  null
    this.contentType =  null
  }
}

class Category {
  constructor(name) {
    this.objectType = 'category'
    this.name = name
    this.id = Math.floor(Math.random()*100000)
    this.objects = []
  }
}

class Concept {
  constructor() {
    this.objectType = 'concept'
    this.name = ''
    this.id = Math.floor(Math.random()*100000)
    this.data = 'file'
    this.contents = null

    //Board values
    this.x = 0
    this.y = 0

    //Attributes for easier parsing
    this.relations = []
    this.categories = []

    
  }
}

class Relation {
  constructor() {
    this.objectType = 'relation'
    this.name = ''
    this.id = Math.floor(Math.random()*100000)
    this.subject = null //Destiny
    this.object = null //Origin
    this.offsetX1 = 0
    this.offsetX2 = 0
    this.offsetY1 = 0
    this.offsetY2 = 0
    this.sentences = []
    
    //Attributes for easier parsing
    this.categories = []
  }
}

class Action {
  constructor() {
    this.objectType = 'action'
    this.id = Math.floor(Math.random()*100000)
    this.name = '#'+this.id.toString()
    this.condition = null

    //Board values
    this.x = 100
    this.y = 100

    this.offsetX = 0
    this.offsetY = 0
  }
}

class Condition {
  constructor() {
    this.objectType = 'condition'
    this.id = Math.floor(Math.random()*100000)
    this.name = '#'+this.id.toString()
    this.items = []

    //Board values
    this.x = 100
    this.y = 100

    this.statementOffsetX = 0
    this.statementOffsetY = 0

    this.actionOffsetX = 0
    this.actionOffsetY = 0
  }
}

class Statement {
  constructor(type) {
    this.objectType = 'statement'
    this.id = Math.floor(Math.random()*100000)
    this.name = '#'+this.id.toString()
    this.type = type
    this.items = []

    //Board values
    this.x = 100
    this.y = 100

    this.offsetX = 0
    this.offsetY = 0
  }
}

class Line {
  constructor() {
    this.contents = ''
    this.type = 'body'
    this.divisions = []
  }
}

class Tab {
  constructor() {
    this.name = ''
    this.path = ''
    this.contents = []
    this.active = false
  }
}

class Table {
  constructor() {
    this.id = Math.floor(Math.random()*100000)
    this.path = ''
    this.contents = null
    this.matrix = []
  }
}

class User {
  constructor() {
    this.username = null
    this.github = null
    this.lans = []
    this.settings = null
  }
}

class Cell {
  constructor() {
    this.data = null
    this.type = null
  }
}

export { Cell, User, Lan, Category, Concept, Relation, Action, Condition, Statement, Line, Tab, Table };