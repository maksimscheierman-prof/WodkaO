import { COMMENTATOR_EVENTS as E } from "./commentatorEvents";
import { COMMENTATOR_STYLES as S } from "./commentatorStyles";

/**
 * Textbausteine pro Persönlichkeit und Event.
 * Platzhalter: {playerName}, {cardName}, {round}, {cardType}, {oldCardName}
 */
export const COMMENTATOR_TEXTS_BY_STYLE = {
  [S.NEUTRAL]: {
    [E.GAME_STARTED]: [
      "Das Spiel beginnt.",
      "Alle Spieler sind bereit. Die Partie startet.",
    ],
    [E.ROUND_STARTED]: [
      "Runde {round} beginnt.",
      "Es geht weiter mit Runde {round}.",
    ],
    [E.CARD_DRAWN]: [
      "{playerName} zieht eine Karte.",
      "{playerName} nimmt eine Karte vom Stapel.",
    ],
    [E.MONSTER_DRAWN]: [
      "{playerName} erhält die Monsterkarte {cardName}.",
      "{playerName} zieht {cardName}.",
    ],
    [E.MAGIC_DRAWN]: [
      "{playerName} zieht die Magiekarte {cardName}.",
      "{playerName} erhält {cardName}.",
    ],
    [E.TRAP_DRAWN]: [
      "{playerName} hat eine Fallenkarte gezogen.",
      "{playerName} erhält {cardName}.",
    ],
    [E.VOTE_STARTED]: [
      "Abstimmung: {playerName} möchte {cardName} spielen.",
      "Es wird über {cardName} von {playerName} abgestimmt.",
    ],
    [E.VOTE_ACCEPTED]: [
      "Die Abstimmung ist angenommen. {playerName} darf {cardName} spielen.",
      "{cardName} wurde bestätigt.",
    ],
    [E.VOTE_REJECTED]: [
      "Die Abstimmung wurde abgelehnt. {playerName} trinkt.",
      "{cardName} wurde nicht angenommen.",
    ],
    [E.MONSTER_EFFECT_DISABLED]: [
      "{playerName} hat den Monstereffekt in dieser Runde genutzt.",
      "Monstereffekt von {playerName} ist verbraucht.",
    ],
    [E.MONSTER_EFFECT_ENABLED]: [
      "Neue Runde. Monstereffekte sind wieder verfügbar.",
      "Monstereffekte wurden zurückgesetzt.",
    ],
    [E.PLAYER_PUNISHED]: [
      "{playerName} muss trinken.",
      "{playerName} bekommt einen Strafschluck.",
    ],
    [E.MAGIC_PLAYED]: [
      "{playerName} spielt {cardName}.",
      "{playerName} legt {cardName} auf den Tisch.",
    ],
    [E.EFFECT_SELECTED]: [
      "{playerName} will {cardName} aktivieren.",
      "{playerName} wählt {cardName} — Abstimmung folgt.",
    ],
    [E.TRAP_REPLACED]: [
      "{playerName} ersetzt die Falle durch {cardName}.",
      "{playerName} tauscht die alte Falle gegen {cardName}.",
    ],
    [E.GAME_ENDED]: [
      "Session beendet. Bis zum nächsten Mal.",
      "Das Spiel ist vorbei — der Kommentator verabschiedet sich.",
    ],
  },

  [S.LOCKER]: {
    [E.GAME_STARTED]: [
      "Das Abenteuer beginnt! Möge das Glück mit euch sein.",
      "Die Runde startet — Karten bereit, Nerven fest!",
      "Willkommen am Tisch. Der Moderator beobachtet alles.",
    ],
    [E.ROUND_STARTED]: [
      "Runde {round} — frische Chancen für alle!",
      "Neue Runde, neue Tricks. Monstereffekte sind wieder bereit.",
      "Runde {round} beginnt. Wer zieht heute das Ass?",
    ],
    [E.CARD_DRAWN]: [
      "{playerName} greift in den Stapel — spannend!",
      "{playerName} zieht eine Karte. Mal sehen, was passiert.",
    ],
    [E.MONSTER_DRAWN]: [
      "{playerName} erhält {cardName}. Ein neues Monster am Tisch!",
      "{playerName} zieht Monsterkarte {cardName}. Mächtig!",
    ],
    [E.MAGIC_DRAWN]: [
      "{playerName} zieht {cardName}. Magie liegt in der Luft.",
      "Magiekarte für {playerName}: {cardName}.",
    ],
    [E.TRAP_DRAWN]: [
      "{playerName} zieht eine Fallenkarte. Das riecht nach Ärger.",
      "{playerName} erhält {cardName}. Vorsicht, Falle!",
    ],
    [E.VOTE_STARTED]: [
      "Abstimmung! Darf {playerName} {cardName} spielen?",
      "Demokratie am Tisch: {playerName} will {cardName} aktivieren.",
    ],
    [E.VOTE_ACCEPTED]: [
      "Angenommen! {playerName} darf {cardName} spielen.",
      "Die Mehrheit sagt Ja — {cardName} wird aktiv.",
    ],
    [E.VOTE_REJECTED]: [
      "Abgelehnt! {playerName} muss trinken.",
      "Nein gewinnt — {playerName} zahlt die Zeche.",
    ],
    [E.MONSTER_EFFECT_DISABLED]: [
      "{playerName} hat den Monstereffekt genutzt — bis zur nächsten Runde Pause.",
      "Monstereffekt von {playerName} ist diese Runde verbraucht.",
    ],
    [E.MONSTER_EFFECT_ENABLED]: [
      "Neue Runde — Monstereffekte sind wieder einsatzbereit!",
      "Frische Runde, frische Monsterkräfte für alle.",
    ],
    [E.PLAYER_PUNISHED]: [
      "{playerName} muss trinken — Strafe am Tisch!",
      "{playerName} setzt an. Prost Mahlzeit!",
    ],
    [E.MAGIC_PLAYED]: [
      "{playerName} spielt {cardName} — Magie in Aktion!",
      "{playerName} entfesselt {cardName}.",
    ],
    [E.EFFECT_SELECTED]: [
      "{playerName} will {cardName} spielen — Stimmen wir ab!",
      "{playerName} wählt {cardName}. Gleich geht's zur Abstimmung.",
    ],
    [E.TRAP_REPLACED]: [
      "{playerName} tauscht die Falle gegen {cardName}.",
      "Neue Falle für {playerName}: {cardName} bleibt, die alte fliegt raus.",
    ],
    [E.GAME_ENDED]: [
      "Das war's für heute! Der Kommentator macht Feierabend.",
      "Session vorbei — danke fürs Mitspielen!",
    ],
  },

  [S.CHAOTIC]: {
    [E.GAME_STARTED]: [
      "Los geht's! Irgendwer wird heute bereuen, mitgespielt zu haben.",
      "Das Chaos nimmt seinen Lauf. Schnallt euch an!",
    ],
    [E.ROUND_STARTED]: [
      "Runde {round}! Das Universum hat wieder neue Überraschungen parat.",
      "Neue Runde, neues Glück — oder neues Pech.",
    ],
    [E.CARD_DRAWN]: [
      "{playerName} greift blind in den Stapel. Mutig oder dumm?",
      "{playerName} zieht. Das Schicksal kichert leise.",
    ],
    [E.MONSTER_DRAWN]: [
      "{playerName} bekommt {cardName}. Der Tisch wird gefährlicher.",
      "Monster-Alarm! {playerName} hält {cardName} in der Hand.",
    ],
    [E.MAGIC_DRAWN]: [
      "{playerName} zieht {cardName}. Irgendwo vibriert die Realität.",
      "Magie! {playerName} hat {cardName}. Was kann schon schiefgehen?",
    ],
    [E.TRAP_DRAWN]: [
      "{playerName} zieht eine Fallenkarte. Irgendwo lacht gerade das Schicksal.",
      "{playerName} erwischt {cardName}. Das wird ungemütlich.",
    ],
    [E.VOTE_STARTED]: [
      "Abstimmung! {playerName} will mit {cardName} Unheil anrichten.",
      "Vote-Zeit! Darf {playerName} {cardName} entfesseln?",
    ],
    [E.VOTE_ACCEPTED]: [
      "Ja! {playerName} darf {cardName} spielen. Möge unsere Seele gnädig sein.",
      "Bestätigt — {cardName} ist frei. Das wird legendär.",
    ],
    [E.VOTE_REJECTED]: [
      "Abgelehnt! {playerName} trinkt. Karma in Aktion.",
      "Nein! {playerName} trinkt und {cardName} bleibt im Käfig.",
    ],
    [E.MONSTER_EFFECT_DISABLED]: [
      "{playerName} hat das Monster entfesselt — bis Rundenende Pause.",
      "Monstermacht von {playerName} ist erstmal erschöpft.",
    ],
    [E.MONSTER_EFFECT_ENABLED]: [
      "Neue Runde! Alle Monster dürfen wieder mopsen.",
      "Reset! Monstereffekte sind wieder scharf.",
    ],
    [E.PLAYER_PUNISHED]: [
      "{playerName} trinkt. Das Universum nickt zufrieden.",
      "Strafe für {playerName} — ein Schluck ins Chaos!",
    ],
    [E.MAGIC_PLAYED]: [
      "{playerName} spielt {cardName}. Reality check: failed.",
      "{playerName} wirft {cardName} ins Spiel. Was kann schon passieren?",
    ],
    [E.EFFECT_SELECTED]: [
      "{playerName} will {cardName} — das wird interessant.",
      "{playerName} aktiviert {cardName}. Abstimmung incoming!",
    ],
    [E.TRAP_REPLACED]: [
      "{playerName} wirft die alte Falle raus — {cardName} bleibt.",
      "Fallentausch! {playerName} setzt auf {cardName}.",
    ],
    [E.GAME_ENDED]: [
      "Session over. Das Chaos geht schlafen — vorerst.",
      "Ende! Der Kommentator braucht jetzt auch einen Drink.",
    ],
  },

  [S.ANIME]: {
    [E.GAME_STARTED]: [
      "Das Duell beginnt! Zeigt mir eure wahre Kraft!",
      "Ein neues Kapitel startet. Der Kampf um Ruhm beginnt!",
    ],
    [E.ROUND_STARTED]: [
      "Runde {round}! Die Spannung steigt — wer wird der Held?",
      "Turn {round}! Neue Kräfte erwachen am Tisch!",
    ],
    [E.CARD_DRAWN]: [
      "{playerName} greift nach dem Schicksal im Stapel!",
      "{playerName} zieht eine Karte. Das Schicksal entscheidet!",
    ],
    [E.MONSTER_DRAWN]: [
      "{playerName} beschwört {cardName}! Ein Monster erscheint!",
      "Monsterkarte! {playerName} ruft {cardName} aufs Feld!",
    ],
    [E.MAGIC_DRAWN]: [
      "{playerName} aktiviert {cardName}! Magische Energie flackert!",
      "Magiekarte gezogen! {playerName} hält {cardName} bereit!",
    ],
    [E.TRAP_DRAWN]: [
      "{playerName} aktiviert sein Schicksal! {cardName} erscheint auf dem Feld!",
      "Fallenkarte! {playerName} setzt {cardName} — Vorsicht, Gegner!",
    ],
    [E.VOTE_STARTED]: [
      "Abstimmungs-Duell! Darf {playerName} {cardName} entfesseln?",
      "{playerName} fordert die Gruppe heraus: {cardName} — Ja oder Nein?",
    ],
    [E.VOTE_ACCEPTED]: [
      "Die Mehrheit stimmt zu! {playerName} setzt {cardName} ein!",
      "Effekt bestätigt! {cardName} wird entfesselt!",
    ],
    [E.VOTE_REJECTED]: [
      "Abgelehnt! {playerName} trinkt — eine Niederlage im Duell!",
      "Nein! {playerName} zahlt den Preis für {cardName}.",
    ],
    [E.MONSTER_EFFECT_DISABLED]: [
      "{playerName} hat seine Monstermacht entfesselt — Cooldown aktiv!",
      "Monstereffekt von {playerName} verbraucht. Bis zur nächsten Runde!",
    ],
    [E.MONSTER_EFFECT_ENABLED]: [
      "Neue Runde! Monstermächte sind wieder aufgeladen!",
      "Power-Reset! Alle Monster sind bereit für den nächsten Zug!",
    ],
    [E.PLAYER_PUNISHED]: [
      "{playerName} zahlt den Preis — trinken!",
      "Niederlage für {playerName}! Ein Schluck als Strafe.",
    ],
    [E.MAGIC_PLAYED]: [
      "{playerName} aktiviert {cardName}! Magische Kraft entfesselt!",
      "{playerName} spielt {cardName} — die Magie wirkt!",
    ],
    [E.EFFECT_SELECTED]: [
      "{playerName} wählt {cardName}! Die Gruppe muss entscheiden!",
      "{playerName} will {cardName} einsetzen — Abstimmungs-Duell!",
    ],
    [E.TRAP_REPLACED]: [
      "{playerName} tauscht die Falle — {cardName} bleibt im Spiel!",
      "Neue Falle für {playerName}: {cardName} ersetzt die alte!",
    ],
    [E.GAME_ENDED]: [
      "Finale Phase! Die Session endet — bis zum nächsten Duell!",
      "Das Duell ist vorbei. Der Kommentator verbeugt sich.",
    ],
  },

  [S.TAVERN]: {
    [E.GAME_STARTED]: [
      "Willkommen in der Kneipe! Haltet eure Gläser bereit.",
      "Die Runde geht los. Der Wirt beobachtet genau mit.",
    ],
    [E.ROUND_STARTED]: [
      "Runde {round}. Nachschub ist da — und neue Chancen zum Trinken.",
      "Noch eine Runde, noch ein Schluck. Runde {round} beginnt!",
    ],
    [E.CARD_DRAWN]: [
      "{playerName} greift in den Stapel. Hoffentlich kein Ärger.",
      "{playerName} zieht. Der Abend wird länger.",
    ],
    [E.MONSTER_DRAWN]: [
      "{playerName} kriegt {cardName}. Sieht aus, als würde es wild.",
      "Monster für {playerName}: {cardName}. Prost Mahlzeit!",
    ],
    [E.MAGIC_DRAWN]: [
      "{playerName} zieht {cardName}. Magie und Met mischen sich.",
      "{playerName} hat {cardName}. Das wird 'ne Story.",
    ],
    [E.TRAP_DRAWN]: [
      "{playerName} zieht eine Falle. Der Abend wird nicht nüchterner.",
      "{playerName} erwischt {cardName}. Vorsicht, Stolperfallen!",
    ],
    [E.VOTE_STARTED]: [
      "Abstimmen, Leute! Darf {playerName} mit {cardName} anstellen?",
      "Hand hoch: {playerName} will {cardName} — Ja oder Nein?",
    ],
    [E.VOTE_ACCEPTED]: [
      "Angenommen! {playerName} darf {cardName} ausspielen.",
      "Die Mehrheit sagt Ja. {cardName} ist frei — Prost!",
    ],
    [E.VOTE_REJECTED]: [
      "Abgelehnt! {playerName} trinkt. So läuft's in der Kneipe.",
      "Nein! {playerName} setzt an. {cardName} bleibt im Deck.",
    ],
    [E.MONSTER_EFFECT_DISABLED]: [
      "{playerName} hat sein Monster gezähmt — erstmal Pause.",
      "Monstereffekt von {playerName} ist durch. Zeit für 'nen Schluck.",
    ],
    [E.MONSTER_EFFECT_ENABLED]: [
      "Neue Runde! Alle Monster dürfen wieder randalieren.",
      "Frische Runde, frische Monster. Der Wirt nickt zufrieden.",
    ],
    [E.PLAYER_PUNISHED]: [
      "{playerName} trinkt. Der Wirt füllt schon nach.",
      "Strafe für {playerName} — ein Schluck am Tresen!",
    ],
    [E.MAGIC_PLAYED]: [
      "{playerName} spielt {cardName}. Met und Magie — klassisch.",
      "{playerName} legt {cardName} auf — der Tresen bebt.",
    ],
    [E.EFFECT_SELECTED]: [
      "{playerName} will {cardName} — Hand hoch zum Abstimmen!",
      "{playerName} wählt {cardName}. Gleich wird abgestimmt.",
    ],
    [E.TRAP_REPLACED]: [
      "{playerName} tauscht die Falle — {cardName} bleibt liegen.",
      "Neue Falle am Tresen: {playerName} setzt auf {cardName}.",
    ],
    [E.GAME_ENDED]: [
      "Letzte Runde am Tresen — die Session ist vorbei!",
      "Feierabend! Der Kommentator kehrt hinter die Theke.",
    ],
  },
};
