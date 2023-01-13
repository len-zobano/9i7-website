import React from "react";

class NoteNode extends React.Component {
    #id = ''; //unique id string
    #children = [];
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    inputChanged (event) {
        this.setState({ text: event.target.value });
    }

    render () {
        return (
            // <div/>
            <div> 
                <div>
                    {this.state.text} 
                </div>
                <input type="text" onChange={this.inputChanged}>

                </input>
            </div>
        )
    }
    
    componentDidMount() {
        console.log('will mount');
        this.inputChanged = this.inputChanged.bind(this);
    }

    constructor (text) {
        super(text);
        this.state = { text };
        this.#text = text;
    }
}

function Notes() {

    let rootNode = new NoteNode('Hello world note');

  return (
    rootNode.render()
  );
}

export default Notes;
