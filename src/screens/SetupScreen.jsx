import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
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
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// --- THEME CONSTANTS ---
const THEME = {
  bg: "#0f172a", // Slate 900
  card: "#1e293b", // Slate 800
  input: "#334155", // Slate 700
  text: "#f8fafc", // Slate 50
  subText: "#94a3b8", // Slate 400
  accent: "#10b981", // Emerald 500
  border: "#334155", // Slate 700
  danger: "#ef4444",
};

// --- EXTRAS OPTIONS ---
const EXTRA_OPTIONS = [
  { id: "runs", label: "1 Run Only", runs: 1, reball: false },
  { id: "ball", label: "Re-Ball Only", runs: 0, reball: true },
  { id: "both", label: "1 Run + Re-Ball", runs: 1, reball: true },
];

const SetupScreen = ({ navigation }) => {
  // --- STATE ---
  const [presetMode, setPresetMode] = useState("custom"); // 'default', 'previous', 'custom'

  // Rules State
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [overs, setOvers] = useState(5);

  // "runs", "ball", or "both"
  const [wideSetting, setWideSetting] = useState("both");
  const [noBallSetting, setNoBallSetting] = useState("both");

  // UI State for Accordions
  const [showWideOptions, setShowWideOptions] = useState(false);
  const [showNoBallOptions, setShowNoBallOptions] = useState(false);

  // --- LIFECYCLE ---
  useEffect(() => {
    // Determine behavior based on preset
    if (presetMode === "default") {
      applyDefaultRules();
    } else if (presetMode === "previous") {
      loadPreviousRules();
    }
    // 'custom' leaves state as is (editable)
  }, [presetMode]);

  // --- LOGIC ---
  const applyDefaultRules = () => {
    setOvers(5);
    setWideSetting("both");
    setNoBallSetting("both");
    // We don't clear names in default, just rules
  };

  const loadPreviousRules = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("last_match_rules");
      if (jsonValue != null) {
        const rules = JSON.parse(jsonValue);
        setTeamA(rules.teamA);
        setTeamB(rules.teamB);
        setOvers(rules.totalOvers);

        // Map back storage object to UI ID
        const mapExtraToId = (extra) => {
          if (extra.runs > 0 && extra.reball) return "both";
          if (extra.runs > 0 && !extra.reball) return "runs";
          if (extra.reball && extra.runs === 0) return "ball";
          return "both"; // Fallback
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
    // 1. Finalize Names
    const finalTeamA = teamA.trim() || "Team A";
    const finalTeamB = teamB.trim() || "Team B";

    // 2. Get Rules from IDs
    const wideRule = EXTRA_OPTIONS.find((o) => o.id === wideSetting);
    const noBallRule = EXTRA_OPTIONS.find((o) => o.id === noBallSetting);

    // 3. Construct Object
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
      // 4. Save & Navigate
      await AsyncStorage.setItem("match_rules", JSON.stringify(matchRules)); // Current Match
      await AsyncStorage.setItem(
        "last_match_rules",
        JSON.stringify(matchRules)
      ); // History

      console.log("Match Started:", matchRules);

      if (navigation) {
        // Navigating to the next phase
        navigation.replace("Scorecard", { rules: matchRules });
      } else {
        Alert.alert("Phase 3 Done", "Rules Saved! Ready for Scorecard.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not save match setup.");
    }
  };

  // --- CUSTOM COMPONENTS ---

  // 1. Custom Slider Component (Visual & Touch)
  const CustomSlider = ({ value, onValueChange, max = 20 }) => {
    const trackRef = useRef(null);

    const handleTouch = (evt) => {
      const locationX = evt.nativeEvent.locationX;
      // Assume track width is roughly screen width - padding (approx 300-350)
      // Ideally we measure onLayout, but for simplicity in this specific layout:
      const trackWidth = width - 80; // Padding 24*2 + internal padding
      const percentage = Math.max(0, Math.min(1, locationX / trackWidth));
      const newValue = Math.round(percentage * max);
      onValueChange(newValue === 0 ? 1 : newValue); // Min 1 over
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

  // 2. Custom Dropdown Item
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
            <ChevronUp size={16} color={THEME.accent} />
          ) : (
            <ChevronDown size={16} color={THEME.subText} />
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
                {value === opt.id && <Check size={14} color={THEME.bg} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Settings2 size={24} color={THEME.accent} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Match Rules</Text>
          <Text style={styles.headerSubtitle}>
            Configure your game settings
          </Text>
        </View>
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
              <Users size={18} color={THEME.accent} />
              <Text style={styles.cardTitle}>Teams</Text>
            </View>
            <View style={styles.teamInputContainer}>
              <TextInput
                style={styles.teamInput}
                placeholder="Team A (Default)"
                placeholderTextColor={THEME.subText}
                value={teamA}
                onChangeText={setTeamA}
              />
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <TextInput
                style={styles.teamInput}
                placeholder="Team B (Default)"
                placeholderTextColor={THEME.subText}
                value={teamB}
                onChangeText={setTeamB}
              />
            </View>
          </View>

          {/* CARD 2: OVERS */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={18} color={THEME.accent} />
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
              <ShieldAlert size={18} color={THEME.accent} />
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
          <Play size={20} color={THEME.bg} fill={THEME.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: THEME.bg,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: THEME.text },
  headerSubtitle: { fontSize: 13, color: THEME.subText },

  scrollContent: { padding: 20, paddingBottom: 100 },

  // Preset Tabs
  presetRow: {
    flexDirection: "row",
    backgroundColor: THEME.card,
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
  presetBtnActive: { backgroundColor: THEME.accent },
  presetText: { fontSize: 11, fontWeight: "700", color: THEME.subText },
  presetTextActive: { color: THEME.bg },

  // Cards
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: { color: THEME.text, fontSize: 16, fontWeight: "700", flex: 1 },

  // Teams
  teamInputContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  teamInput: {
    flex: 1,
    backgroundColor: THEME.input,
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  vsBadge: { width: 24, alignItems: "center" },
  vsText: { color: THEME.subText, fontSize: 10, fontWeight: "900" },

  // Slider UI
  oversDisplay: { fontSize: 18, fontWeight: "bold", color: THEME.accent },
  sliderContainer: { height: 40, justifyContent: "center" },
  sliderTrack: {
    height: 6,
    backgroundColor: THEME.input,
    borderRadius: 3,
    width: "100%",
  },
  sliderFill: { height: 6, backgroundColor: THEME.accent, borderRadius: 3 },
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
  sliderLabelText: { color: THEME.subText, fontSize: 10 },
  helperText: {
    color: THEME.subText,
    fontSize: 11,
    marginTop: 12,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Dropdowns
  dropdownContainer: { marginBottom: 4, position: "relative", zIndex: 10 },
  dropdownLabel: {
    color: THEME.subText,
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "600",
  },
  dropdownTrigger: {
    backgroundColor: THEME.input,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  dropdownMenu: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.accent,
    marginTop: 6,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemActive: { backgroundColor: THEME.accent },
  dropdownItemText: { color: THEME.subText, fontSize: 13 },
  dropdownItemTextActive: { color: THEME.bg, fontWeight: "700" },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 12 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 36,
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  startBtn: {
    backgroundColor: THEME.accent,
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 8,
    shadowColor: THEME.accent,
    shadowOpacity: 0.4,
  },
  startBtnText: {
    color: THEME.bg,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default SetupScreen;
