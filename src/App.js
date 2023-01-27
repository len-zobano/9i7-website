import logo from './logo.svg';
import './App.css';
import React, {Component} from "react";
import Particle from './component/particle';
import Notes from './component/notes';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';

class App extends Component {
  render() {
    return (
       <Router>
        <Routes>
          <Route exact path='/particle' element={< Particle />}></Route>
          <Route 
            path='/notes/:ID' 
            element={< Notes />}
          >  
          </Route>
        </Routes>
        <ul>
          <li>
            <Link to="/particle">Particle</Link>
          </li>
          <li>
            <Link to="/notes/0">Note 0</Link>
          </li>
        </ul>
       </Router>
   );
  }
}

export default App;
