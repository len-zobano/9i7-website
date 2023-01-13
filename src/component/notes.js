
class NoteNode {
    #id = ''; //unique id string
    #children = [];
    #text = '';
    #encryption = ''; //if not a blank string, is an encryption key ID
    #metadata = {}; //a JSON object with implementation-specific contents
    #complete = -1; //a negative value means it isn
    #dueDate = null;

    #categories = []; //must maintain parity with category -> node relationship

    render () {
        return <div class="noteNode"> {this.#text} </div>
    }

    constructor (text) {
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
