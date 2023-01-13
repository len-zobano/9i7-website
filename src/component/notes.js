
class NoteNode {
    #id = ''; //unique id string
    #children = [];
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    inputChanged (event) {
        console.log('this:',this);
        console.log(event.target.value,this.#text);
        this.#text = event.target.value;
    }

    render () {
        return (
            <div class="noteNode"> 
                <div class="nodeText">
                    {this.#text} 
                </div>
                <input type="text" onChange={this.inputChanged}>

                </input>
            </div>
            
        )
    }

    constructor (text) {
        this.#text = text;
        this.inputChanged = this.inputChanged.bind(this);
    }
}

function Notes() {

    let rootNode = new NoteNode('Hello world note');

  return (
    rootNode.render()
  );
}

export default Notes;
