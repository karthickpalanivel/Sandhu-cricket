import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RotateCcw, ChevronLeft, Lock } from "lucide-react-native";

const THEME = {
  bg: "#0f172a",
  card: "#1e293b",
  cardSoft: "#24324a",
  text: "#f8fafc",
  pjr: "#b8b8b8ff",
  subText: "#94a3b8",
  accent: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  border: "#334155",
};

const createEmptyInnings = () => ({
  runs: 0,
  wickets: 0,
  balls: 0,
  timeline: [], // Array of events
});

export default function ScorecardScreen({ route, navigation }) {
  const { rules } = route.params;

  const [match, setMatch] = useState({
    currentInnings: 1,
    innings1: createEmptyInnings(),
    innings2: createEmptyInnings(),
    target: null,
  });

  // NEW: State to control which innings is being VIEWED vs PLAYED
  const [viewInnings, setViewInnings] = useState(1);

  const [extraType, setExtraType] = useState(null); // 'WD' or 'NB'
  const [batContact, setBatContact] = useState(null); // true/false for extras

  // Animation Refs
  const shrinkAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  // Sync view with game progress automatically
  useEffect(() => {
    setViewInnings(match.currentInnings);
  }, [match.currentInnings]);

  // --- DERIVED VALUES FOR DISPLAY ---
  // We use viewInnings to determine what to SHOW
  const displayInningsKey = viewInnings === 1 ? "innings1" : "innings2";
  const displayInnings = match[displayInningsKey];

  // Scoring is only active if we are viewing the innings currently being played
  const isScoringActive = viewInnings === match.currentInnings;

  const overs = Math.floor(displayInnings.balls / 6);
  const balls = displayInnings.balls % 6;

  const crr = displayInnings.balls
    ? ((displayInnings.runs / displayInnings.balls) * 6).toFixed(2)
    : "0.00";

  let rrr = null;
  // RRR is relevant if we are in 2nd innings (either playing it or viewing it)
  // Logic: If target exists, show RRR based on that target and current display stats
  if (match.target) {
    const remainingRuns = match.target - displayInnings.runs;
    const remainingBalls = rules.totalOvers * 6 - displayInnings.balls;

    if (viewInnings === 2) {
      if (remainingBalls <= 0) {
        rrr = remainingRuns > 0 ? "∞" : "0.00";
      } else {
        rrr = ((remainingRuns / remainingBalls) * 6).toFixed(2);
      }
    }
  }

  // --- CORE LOGIC ---

  /**
   * Adds a ball to the timeline and updates score.
   * Handles Rules for Wides/No Balls explicitly.
   */
  const addBall = (event) => {
    // Safety check
    if (!isScoringActive) return;

    setMatch((prev) => {
      const key = prev.currentInnings === 1 ? "innings1" : "innings2";
      const inn = { ...prev[key] };

      // 1. Determine Legality based on Rules
      let isLegal = true;
      let runsToAdd = event.runs;

      // Check Extras Rules
      if (event.type === "WD") {
        isLegal = !rules.extras.wide.reball;
        runsToAdd += rules.extras.wide.runs;
      } else if (event.type === "NB") {
        isLegal = !rules.extras.noBall.reball;
        runsToAdd += rules.extras.noBall.runs;
      }

      // 2. Construct Complete Event Object
      const fullEvent = {
        ...event,
        runsAdded: runsToAdd,
        isLegal: isLegal,
        timestamp: Date.now(),
      };

      // 3. Update Stats
      inn.timeline = [...inn.timeline, fullEvent];
      inn.runs += runsToAdd;

      if (fullEvent.isWicket) {
        inn.wickets += 1;
      }

      if (isLegal) {
        inn.balls += 1;
      }

      return { ...prev, [key]: inn };
    });
  };

  /**
   * Removes the last action from the timeline and reverts score.
   */
  const undoLastBall = () => {
    // Safety check
    if (!isScoringActive) return;

    setMatch((prev) => {
      const key = prev.currentInnings === 1 ? "innings1" : "innings2";
      const inn = { ...prev[key] };

      if (inn.timeline.length === 0) {
        Alert.alert("Nothing to Undo", "Timeline is empty.");
        return prev;
      }

      const lastEvent = inn.timeline[inn.timeline.length - 1];
      const newTimeline = inn.timeline.slice(0, -1);

      inn.runs -= lastEvent.runsAdded;

      if (lastEvent.isWicket) {
        inn.wickets -= 1;
      }

      if (lastEvent.isLegal) {
        inn.balls -= 1;
      }

      inn.timeline = newTimeline;

      return { ...prev, [key]: inn };
    });
  };

  /**
   * Calculates the match result text
   */
  const getMatchResult = () => {
    const runs1 = match.innings1.runs;
    const runs2 = match.innings2.runs;
    const team1 = rules.teamA;
    const team2 = rules.teamB;

    if (runs2 > runs1) {
      return `${team2} WON! \n\nChased down the target of ${runs1 + 1}.`;
    } else if (runs1 > runs2) {
      return `${team1} WON! \n\nDefended by ${runs1 - runs2} runs.`;
    } else {
      return "MATCH TIED!";
    }
  };

  const endInnings = () => {
    if (!isScoringActive) return;

    if (match.currentInnings === 2) {
      // 2nd Innings Over - Calculate Result
      const resultMessage = getMatchResult();

      Alert.alert("Match Finished", resultMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start New Match",
          onPress: () => navigation.replace("Setup"), // Reset to Setup
        },
      ]);
      return;
    }

    // 1st Innings Over - Switch to 2nd
    Alert.alert(
      "End Innings?",
      `Target will be set to ${displayInnings.runs + 1}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start 2nd Innings",
          onPress: () => {
            Animated.timing(shrinkAnim, {
              toValue: 0.92,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setMatch((prev) => ({
                ...prev,
                target: prev.innings1.runs + 1,
                currentInnings: 2,
              }));
              setTimeout(() => {
                Animated.timing(shrinkAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }).start();
              }, 100);
            });
          },
        },
      ]
    );
  };

  /**
   * Handle Back Navigation with Confirmation
   */
  const handleBack = () => {
    Alert.alert(
      "Exit Match?",
      "Current match progress will be lost. Are you sure you want to go back to settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => navigation.replace("Setup"),
        },
      ]
    );
  };

  // --- RENDER HELPERS ---
  const renderTimeline = () => {
    const views = [];
    let legalBallCount = 0;

    displayInnings.timeline.forEach((event, index) => {
      views.push(
        <View key={`ball-${index}`} style={styles.ballChip}>
          <Text
            style={[styles.ballText, event.isWicket && { color: THEME.danger }]}
          >
            {event.display}
          </Text>
        </View>
      );

      if (event.isLegal) {
        legalBallCount++;
        if (legalBallCount % 6 === 0) {
          views.push(
            <View key={`sep-${index}`} style={styles.overSeparator}>
              <Text style={styles.separatorText}>|</Text>
            </View>
          );
        }
      }
    });
    return views;
  };

  useEffect(() => {
    AsyncStorage.setItem("active_match", JSON.stringify(match));
  }, [match]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* HEADER CARD */}
      <View style={styles.headerCard}>
        {/* Left: Back Btn + Team Info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ChevronLeft size={24} color={THEME.subText} />
          </TouchableOpacity>

          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.teamText}>{rules.teamA}</Text>
              <Text style={styles.vs}>vs</Text>
              <Text style={styles.teamText}>{rules.teamB}</Text>
            </View>
            <Text style={styles.subHeaderInfo}>
              {rules.totalOvers} Overs Match
            </Text>
          </View>
        </View>

        {/* Right: Undo Button - ONLY SHOW IF SCORING IS ACTIVE */}
        {isScoringActive && (
          <TouchableOpacity style={styles.undoBtn} onPress={undoLastBall}>
            <RotateCcw size={18} color={THEME.text} />
            <Text style={styles.undoText}>UNDO</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* INNINGS TABS - NOW INTERACTIVE */}
      <View style={styles.tabsCard}>
        <Tab
          label="1st Innings"
          active={viewInnings === 1}
          onPress={() => setViewInnings(1)}
        />
        <Tab
          label="2nd Innings"
          active={viewInnings === 2}
          onPress={() => setViewInnings(2)}
        />
      </View>

      {/* SCORE CARD */}
      <Animated.View
        style={[styles.scoreCard, { transform: [{ scale: shrinkAnim }] }]}
      >
        <Text style={styles.bigScore}>
          {displayInnings.runs}/{displayInnings.wickets}
        </Text>
        <View style={styles.scoreMetaRow}>
          <Text style={styles.metaText}>
            {overs}.{balls} overs
          </Text>
          <Text style={styles.metaText}>CRR {crr}</Text>
          {rrr && (
            <Text
              style={{
                color:
                  parseFloat(rrr) > 10
                    ? THEME.danger
                    : parseFloat(rrr) > 7
                    ? THEME.warning
                    : THEME.accent,
                fontWeight: "700",
              }}
            >
              RRR {rrr}
            </Text>
          )}
        </View>
        {match.target && (
          <Text style={styles.targetText}>Target {match.target}</Text>
        )}
      </Animated.View>

      {/* TIMELINE CARD */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineLabel}>
          {viewInnings === match.currentInnings
            ? "TIMELINE"
            : `TIMELINE (INNINGS ${viewInnings})`}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center", paddingRight: 20 }}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {renderTimeline()}
          {displayInnings.timeline.length === 0 && (
            <Text
              style={{
                color: THEME.subText,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              No deliveries yet
            </Text>
          )}
        </ScrollView>
      </View>

      {/* ACTION AREA - CONDITIONALLY RENDERED */}
      <View style={styles.actionCard}>
        {isScoringActive ? (
          /* SCORING ENABLED KEYPAD */
          <>
            {!extraType ? (
              <>
                <KeyRow
                  values={[1, 2, 3]}
                  onPress={(r) => addBall({ runs: r, type: "RUN", display: r })}
                />
                <KeyRow
                  values={[4, 6, 0]}
                  onPress={(r) => addBall({ runs: r, type: "RUN", display: r })}
                />
                <View style={styles.keyRow}>
                  <Key label="WD" onPress={() => setExtraType("WD")} />
                  <Key label="NB" onPress={() => setExtraType("NB")} />

                  <TouchableOpacity
                    onPress={() =>
                      addBall({
                        runs: 0,
                        isWicket: true,
                        type: "WICKET",
                        display: "W",
                      })
                    }
                    style={[styles.key, styles.wicketKey]}
                  >
                    <Text style={styles.wicketText}>W</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={endInnings} style={styles.endBtn}>
                  <Text style={styles.endBtnText}>
                    {match.currentInnings === 2
                      ? "FINISH MATCH"
                      : "END INNINGS"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pjrLabel}>A Palanivel Jr. Product</Text>
              </>
            ) : (
              /* EXTRAS SELECTION */
              <View style={styles.extraCard}>
                <Text style={styles.extraTitle}>
                  {extraType === "WD" ? "Wide" : "No Ball"} • Runs off Bat?
                </Text>
                <View style={styles.keyRow}>
                  <Key label="YES" onPress={() => setBatContact(true)} />
                  <Key label="NO" onPress={() => setBatContact(false)} />
                </View>

                {batContact !== null && (
                  <View>
                    <Text style={[styles.timelineLabel, { marginTop: 10 }]}>
                      Select Runs Scored
                    </Text>
                    <KeyRow
                      values={[0, 1, 2, 3, 4, 6]}
                      onPress={(r) => {
                        addBall({
                          runs: r,
                          type: extraType,
                          display: `${extraType}${r > 0 ? "+" + r : ""}`,
                        });
                        setExtraType(null);
                        setBatContact(null);
                      }}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setExtraType(null);
                    setBatContact(null);
                  }}
                >
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* READ ONLY VIEW */
          <View style={styles.readOnlyContainer}>
            <Lock size={32} color={THEME.subText} />
            <Text style={styles.readOnlyText}>Read Only Mode</Text>
            <Text style={styles.readOnlySubText}>
              You are viewing Innings {viewInnings}. Switch to Innings{" "}
              {match.currentInnings} to continue scoring.
            </Text>
            <TouchableOpacity
              style={styles.switchToActiveBtn}
              onPress={() => setViewInnings(match.currentInnings)}
            >
              <Text style={styles.switchToActiveText}>
                Go to Active Innings
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const Tab = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.tab, active && styles.tabActive]}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const KeyRow = ({ values, onPress }) => (
  <View style={styles.keyRow}>
    {values.map((v) => (
      <Key key={v} label={v} onPress={() => onPress(v)} />
    ))}
  </View>
);

const Key = ({ label, onPress, danger }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.key, danger && styles.wicketKey]}
  >
    <Text style={[styles.keyText, danger && { color: THEME.danger }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg, padding: 12 },

  headerCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  teamText: { color: THEME.text, fontWeight: "800", fontSize: 16 },
  vs: { color: THEME.subText, marginHorizontal: 8, fontSize: 12 },
  subHeaderInfo: { color: THEME.subText, fontSize: 10, marginTop: 2 },

  backBtn: {
    padding: 4,
    marginRight: 4,
  },

  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.cardSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  undoText: { color: THEME.text, fontSize: 10, fontWeight: "700" },

  tabsCard: {
    flexDirection: "row",
    backgroundColor: THEME.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { backgroundColor: THEME.accent },
  tabText: { color: THEME.subText, fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: THEME.bg },

  scoreCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  bigScore: { fontSize: 54, fontWeight: "900", color: THEME.text },
  scoreMetaRow: { flexDirection: "row", gap: 14, marginTop: 6 },
  metaText: { color: THEME.subText, fontSize: 12 },
  targetText: { color: THEME.accent, marginTop: 6, fontWeight: "700" },

  timelineCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    minHeight: 80,
  },
  timelineLabel: { color: THEME.subText, fontSize: 10, marginBottom: 8 },

  pjrLabel: {
    color: THEME.pjr,
    fontSize: 20,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 1,
  },
  ballChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  ballText: { color: THEME.text, fontWeight: "700" },

  overSeparator: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    width: 10,
  },
  separatorText: { color: THEME.subText, fontSize: 20, opacity: 0.5 },

  actionCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: "center",
  },

  // Read Only UI
  readOnlyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  readOnlyText: {
    color: THEME.text,
    fontWeight: "800",
    fontSize: 18,
    marginTop: 12,
  },
  readOnlySubText: {
    color: THEME.subText,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    maxWidth: "80%",
  },
  switchToActiveBtn: {
    marginTop: 20,
    backgroundColor: THEME.cardSoft,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  switchToActiveText: { color: THEME.accent, fontWeight: "700", fontSize: 12 },

  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  key: {
    flex: 1,
    backgroundColor: THEME.cardSoft,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  keyText: { color: THEME.text, fontSize: 20, fontWeight: "800" },

  wicketKey: { backgroundColor: "rgba(239,68,68,0.15)" },
  wicketText: { color: THEME.danger, fontSize: 20, fontWeight: "900" },

  endBtn: { alignSelf: "center", marginTop: 6 },
  endBtnText: {
    color: THEME.danger,
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 20,
  },

  extraCard: { marginTop: 10 },
  extraTitle: { color: THEME.warning, fontWeight: "800", marginBottom: 8 },

  cancelBtn: { alignSelf: "center", marginTop: 10, padding: 10 },
  cancelBtnText: { color: THEME.subText, fontSize: 12, fontWeight: "600" },
});
