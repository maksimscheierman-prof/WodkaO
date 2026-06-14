import { Component } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    const ctx = this.props.context || {};
    console.error("[APP ERROR BOUNDARY]", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      ...ctx,
    });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      if (__DEV__) {
        return (
          <View
            style={{
              flex: 1,
              backgroundColor: "#1a0033",
              padding: 20,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#ff6b6b", fontSize: 18, fontWeight: "bold" }}>
              Etwas ist schiefgelaufen
            </Text>
            <ScrollView style={{ marginTop: 12, maxHeight: 280 }}>
              <Text style={{ color: "#fff", fontSize: 13 }}>
                {this.state.error?.message || String(this.state.error)}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={this.handleReset}
              style={{
                marginTop: 20,
                backgroundColor: "#D9C9A3",
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>Erneut versuchen</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#1a0033",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
            Die App ist unerwartet beendet worden. Bitte erneut öffnen.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
