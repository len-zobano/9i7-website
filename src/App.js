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
        <div class="app">
          <NavigationCard imageSource="particle-screenshot.png" to="/particle" title="Particle Simulator">

          </NavigationCard>
          <NavigationCard imageSource="note-icon.png" to="/notes/0" title="Notes">

          </NavigationCard>
        </div>
       </Router>
   );
  }
}

export default App;
