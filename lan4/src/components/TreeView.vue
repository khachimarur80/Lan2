<template>
    <div class="treeview-container">
        <div class="tree-node main-node" v-if="vault.length>0">
            <div class="node-content">
                <div class="node-content-text active-node">
                    <div style="height: 5px; width: 20px;"></div>
                    <div class="node-file-name" :id="vault" @dragover="dragOverNode" @dragleave="dragLeaveNode" @drop="dragDropNode" @click="openFile()"
                    >{{ vault.split('/').slice(-1)[0] }}</div>
                </div>
            </div>
        </div>
        <div class="tree-node" v-for="node in items" :key="node.id">
            <div class="node-content">
                <div class="node-indent" v-for="i in node.ancestors" :key="i"></div>
                <div class="node-content-text">
                    <v-btn class="node-content-collapse" v-if="node.children.length" :style="{'transform': node.open ? 'rotate(90deg)' : 'none' }" @click="openNode(node)" dense icon x-small>
                        <v-icon color="#4f4f4f" size="20">
                            mdi-chevron-right
                        </v-icon>
                    </v-btn>
                    <div style="height: 5px; width: 20px;" v-else></div>
                    <div @dblclick="editFile" @blur="saveFile" @click="openFile(node)" @contextmenu.prevent="nodeMouseDown"
                        @dragover="dragOverNode" @dragleave="dragLeaveNode" @dragstart="dragStartNode" @drop="dragDropNode"
                        @dragend="dragEndNode" draggable=true class="node-file-name" :id="node.id">{{ node.name }}</div>
                </div>
            </div>
            <TreeView :items="node.children" :vault="''" v-if="node.open" class="node"></TreeView>
        </div>
    </div>
</template>

<script>
    import EventBus from '../event-bus.js';

    export default {
        name: 'TreeView',
    
        data: () => ({
        }),

        props: {
            items: {
                type: Array,
                required: true,
            },
            vault: {
                type: String,
                required: true,
            },
        },

        methods: {
            openNode(node) {
                EventBus.$emit('openNode', node)
            },
            findNodeById(nodes, targetId) {
                for (const node of nodes) {
                    if (node.id === targetId) {
                        return node;
                    }
                    else if (node.children && node.children.length) {
                        const foundNode = this.findNodeById(node.children, targetId);
                        if (foundNode) {
                            return foundNode;
                        }
                    }
                }
                return null;
            },
            //Make node contenteditable
            editFile(event) {
                event.target.setAttribute('contenteditable', 'true')
                const range = document.createRange();
                range.selectNodeContents(event.target);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            },
            //Update file or directory name
            async saveFile(event) {
                event.target.setAttribute('contenteditable', 'false')

                const message = await new Promise(resolve => {
                    window.electronAPI.requestChangeFileName(event.target.id, event.target.innerText)
                    window.electronAPI.response('change-filename-response', resolve)
                })

                if (message) {
                    var targetNode = this.findNodeById(this.items, event.target.id)
                    //Change file prop in Main.vue
                    EventBus.$emit('saveFileNode', targetNode, message)
                
                    targetNode.name = message.split('/').splice(-1)[0].split('.').slice(0,-1).join(".")
                    targetNode.id = message
                }
                else {
                    event.target.innerText = this.findNodeById(this.items, event.target.id).name
                }
            },
            openFile(node) {
                document.querySelectorAll('.active-node').forEach(obj => obj.classList.remove('active-node'))
                if (node) {
                    EventBus.$emit('fileopened', node.id);
                }
                else {
                    EventBus.$emit('fileopened', this.vault);
                }
                event.target.parentElement.parentElement.classList.add('active-node')
            },
            dragStartNode(event) {
                event.target.setAttribute('data-dragging', true)
            },
            dragOverNode(event) {
                event.preventDefault();
                if (event.target.classList.contains('node-file-name') 
                    && !event.target.classList.contains('drag-over-node')
                    && !event.target.getAttribute('data-dragging')
                    ) {
                    event.target.classList.add('drag-over-node')
                    this.nodeOrigin = this.findNodeById(this.items, document.querySelector("[data-dragging='true']").id)
                }
            },

            //Events for node movement
            dragEndNode(event) {
                event.target.removeAttribute('data-dragging')
            },
            dragLeaveNode(event) {
                event.target.classList.remove('drag-over-node')
            },
            //Move node to target drop
            dragDropNode(event) {
                var nodeDestiny = this.findNodeById(this.items, event.target.id)
                if (nodeDestiny) {
                    if (nodeDestiny.isDirectory && nodeDestiny!=this.nodeOrigin) {
                        EventBus.$emit('filemove', this.nodeOrigin.id, nodeDestiny.id);
                    }
                }
                else {
                    EventBus.$emit('filemove', this.nodeOrigin.id, event.target.id);
                }
                event.target.classList.remove('drag-over-node')
                this.nodeOrigin = null
            },
            nodeMouseDown(event) {
                EventBus.$emit('nodeMouseDown', event)
            },
        },

        created() {

        }
    };
</script>
<style scoped>
.tree-node {
    position: relative;
    z-index: 1;
}

.line-indent {
    width: 15px;
    height: 24px;
    background: red;
    border-left: 1px solid #363636;
}

.tree-node {
    position: relative;
    z-index: 1;
}

.node-indent {
    width: 15px;
    height: 28px ;
    transform: translateX(13px);
    border-left: 1px solid #4E4E4E;
}

.node-content {
    font-size: 14px;
    color: #B9B9B9;
    display: flex;
    padding-right: 10px;
    align-items: center;
}
.node-content-collapse {
    transition: transform ease-in-out .2s;
    position: relative;
}
.node-content::after {
    content: '';
    width: 1px;
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 8px;
    background: #4F4F4F;
    display: none;
}
.node-content-collapse:hover * {
    color: var(--v-error-base) !important;
}
.node-content-opened {
    transform: rotate(90deg);
}
.node-content::before {
    content: '';
    position: absolute;
    top: -1px;
    right: 0px;
    height: 28px;
    left: 0px;
    /*border-radius: 3px;*/
    z-index: -1;
    transition: background ease-in-out 0.1s;
}
.node-content::before:last-child {
    background: #363636;
}
.node-content:hover::before {
    background: #222;
}
.node-content-text {
    padding: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    width: 100%;
}

.treeview-container {
    height: 100%;
    overflow: scroll;
}
.node-file-name {
    padding: 1px;
    padding-left: 5px;
    padding-right: 5px;
    /*border-radius: 3px;*/
    flex: 1;
    height: 24px;
}
.node-file-name:focus-within {
    outline: none;
}
.node-file-name:focus-within::before {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    height: 26px;
    left: 0px;
    /*border-radius: 3px;*/
    z-index: -1;
    border: 1px solid var(--v-error-base);
}
.active-node::before {
    content: '';
    position: absolute;
    top: -1px;
    right: 0px;
    height: 28px;
    left: 0px;
    /*border-radius: 3px;*/
    z-index: -1;
    background: #363636 !important;
}
.drag-over-node::before {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    height: 26px;
    left: 0px;
    /*border-radius: 3px;*/
    z-index: -1;
    border: 1px solid var(--v-error-base);
}
</style>