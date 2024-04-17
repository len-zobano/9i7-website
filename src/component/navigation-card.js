import React from "react";
import { useParams } from "react-router-dom"
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
  } from 'react-router-dom';

const NavigationCard = ({imageSource, title, caption, to}) => {
    return (
        <Link to={to} class="navigation-card">
            <div class="image" style={{ backgroundImage: `url(${imageSource})` }}>

            </div>
            <div class="text">
                <div class="title">
                    {title}
                </div>
                <div class="caption">
                    {caption}
                </div>
            </div>
        </Link>
    )
};

export default NavigationCard;