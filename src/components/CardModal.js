import CardDetailModal from "./CardDetailModal";

import { getGameCardModalSource } from "../utils/cardModalCore";



/** @deprecated Use CardDetailModal — kept for game.js import compatibility */

export default function CardModal({ selectedCard, onClose, source }) {

  const resolvedSource =

    source ||

    getGameCardModalSource(selectedCard?.type);



  return (

    <CardDetailModal

      visible={!!selectedCard}

      card={selectedCard}

      source={resolvedSource}

      onClose={onClose}

    />

  );

}

