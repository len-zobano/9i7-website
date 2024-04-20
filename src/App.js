import logo from './logo.svg';
import './App.scss';
import React, {Component} from "react";
import Particle from './component/particle';
import NoteEditor from './component/note-editor';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import NavigationCard from './component/navigation-card';

const App = ({}) => {

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
          <div class="header-bar">
            {/* Test: {useLocation()} */}
          </div>
          <div class="app-body">
            <NavigationCard imageSource="particle-screenshot.png" to="/particle" title="Particle Simulator" caption="A simple environment simulating particle physics inefficiently because it looks cool">

            </NavigationCard>
            <NavigationCard imageSource="note-icon.png" to="/notes/0" title="Notes" caption="A tree-structured note-taking app for better-organized data. I'm putting a lot of text here so I can test how the cards look at different heights with varying caption lengths. Look at me, look at me, wow.">

            </NavigationCard>
          </div>
        </div>
      </Router>
  );
};

export default App;
