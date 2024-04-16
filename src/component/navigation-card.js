import React from "react";
import { useParams } from "react-router-dom"
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
  } from 'react-router-dom';

const NavigationCard = ({imageSource, title, to}) => {
    return (
        <Link to={to} class="navigation-card" style={{ backgroundImage: `url(${imageSource})` }}>
            <div class="title">
                {title}
            </div>
        </Link>
    )
};

export default NavigationCard;