import React from "react";

let nodeID = 1;

class NoteNode {
    #ID = ''; //unique id string
    #children = []; //must maintain parity in parent / children relationship
    #parent = null;
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    addChild (child, after) {
        let indexToAdd = this.#children.indexOf(after) + 1;
        console.log('index:',indexToAdd);
        if (indexToAdd < 1) {
            indexToAdd = this.#children.length;
        }
        console.log('index 2:',indexToAdd);
        //non-mutating splice
        let newChildren = this.#children.slice(0);
        newChildren.splice(indexToAdd, 0, child);
        this.#children = newChildren;
        console.log('children array:',this.#children);

        child.#parent = this;
    }

    getChildren () {
        return this.#children.slice(0);
    }

    getID () {
        return this.#ID;
    }

    constructor (text) {
        this.text = text;
        this.#ID = `note-node-${nodeID++}`;
    }
}

class Note extends React.Component {

    #node = null;
    #parentComponent;

    state = {
        text: '',
        children: []
    };

    inputChanged (event) {
        //set text in state
        this.setState({ text: event.target.value });
        //set text in node
        this.#node.text = event.target.value;
    }

    keyPressed (event) {
        console.log('key pressed:',event,'at node',this.#node);
        if (event.charCode === 13 && this.#parentComponent) {
            this.#parentComponent.createAndFocusNextSiblingNode(this.#node);
        }
    }

    debug () {
        console.log('in debug handler');
        if (this.state.children.length > 0) {
            this.setState({ children: [] });
        }
        else {
            this.setState({ children: this.#node.getChildren() });
        }
    }

    createAndFocusNextSiblingNode(after) {
        //create and add to node
        let nextSibling = new NoteNode('New Sibling');
        this.#node.addChild(nextSibling, after);
        //add to state, new array
        this.setState({ children: this.#node.getChildren() });
    }

    render () {
        console.log('rendering node',this.#node.getID());
        return (
            <div class="note-node"> 
                <div>
                    {this.state.text} ({this.state.ID})
                </div>
                <div onClick={this.debug} style={{width: '1em', height: '1em', backgroundColor: 'red'}}>

                </div>
                <input 
                    autoFocus
                    type="text" 
                    value={this.state.text}
                    onChange={this.inputChanged}
                    onKeyPress={this.keyPressed}
                >
                </input>
                {
                    this.state.children.map((child) => {
                        return <Note key={child.getID()} node={child} parentComponent={this}></Note>
                    })
                }
            </div>
        )
    }
    
    componentDidMount() {
        this.setState({ 
            text: this.#node.text,
            ID: this.#node.getID(),
            children: this.#node.getChildren() 
        });
    }

    constructor (props) {
        super(props);
        this.#node = props.node;
        this.#parentComponent = props.parentComponent;
        this.inputChanged = this.inputChanged.bind(this);
        this.keyPressed = this.keyPressed.bind(this);
        this.debug = this.debug.bind(this);
    }
}

function Notes() {
    let 
        rootNode = new NoteNode ('Title'),
        childA = new NoteNode ('Line 1'),
        childB = new NoteNode ('Line 2');

    rootNode.addChild(childA);
    rootNode.addChild(childB);

  return (
    <Note node={rootNode}></Note>
  );
}

export default Notes;
