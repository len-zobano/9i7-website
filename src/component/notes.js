import React from "react";

class NoteNode {
    #id = ''; //unique id string
    #children = [];
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    addChild (child) {
        this.#children.push(child);
    }

    getChildren () {
        return this.#children.slice(0);
    }

    constructor (text) {
        this.text = text;
    }
}

class Note extends React.Component {

    #node = new NoteNode ();

    state = {
        text: ''
    };

    inputChanged (event) {
        console.log('input changed. this:', this);
        this.setState({ text: event.target.value });
    }

    render () {
        
        console.log('children:',this.#node.getChildren());

        return (
            <div class="note-node"> 
                <div>
                    {this.state.text}
                </div>
                <input 
                    type="text" 
                    onChange={this.inputChanged}
                >
                </input>
                {
                    this.#node.getChildren().map((child) => {
                        return <Note node={child}></Note>
                    })
                }
            </div>
        )
    }
    
    componentDidMount() {
        console.log('will mount. this:',this);
        console.log('after bind');
    }

    constructor (props) {
        console.log('props:',props);
        super(props);
        this.#node = props.node;
        this.inputChanged = this.inputChanged.bind(this);
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
