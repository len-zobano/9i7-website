import React from "react";

let nodeID = 1;

class NoteNode {
    #iteration = 0; //changes when children are updated
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
        ++this.#iteration;
    }

    shiftChild(child) {
        let indexToAdd = 0;
        //non-mutating splice
        let newChildren = this.#children.slice(0);
        newChildren.splice(indexToAdd, 0, child);
        this.#children = newChildren;
        child.#parent = this;
        ++this.#iteration;
    }

    removeChild(child) {
        let indexOfChild = this.#children.indexOf(child);
        if (indexOfChild > -1) {
            this.#children.splice(indexOfChild,1);
            ++this.#iteration;
            return true;
        }
        else {
            return false;
        }
    }

    getChildren () {
        return this.#children.slice(0);
    }

    getID () {
        return this.#ID;
    }
    
    getKey () {
        return `${this.#ID}-${this.#iteration}`;
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
        let newText = event.target.value;
        //if the line begins with three spaces, it's a tab
        //put it under its previous sibling node and delete the spaces
        //if this fails, it's just three spaces
        if (newText.match(/^   /)) {
            if (this.#parentComponent.indentNode(this.#node)) {
                //remove 3 leading whitespace
                newText = newText.replace(/^   /,''); 
            }
        }
        else if (newText.match(/   $/)) {
            if (this.createAndFocusChildNode()) {
                //remove 3 trailing whitespace
                newText = newText.replace(/   $/,'');
            }
        }
        //set text in state
        this.setState({ text: newText });
        //set text in node
        this.#node.text = newText;
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
        let nextSibling = new NoteNode('');
        this.#node.addChild(nextSibling, after);
        //add to state, new array
        this.setState({ children: this.#node.getChildren() });
    }

    createAndFocusChildNode() {
        let child = new NoteNode('');
        this.#node.shiftChild(child);
        this.setState({ children: this.#node.getChildren() });
        return true;
    }

    indentNode(node) {
        //find node in children
        let nodeChildren = this.#node.getChildren();
        let indexOfNodeToIndent = nodeChildren.indexOf(node);
        //if index > 0, remove the child and add it as a child of index-1 child and return true
        if (indexOfNodeToIndent > 0 && this.#node.removeChild(node)) {
            nodeChildren[indexOfNodeToIndent-1].addChild(node);
            this.setState({ children: this.#node.getChildren() });
            return true;
        }
        //else return false
        else {
            return false;
        }
    }

    render () {
        console.log('rendering node',this.#node.getID());
        return (
            <div class="note-node"> 
                {/* <div>
                    {this.state.text} ({this.state.ID})
                </div>
                <div onClick={this.debug} style={{width: '1em', height: '1em', backgroundColor: 'red'}}>

                </div> */}
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
                        return <Note key={child.getKey()} node={child} parentComponent={this}></Note>
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
