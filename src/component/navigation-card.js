import React from "react";
import { useParams } from "react-router-dom"

const NavigationCard = ({imageSource}) => {
    return (
        <div class="navigation-card">
            Hello World! From NavigationCard: {imageSource}
        </div>)
};

export default NavigationCard;