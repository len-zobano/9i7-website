import logo from './logo.svg';
import './App.scss';
import React, {Component} from "react";
import Particle from './component/particle';
import NoteEditor from './component/note-editor';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import NavigationCard from './component/navigation-card';

class App extends Component {
  render() {
    return (
       <Router>
        <Routes>
          <Route exact path='/particle' element={< Particle />}></Route>
          <Route 
            path='/notes/:ID' 
            element={< NoteEditor />}
          >  
          </Route>
        </Routes>
        <div class="App">
          <NavigationCard imageSource="test.jpg">

          </NavigationCard>
          <li>
            <Link to="/particle">Particle</Link>
          </li>
          <li>
            <Link to="/notes/0">Note 0</Link>
          </li>
        </div>
       </Router>
   );
  }
}

export default App;
