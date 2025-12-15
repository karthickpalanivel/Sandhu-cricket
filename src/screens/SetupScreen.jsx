import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Users,
  Clock,
  Play,
  ChevronDown,
  ChevronUp,
  Check,
  Settings2,
  ShieldAlert,
  Sun,
  Moon,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext"; // Import Context

const { width } = Dimensions.get("window");

// --- EXTRAS OPTIONS ---
const EXTRA_OPTIONS = [
  { id: "runs", label: "1 Run Only", runs: 1, reball: false },
  { id: "ball", label: "Re-Ball Only", runs: 0, reball: true },
  { id: "both", label: "1 Run + Re-Ball", runs: 1, reball: true },
];

const SetupScreen = ({ navigation }) => {
  // --- THEME HOOK ---
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // --- STATE ---
  const [presetMode, setPresetMode] = useState("custom");

  // Rules State
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [overs, setOvers] = useState(5);

  const [wideSetting, setWideSetting] = useState("both");
  const [noBallSetting, setNoBallSetting] = useState("both");

  const [showWideOptions, setShowWideOptions] = useState(false);
  const [showNoBallOptions, setShowNoBallOptions] = useState(false);

  // --- LIFECYCLE ---
  useEffect(() => {
    if (presetMode === "default") {
      applyDefaultRules();
    } else if (presetMode === "previous") {
      loadPreviousRules();
    }
  }, [presetMode]);

  // --- LOGIC ---
  const applyDefaultRules = () => {
    setOvers(5);
    setWideSetting("both");
    setNoBallSetting("both");
  };

  const loadPreviousRules = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("last_match_rules");
      if (jsonValue != null) {
        const rules = JSON.parse(jsonValue);
        setTeamA(rules.teamA);
        setTeamB(rules.teamB);
        setOvers(rules.totalOvers);

        const mapExtraToId = (extra) => {
          if (extra.runs > 0 && extra.reball) return "both";
          if (extra.runs > 0 && !extra.reball) return "runs";
          if (extra.reball && extra.runs === 0) return "ball";
          return "both";
        };

        setWideSetting(mapExtraToId(rules.extras.wide));
        setNoBallSetting(mapExtraToId(rules.extras.noBall));
      } else {
        Alert.alert("No History", "No previous match found. Using Default.");
        setPresetMode("default");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load history.");
    }
  };

  const handleStartMatch = async () => {
    const finalTeamA = teamA.trim() || "Team A";
    const finalTeamB = teamB.trim() || "Team B";

    const wideRule = EXTRA_OPTIONS.find((o) => o.id === wideSetting);
    const noBallRule = EXTRA_OPTIONS.find((o) => o.id === noBallSetting);

    const matchRules = {
      matchId: Date.now().toString(),
      teamA: finalTeamA,
      teamB: finalTeamB,
      totalOvers: overs,
      extras: {
        wide: {
          runs: wideRule.runs,
          reball: wideRule.reball,
          type: wideSetting,
        },
        noBall: {
          runs: noBallRule.runs,
          reball: noBallRule.reball,
          type: noBallSetting,
        },
      },
      status: "active",
      createdAt: Date.now(),
      currentInnings: 1,
      battingTeam: finalTeamA,
      bowlingTeam: finalTeamB,
    };

    try {
      await AsyncStorage.setItem("match_rules", JSON.stringify(matchRules));
      await AsyncStorage.setItem(
        "last_match_rules",
        JSON.stringify(matchRules)
      );

      if (navigation) {
        navigation.replace("Scorecard", { rules: matchRules });
      }
    } catch (error) {
      Alert.alert("Error", "Could not save match setup.");
    }
  };

  // --- CUSTOM COMPONENTS ---

  const CustomSlider = ({ value, onValueChange, max = 20 }) => {
    const handleTouch = (evt) => {
      const locationX = evt.nativeEvent.locationX;
      const trackWidth = width - 80;
      const percentage = Math.max(0, Math.min(1, locationX / trackWidth));
      const newValue = Math.round(percentage * max);
      onValueChange(newValue === 0 ? 1 : newValue);
    };

    const fillPercent = (value / max) * 100;

    return (
      <View
        style={styles.sliderContainer}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      >
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${fillPercent}%` }]} />
        </View>
        <View
          style={[
            styles.sliderThumb,
            { left: `${fillPercent}%`, marginLeft: -12 },
          ]}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1</Text>
          <Text style={styles.sliderLabelText}>{max / 2}</Text>
          <Text style={styles.sliderLabelText}>{max}</Text>
        </View>
      </View>
    );
  };

  const DropdownSelector = ({ label, value, isOpen, onToggle, onSelect }) => {
    const selectedOption = EXTRA_OPTIONS.find((o) => o.id === value);

    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownValue}>{selectedOption?.label}</Text>
          {isOpen ? (
            <ChevronUp size={16} color={theme.accent} />
          ) : (
            <ChevronDown size={16} color={theme.subText} />
          )}
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownMenu}>
            {EXTRA_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.dropdownItem,
                  value === opt.id && styles.dropdownItemActive,
                ]}
                onPress={() => onSelect(opt.id)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === opt.id && styles.dropdownItemTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {value === opt.id && <Check size={14} color={theme.bg} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={styles.headerIcon}>
            <Settings2 size={24} color={theme.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Match Rules</Text>
            <Text style={styles.headerSubtitle}>
              Configure your game settings
            </Text>
          </View>
        </View>

        {/* THEME TOGGLE */}
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          {isDark ? (
            <Sun size={24} color={theme.text} />
          ) : (
            <Moon size={24} color={theme.text} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* PRESET TOGGLE */}
          <View style={styles.presetRow}>
            {["default", "previous", "custom"].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.presetBtn,
                  presetMode === mode && styles.presetBtnActive,
                ]}
                onPress={() => setPresetMode(mode)}
              >
                <Text
                  style={[
                    styles.presetText,
                    presetMode === mode && styles.presetTextActive,
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CARD 1: TEAMS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Users size={18} color={theme.accent} />
              <Text style={styles.cardTitle}>Teams</Text>
            </View>
            <View style={styles.teamInputContainer}>
              <TextInput
                style={styles.teamInput}
                placeholder="Team A (Default)"
                placeholderTextColor={theme.subText}
                value={teamA}
                onChangeText={setTeamA}
              />
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <TextInput
                style={styles.teamInput}
                placeholder="Team B (Default)"
                placeholderTextColor={theme.subText}
                value={teamB}
                onChangeText={setTeamB}
              />
            </View>
          </View>

          {/* CARD 2: OVERS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={18} color={theme.accent} />
              <Text style={styles.cardTitle}>Overs Limit</Text>
              <Text style={styles.oversDisplay}>{overs}</Text>
            </View>

            <View style={{ marginTop: 10, marginBottom: 10 }}>
              <CustomSlider value={overs} onValueChange={setOvers} max={20} />
            </View>

            <Text style={styles.helperText}>
              Slide bar to adjust overs (1-20)
            </Text>
          </View>

          {/* CARD 3: EXTRAS RULES */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ShieldAlert size={18} color={theme.accent} />
              <Text style={styles.cardTitle}>Extras Configuration</Text>
            </View>

            {/* Wide Rules */}
            <DropdownSelector
              label="Wide Ball Rule"
              value={wideSetting}
              isOpen={showWideOptions}
              onToggle={() => {
                setShowWideOptions(!showWideOptions);
                setShowNoBallOptions(false);
              }}
              onSelect={(val) => {
                setWideSetting(val);
                setShowWideOptions(false);
              }}
            />

            <View style={styles.divider} />

            {/* No Ball Rules */}
            <DropdownSelector
              label="No Ball Rule"
              value={noBallSetting}
              isOpen={showNoBallOptions}
              onToggle={() => {
                setShowNoBallOptions(!showNoBallOptions);
                setShowWideOptions(false);
              }}
              onSelect={(val) => {
                setNoBallSetting(val);
                setShowNoBallOptions(false);
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStartMatch}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>START MATCH</Text>
          <Play size={20} color={theme.bg} fill={theme.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- DYNAMIC STYLES GENERATOR ---
const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },

    header: {
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 24,
      backgroundColor: theme.bg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Changed for Toggle
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.card,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: theme.text },
    headerSubtitle: { fontSize: 13, color: theme.subText },

    themeToggle: {
      padding: 8,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },

    scrollContent: { padding: 20, paddingBottom: 100 },

    presetRow: {
      flexDirection: "row",
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    presetBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    presetBtnActive: { backgroundColor: theme.accent },
    presetText: { fontSize: 11, fontWeight: "700", color: theme.subText },
    presetTextActive: { color: theme.bg },

    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    cardTitle: { color: theme.text, fontSize: 16, fontWeight: "700", flex: 1 },

    teamInputContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
    teamInput: {
      flex: 1,
      backgroundColor: theme.input,
      height: 48,
      borderRadius: 10,
      paddingHorizontal: 12,
      color: theme.mode === "light" ? theme.text : "#fff", // Input text color fix
      fontSize: 14,
      textAlign: "center",
    },
    vsBadge: { width: 24, alignItems: "center" },
    vsText: { color: theme.subText, fontSize: 10, fontWeight: "900" },

    oversDisplay: { fontSize: 18, fontWeight: "bold", color: theme.accent },
    sliderContainer: { height: 40, justifyContent: "center" },
    sliderTrack: {
      height: 6,
      backgroundColor: theme.input,
      borderRadius: 3,
      width: "100%",
    },
    sliderFill: { height: 6, backgroundColor: theme.accent, borderRadius: 3 },
    sliderThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#fff",
      position: "absolute",
      top: 8,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.3,
    },
    sliderLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    sliderLabelText: { color: theme.subText, fontSize: 10 },
    helperText: {
      color: theme.subText,
      fontSize: 11,
      marginTop: 12,
      fontStyle: "italic",
      textAlign: "center",
    },

    dropdownContainer: { marginBottom: 4, position: "relative", zIndex: 10 },
    dropdownLabel: {
      color: theme.subText,
      fontSize: 11,
      marginBottom: 6,
      fontWeight: "600",
    },
    dropdownTrigger: {
      backgroundColor: theme.input,
      borderRadius: 10,
      padding: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dropdownValue: {
      color: theme.mode === "light" ? theme.text : "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    dropdownMenu: {
      backgroundColor: theme.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.accent,
      marginTop: 6,
      overflow: "hidden",
    },
    dropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dropdownItemActive: { backgroundColor: theme.accent },
    dropdownItemText: { color: theme.subText, fontSize: 13 },
    dropdownItemTextActive: { color: theme.bg, fontWeight: "700" },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },

    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 24,
      paddingBottom: 36,
      backgroundColor: theme.bg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    startBtn: {
      backgroundColor: theme.accent,
      height: 56,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      elevation: 8,
      shadowColor: theme.accent,
      shadowOpacity: 0.4,
    },
    startBtnText: {
      color: theme.bg,
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: 1,
    },
  });

export default SetupScreen;
