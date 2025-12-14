import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { RotateCcw, Save, MoreHorizontal } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

// --- THEME ---
const THEME = {
  bg: "#0f172a", // Slate 900
  card: "#1e293b", // Slate 800
  text: "#f8fafc", // Slate 50
  subText: "#94a3b8", // Slate 400
  accent: "#10b981", // Emerald 500
  danger: "#ef4444", // Red 500 (Wicket)
  warning: "#f59e0b", // Amber 500 (Extras)
  btnText: "#ffffff",
};

const ScorecardScreen = ({ route, navigation }) => {
  // Get rules from Phase 3 (Fallback to defaults if testing Phase 4 directly)
  const { rules } = route?.params || {
    rules: { teamA: "Team A", teamB: "Team B", totalOvers: 5 },
  };

  // --- MOCK STATE (For Static Layout) ---
  const [activeTab, setActiveTab] = useState(1); // 1 or 2
  const currentInnings = 1;
  const battingTeam = rules.teamA;
  const bowlingTeam = rules.teamB;

  // Mock Score Data
  const score = 45;
  const wickets = 2;
  const overs = 3;
  const balls = 4; // 3.4
  const crr = "12.27";
  const target = null; // Set to number if 2nd innings

  // Mock Timeline Data
  const timeline = [
    { val: "1", type: "run" },
    { val: "4", type: "boundary" },
    { val: "W", type: "wicket" },
    { val: "0", type: "dot" },
    { val: "6", type: "six" },
    { val: "WD", type: "extra" },
  ];

  // --- COMPONENTS ---

  const KeypadButton = ({
    label,
    subLabel,
    color,
    type = "normal",
    flex = 1,
  }) => (
    <TouchableOpacity
      style={[
        styles.keypadBtn,
        { flex: flex },
        type === "extra" && {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderColor: THEME.warning,
        },
        type === "wicket" && {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          borderColor: THEME.danger,
        },
        type === "utility" && {
          backgroundColor: "#334155",
          borderColor: "#475569",
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.keypadText,
          type === "extra" && { color: THEME.warning },
          type === "wicket" && { color: THEME.danger },
        ]}
      >
        {label}
      </Text>
      {subLabel && <Text style={styles.keypadSubText}>{subLabel}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* --- SECTION 1: TOP TABS & MATCH INFO (15%) --- */}
      <View style={styles.topSection}>
        {/* Innings Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.tabActive]}
            onPress={() => setActiveTab(1)}
          >
            <Text
              style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}
            >
              1st Innings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 2 && styles.tabActive,
              currentInnings === 1 && styles.tabDisabled,
            ]}
            disabled={currentInnings === 1}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 2 && styles.tabTextActive,
                currentInnings === 1 && { color: "#475569" },
              ]}
            >
              {currentInnings === 1 ? "Target Not Set" : "2nd Innings"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Match Context Bar */}
        <View style={styles.matchInfoBar}>
          <Text style={styles.teamName}>
            {activeTab === 1 ? rules.teamA : rules.teamB}
          </Text>
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>vs</Text>
          </View>
          <Text style={styles.teamNameSub}>
            {activeTab === 1 ? rules.teamB : rules.teamA}
          </Text>
          <View style={styles.oversBadge}>
            <Text style={styles.oversBadgeText}>{rules.totalOvers} Overs</Text>
          </View>
        </View>
      </View>

      {/* --- SECTION 2: SCORE DISPLAY (25%) --- */}
      <View style={styles.scoreSection}>
        {/* Main Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.bigScore}>
            {score}
            <Text style={styles.scoreSlash}>/</Text>
            {wickets}
          </Text>
          <Text style={styles.runRate}>CRR: {crr}</Text>
        </View>

        {/* Overs Display */}
        <View style={styles.oversDisplayBox}>
          <Text style={styles.oversText}>
            {overs}.{balls} <Text style={styles.oversLabel}>OVERS</Text>
          </Text>
          {target && <Text style={styles.targetText}>Target: {target}</Text>}
        </View>
      </View>

      {/* --- SECTION 3: TIMELINE (10%) --- */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineLabelBox}>
          <Text style={styles.timelineLabel}>THIS OVER</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineScroll}
        >
          {timeline.map((ball, index) => (
            <View
              key={index}
              style={[
                styles.ballNode,
                ball.val === "4" || ball.val === "6"
                  ? styles.ballBoundary
                  : null,
                ball.val === "W" ? styles.ballWicket : null,
                ball.val === "0" ? styles.ballDot : null,
              ]}
            >
              <Text
                style={[
                  styles.ballText,
                  ball.val === "W"
                    ? { color: "#fff", fontWeight: "bold" }
                    : null,
                ]}
              >
                {ball.val}
              </Text>
            </View>
          ))}
          {/* End of over marker */}
          <View style={styles.overSeparator} />
        </ScrollView>
      </View>

      {/* --- SECTION 4: KEYPAD (50%) --- */}
      <View style={styles.keypadSection}>
        {/* Row 1: Runs 1, 2, 3 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="1" />
          <KeypadButton label="2" />
          <KeypadButton label="3" />
        </View>

        {/* Row 2: Runs 4, 6, 0 */}
        <View style={styles.keypadRow}>
          <KeypadButton label="4" color={THEME.accent} />
          <KeypadButton label="6" color={THEME.accent} />
          <KeypadButton label="0" subLabel="DOT" />
        </View>

        {/* Row 3: Extras & Wickets */}
        <View style={styles.keypadRow}>
          <KeypadButton label="WD" subLabel="WIDE" type="extra" />
          <KeypadButton label="NB" subLabel="NO BALL" type="extra" />
          <KeypadButton label="W" subLabel="WICKET" type="wicket" />
        </View>

        {/* Row 4: Utilities */}
        <View style={[styles.keypadRow, { marginTop: 8 }]}>
          <KeypadButton label="UNDO" type="utility" />
          <TouchableOpacity style={styles.retireBtn}>
            <Text style={styles.retireBtnText}>RETIRE / END</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // --- SECTION 1 ---
  topSection: { height: "15%", paddingHorizontal: 16, paddingTop: 8 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: THEME.accent },
  tabDisabled: { opacity: 0.6 },
  tabText: { fontSize: 12, fontWeight: "700", color: THEME.subText },
  tabTextActive: { color: "#0f172a" },

  matchInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  teamName: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  teamNameSub: { color: THEME.subText, fontSize: 14 },
  vsBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.card,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: { fontSize: 8, color: THEME.subText },
  oversBadge: {
    backgroundColor: THEME.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  oversBadgeText: { color: THEME.accent, fontSize: 10, fontWeight: "bold" },

  // --- SECTION 2: SCORE ---
  scoreSection: {
    height: "25%",
    backgroundColor: THEME.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#334155",
    elevation: 4,
  },
  scoreContainer: { alignItems: "flex-start" },
  bigScore: {
    fontSize: 56,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 60,
    letterSpacing: -2,
  },
  scoreSlash: { color: THEME.subText, fontSize: 40 },
  runRate: {
    color: THEME.accent,
    fontWeight: "600",
    fontSize: 14,
    marginTop: 4,
  },

  oversDisplayBox: { alignItems: "flex-end", justifyContent: "center" },
  oversText: { fontSize: 28, fontWeight: "300", color: "#fff" },
  oversLabel: { fontSize: 10, fontWeight: "bold", color: THEME.subText },
  targetText: { color: THEME.subText, fontSize: 12, marginTop: 4 },

  // --- SECTION 3: TIMELINE ---
  timelineSection: {
    height: "10%",
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  timelineLabelBox: { width: 50, marginRight: 10 },
  timelineLabel: {
    color: THEME.subText,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
  },
  timelineScroll: { alignItems: "center", paddingRight: 20, gap: 8 },
  ballNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#334155", // Default
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#475569",
  },
  ballBoundary: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: THEME.accent,
  },
  ballWicket: { backgroundColor: THEME.danger, borderColor: THEME.danger },
  ballDot: { backgroundColor: "transparent", borderColor: "#475569" },
  ballText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  overSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#475569",
    marginHorizontal: 8,
  },

  // --- SECTION 4: KEYPAD ---
  keypadSection: {
    flex: 1, // Takes remaining ~50%
    backgroundColor: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    padding: 12,
    justifyContent: "space-evenly", // Distribute rows
  },
  keypadRow: {
    flexDirection: "row",
    gap: 12,
    height: "22%", // Roughly 4 rows fitting in 50%
  },
  keypadBtn: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  keypadText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  keypadSubText: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "bold",
  },
  retireBtn: {
    flex: 1.5,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  retireBtnText: { color: "#ef4444", fontWeight: "bold", fontSize: 12 },
});

export default ScorecardScreen;
