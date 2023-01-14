import React from "react";

let nodeID = 1;

class NoteNode {
    #id = ''; //unique id string
    #children = [];
    #parent = null;
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    addChild (child) {
        this.#children.push(child);
        child.#parent = this;
    }

    getChildren () {
        return this.#children.slice(0);
    }

    constructor (text) {
        this.text = text;
        this.#id = `note-node-${nodeID++}`;
    }
}

class Note extends React.Component {

    #node = new NoteNode ();
    #parentComponent;

    state = {
        text: '',
        children: []
    };

    inputChanged (event) {
        console.log('input changed. this:', this);
        //set text in state
        this.setState({ text: event.target.value });
        //set text in node
        this.#node.text = event.target.value;
    }

    keyPressed (event) {
        console.log('key pressed:',event);
        if (event.charCode === 13 && this.#parentComponent) {
            this.#parentComponent.createAndFocusNextSiblingNode();
        }
    }

    createAndFocusNextSiblingNode() {
        //create and add to node
        let nextSibling = new NoteNode('');
        this.#node.addChild(nextSibling);
        //add to state, new array
        this.setState({ children: this.#node.getChildren() });
        //focus on new node

    }

    render () {
        
        console.log('children:',this.#node.getChildren());

        return (
            <div class="note-node"> 
                <div>
                    {this.state.text}
                </div>
                <input 
                    autoFocus
                    type="text" 
                    onChange={this.inputChanged}
                    onKeyPress={this.keyPressed}
                >
                </input>
                {
                    this.state.children.map((child) => {
                        return <Note node={child} parentComponent={this}></Note>
                    })
                }
            </div>
        )
    }
    
    componentDidMount() {
        console.log('will mount. this:',this);
        console.log('after bind');
        this.setState({ children: this.#node.getChildren() });
    }

    constructor (props) {
        console.log('props:',props);
        super(props);
        this.#node = props.node;
        this.#parentComponent = props.parentComponent;
        this.inputChanged = this.inputChanged.bind(this);
        this.keyPressed = this.keyPressed.bind(this);
    }
}

function Notes() {
    let 
        rootNode = new NoteNode (''),
        childA = new NoteNode (''),
        childB = new NoteNode ('');

    rootNode.addChild(childA);
    rootNode.addChild(childB);

  return (
    <Note node={rootNode}></Note>
  );
}

export default Notes;
