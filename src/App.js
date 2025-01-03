import './App.scss';
import React, {Component} from "react";
import Particle from './component/particle';
import NoteEditor from './component/note-editor';
import UAG from './component/UAG'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

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
          <Route exact path='/UAG' element={< UAG />}></Route>
        </Routes>
      </Router>
  );
};

export default App;
