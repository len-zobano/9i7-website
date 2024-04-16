import React from "react";
import { useParams } from "react-router-dom"

const NavigationCard = ({imageSource}) => {
    return (
        <div class="navigation-card" style={{ backgroundImage: `url(${imageSource})` }}>
            Hello World 2! From NavigationCard: {imageSource}
        </div>
    )
};

export default NavigationCard;