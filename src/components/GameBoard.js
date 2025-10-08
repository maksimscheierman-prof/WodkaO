import { Image, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";

// Helper für lokale vs. Online-Bilder
const getImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img; // lokale require()
  if (img.uri) return { uri: img.uri }; // Firestore-Objekt mit uri
  if (typeof img === "string") return { uri: img }; // nur String-URL
  return null;
};

export default function GameBoard({
  lobby,
  me,
  others,
  isMyTurn,
  onDraw,
  onShow,
  onDiscard,
  setSelectedCard,
  handleActivateEffect,
}) {
  return (
    <>
      {/* 🔹 Gegnerkarten (oben) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        {others.map((p) => (
          <View
            key={p.id}
            style={{ alignItems: "center", marginHorizontal: 10 }}
          >
            <View style={{ flexDirection: "row" }}>
              {/* Monsterkarte – offen */}
              {p.monster && (
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCard({ ...p.monster, type: "monster" })
                  }
                >
                  <Image
                    source={getImageSource(p.monster.image)}
                    style={{ width: 60, height: 90, marginHorizontal: 5 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              {/* Fallenkarte – verdeckt */}
              {p.trap && (
                <Image
                  source={require("../../assets/images/card_back.png")}
                  style={{ width: 60, height: 90, marginHorizontal: 5 }}
                  resizeMode="cover"
                />
              )}
            </View>
            <Text
              style={{
                color:
                  lobby.players[lobby.turn]?.name === p.name ? "#0f0" : "#fff",
                fontSize: lobby.players[lobby.turn]?.name === p.name ? 20 : 14,
                fontWeight:
                  lobby.players[lobby.turn]?.name === p.name
                    ? "bold"
                    : "normal",
                marginTop: 5,
              }}
            >
              {p.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 🔹 Magiestapel (Mitte) */}
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Image
          source={require("../../assets/images/card_back.png")}
          style={{ width: 80, height: 120 }}
          resizeMode="cover"
        />
        <Text style={{ color: "#fff", marginTop: 5 }}>Magiestapel</Text>

        {/* Ziehen-Button (nur wenn dran & keine Karte gezogen) */}
        {isMyTurn && !lobby.lastMagic && (
          <TouchableOpacity
            onPress={onDraw}
            style={{
              marginTop: 10,
              backgroundColor: "#D9C9A3",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text>✨ Ziehen</Text>
          </TouchableOpacity>
        )}

        {/* Gezogenene Magiekarte */}
        {lobby.lastMagic && (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            {lobby.showMagic ? (
              <>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCard({ ...lobby.lastMagic, type: "magic" })
                  }
                >
                  <Card
                    title={lobby.lastMagic.title}
                    description={lobby.lastMagic.effect}
                    type="magic"
                    image={getImageSource(lobby.lastMagic.image)}
                  />
                </TouchableOpacity>

                <Text style={{ color: "#fff", marginTop: 5 }}>
                  {lobby.lastMagic.title}
                </Text>

                {isMyTurn && (
                  <TouchableOpacity
                    onPress={onDiscard}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#D9C9A3",
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text>🗑️ Ablegen</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              isMyTurn && (
                <TouchableOpacity
                  onPress={onShow}
                  style={{
                    marginTop: 10,
                    backgroundColor: "#D9C9A3",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text>👁️ Aufdecken</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>

      {/* 🔹 Eigene Karten (unten) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-end",
          marginTop: "auto",
        }}
      >
        {/* Mein Monster (klein, klick für Preview) */}
        {me?.monster && (
          <TouchableOpacity
            onPress={() => setSelectedCard({ ...me.monster, type: "monster" })}
          >
            <Image
              source={getImageSource(me.monster.image)}
              style={{ width: 100, height: 150, marginHorizontal: 10 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Meine Falle (nur Rückseite, klick für Preview) */}
        {me?.trap && (
          <TouchableOpacity
            onPress={() => setSelectedCard({ ...me.trap, type: "trap" })}
          >
            <Image
              source={require("../../assets/images/card_back.png")}
              style={{ width: 100, height: 150, marginHorizontal: 10 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Spielername unten */}
      {me && (
        <Text
          style={{
            color:
              lobby.players[lobby.turn]?.name === me.name ? "#0f0" : "#fff",
            fontSize: lobby.players[lobby.turn]?.name === me.name ? 22 : 16,
            fontWeight:
              lobby.players[lobby.turn]?.name === me.name ? "bold" : "normal",
            marginTop: 10,
            textAlign: "center",
          }}
        >
          {me.name} (Du)
        </Text>
      )}
    </>
  );
}
