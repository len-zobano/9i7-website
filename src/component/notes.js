import React from "react";

let nodeID = 1;

class NoteNode {
    #iteration = 0; //changes when children are updated
    #ID = ''; //unique id string
    #children = []; //must maintain parity in parent / children relationship
    #parent = null;
    text = '';
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

    getPreviousChild(node) {
        let indexOfNode = this.#children.indexOf(node);
        if (indexOfNode > 0) {
            return this.#children[indexOfNode-1];
        }
    }

    getNextChild(node) {
        let indexOfNode = this.#children.indexOf(node);
        if (indexOfNode > -1) {
            return this.#children[indexOfNode+1];
        }
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

    static nodeToFocusNext = false;

    #node = null;
    #parentComponent;
    #input = null;

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
        // console.log('key pressed:',event,'at node',this.#node);
        if (event.charCode === 13) {
            if (this.#parentComponent) {
                this.#parentComponent.createAndFocusNextSiblingNode(this.#node) 
            }
            else {
                this.createAndFocusChildNode();
            }
        }
    }

    keyDown (event) {
        console.log('key down:',event,'at node',this.#node);
        let keyPosition = event.target.selectionStart;
        let prevent = false;
        if (event.code === "ArrowUp" && this.#parentComponent) {
            this.#parentComponent.focusOnPreviousChild(this.#node, 0);
            prevent = true;
        }
        else if (event.code === "ArrowDown") {
            this.focusOnNext(0);
            prevent = true;
        }
        else if (event.code === "Tab") {
            if (!event.shiftKey) {
                //if tabbing at index 0, indent node
                if (keyPosition === 0) {
                    this.#parentComponent.indentNode(this.#node);
                }
                //if tabbing at last index, create new indented node
                else if (keyPosition === this.#node.text.length) {
                    this.createAndFocusChildNode();
                }
            }
            else if (
                this.#parentComponent &&
                this.#parentComponent.#parentComponent
            ) {
                this.#parentComponent.#parentComponent.unIndentGrandchildNode(
                    this.#node, 
                    this.#parentComponent.#node
                ); 
            }
            prevent = true;   
        }
        else if (event.code === "Backspace") {
            console.log('backspace at cursor',keyPosition);
            if (keyPosition === 0 && event.target.selectionEnd === 0) {
                //if this component has a grandparent component, it can be unindented
                if (
                    this.#parentComponent &&
                    this.#parentComponent.#parentComponent
                ) {
                    console.log('delete 0 un-indent child');
                    this.#parentComponent.#parentComponent.unIndentGrandchildNode(
                        this.#node, 
                        this.#parentComponent.#node
                    );
                }
                //if it has a parent, but no grandparent, and is empty, it can be deleted
                else if (
                    this.#parentComponent &&
                    this.#node.text == ''
                ) {
                    console.log('delete 0 delete child');
                    this.#parentComponent.deleteChildNodeAndFocusPrevious(this.#node);
                }
                //otherwise, do nothing
                else {
                    console.log('delete 0 noop')
                }
                prevent = true;
            }
        }

        if (prevent) {
            event.preventDefault();
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

    deleteChildNodeAndFocusPrevious(child) {
        let previous = this.#node.getPreviousChild(child) || this.#node;
        this.#node.removeChild(child);
        let IDOfPreviousNode = previous.getID();
        document.getElementById(IDOfPreviousNode).focus();

        this.setState({ children: this.#node.getChildren() });
    }

    unIndentGrandchildNode(node, parent) {
        //remove grandchild node from its parent
        console.log('removing at uigc');
        parent.removeChild(node);
        //add grandchild node to this node after parent
        console.log('adding at uigc');
        this.#node.addChild(node, parent);
        Note.nodeToFocusNext = node;
        console.log('setting state at uigc');
        this.setState({ children: this.#node.getChildren() });
        return true;
    }

    createAndFocusNextSiblingNode(after) {
        //create and add to node
        let nextSibling = new NoteNode('');
        Note.nodeToFocusNext = nextSibling;
        this.#node.addChild(nextSibling, after);
        //add to state, new array
        this.setState({ children: this.#node.getChildren() });
        return true;
    }

    createAndFocusChildNode() {
        let child = new NoteNode('');
        Note.nodeToFocusNext = child;
        this.#node.shiftChild(child);
        this.setState({ children: this.#node.getChildren() });
        return true;
    }

    focusOnLastChild(node) {
        console.log('focusing on last child of node',node);
        let childrenLength = 0;
        if (childrenLength = node.getChildren().length) {
            this.focusOnLastChild(node.getChildren()[childrenLength-1]);
        }
        else {
            let element = document.getElementById(node.getID());
            element.focus(); 
        }
    }

    focusOnPreviousChild(node, index) {
        let previous = this.#node.getPreviousChild(node);
        if (!previous) {
            previous = this.#node;
            let element = document.getElementById(previous.getID());
            element.focus();
        }
        else {
            this.focusOnLastChild(previous);
        }
    }

    focusOnNext(index, countChildren = true) {
        let node = this.#node;
        let next = null;
        //if the node has children, focus on its next child
        if (countChildren && node.getChildren().length > 0) {
            next = node.getChildren()[0];
        }
        else if (this.#parentComponent) {
            next = this.#parentComponent.#node.getNextChild(node);
            if (!next) {
                this.#parentComponent.focusOnNext(this.#node, index, false);
            }
        }

        if (next) {
            let element = document.getElementById(next.getID());
            element.focus();
        }
    }

    indentNode(node) {
        //find node in children
        let nodeChildren = this.#node.getChildren();
        let indexOfNodeToIndent = nodeChildren.indexOf(node);
        //if index > 0, remove the child and add it as a child of index-1 child and return true
        if (indexOfNodeToIndent > 0 && this.#node.removeChild(node)) {
            nodeChildren[indexOfNodeToIndent-1].addChild(node);
            Note.nodeToFocusNext = node;
            this.setState({ children: this.#node.getChildren() });
            return true;
        }
        //else return false
        else {
            return false;
        }
    }

    render () {
        return (
            
            <div class={`note-node ${ !this.#parentComponent ? 'root-node' : '' }`}> 
                {/* <div>
                    {this.state.text} ({this.state.ID})
                </div>
                <div onClick={this.debug} style={{width: '1em', height: '1em', backgroundColor: 'red'}}>

                </div> */}
                <input 
                    type="text" 
                    id={this.#node.getID()}
                    ref={(input) => { this.#input = input; }} 
                    value={this.state.text}
                    onChange={this.inputChanged}
                    onKeyPress={this.keyPressed}
                    onKeyDown={this.keyDown}
                >
                </input>
                {
                    this.state.children.map((child) => {
                        return <Note 
                            key={child.getKey()} 
                            node={child} 
                            parentComponent={this}
                        ></Note>
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

        if (Note.nodeToFocusNext === this.#node) {
            this.#input.focus();
            Note.nodeToFocusNext = null;
        }
    }

    constructor (props) {
        super(props);
        this.#node = props.node;
        this.#parentComponent = props.parentComponent;
        this.inputChanged = this.inputChanged.bind(this);
        this.keyPressed = this.keyPressed.bind(this);
        this.keyDown = this.keyDown.bind(this);
        this.debug = this.debug.bind(this);
    }
}

function Notes() {
    let 
        rootNode = new NoteNode ('');

  return (
    <Note node={rootNode}></Note>
  );
}

export default Notes;
