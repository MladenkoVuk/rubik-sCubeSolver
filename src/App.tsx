import React, { useState, useRef, useEffect } from "react";
import {
    IonApp,
    IonContent,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonButton,
    IonIcon,
} from "@ionic/react";
import { keyOutline, cubeOutline, trophyOutline, refreshOutline } from "ionicons/icons";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    PerspectiveCamera,
    ContactShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Cube, type CubeHandle } from "./Cube";

import "./style.css";

const STEPS = [
    { id: "01", title: "The Daisy", sub: "Setup on Yellow", detail: "Bring 4 white edges around the YELLOW center. No algorithm needed—just intuition!", algo: ["U"], tasks: ["Ignore side colors for now", 'Form a "flower" on top'] },
    { id: "02", title: "White Cross", sub: "The Drop", detail: "Match the side color of a white edge with its center (U), then flip it down to the White side (F F).", algo: ["U", "F", "F"], tasks: ["Match side center color", "Double rotate face to bottom"] },
    { id: "03", title: "White Corners", sub: "First Layer", detail: 'Flip the cube so White is on bottom. Use the "Sexy Move" to insert corners.', algo: ["R", "U", "R'", "U'"], tasks: ["Position corner over slot", "Repeat until face is solved"] },
    { id: "04", title: "Second Layer", sub: "Middle Edges", detail: "Move edges from the top layer into the middle slots.", algo: ["U", "R", "U", "R'", "U'", "F'", "U", "F"], tasks: ["Align T-shape on side", "Execute sequence"] },
    { id: "05", title: "Yellow Cross", sub: "Top Cap", detail: "Create a cross on the yellow face without ruining the bottom.", algo: ["F", "R", "U", "R'", "U'", "F'"], tasks: ["Look for Dot, L-shape, or Line"] },
    { id: "06", title: "Yellow Face", sub: "Orientation", detail: "Use the Sune move to make the entire top face yellow.", algo: ["R", "U", "R'", "U", "R", "U", "U", "R'"], tasks: ['Position "Fish" nose bottom-left'] },
    { id: "07", title: "Permutation", sub: "Final Finish", detail: "Cycle the last corners and edges to solve the cube.", algo: ["L", "U'", "R", "U", "L'", "U'", "R", "U"], tasks: ["Match the headlights", "Full solve! 🏁"] },
];

const App: React.FC = () => {
    const [moves, setMoves] = useState(0);
    const [activeStep, setActiveStep] = useState("01");
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const cubeRef = useRef<CubeHandle>(null);
    const orbitRef = useRef<any>(null);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isRunning && !showSuccess) {
            interval = setInterval(() => setTime((prev) => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, showSuccess]);

    // Check for Completion
    useEffect(() => {
        if (completedSteps.length === STEPS.length && STEPS.length > 0) {
            setIsRunning(false);
            setShowSuccess(true);
        }
    }, [completedSteps]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleMove = () => {
        setMoves((m) => m + 1);
        if (!isRunning) setIsRunning(true);
    };

    const resetAll = () => {
        setMoves(0);
        setCompletedSteps([]);
        setTime(0);
        setIsRunning(false);
        setShowSuccess(false);
        cubeRef.current?.shuffle(); 
    };

    return (
        <IonApp style={{ "--ion-background-color": "#1a1b1e" } as React.CSSProperties}>
            <IonSplitPane contentId="main">
                {/* LEFT SIDEBAR */}
                <IonMenu contentId="main" side="start" className="ion-no-border">
                    <IonHeader className="ion-no-border" style={{ background: '#25262b' }}>
                        <div style={{ padding: '30px 24px 25px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={logoIconStyle}>
                                <IonIcon icon={cubeOutline} style={{ color: '#4dabf7', fontSize: '1.5rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h1 style={logoTextStyle}>Cube<span style={{ color: '#4dabf7' }}>Solver</span></h1>
                                <p style={logoSubStyle}>Interactive Trainer</p>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#373a40' }}></div>
                    </IonHeader>

                    <IonContent className="ion-padding" style={{ "--background": "#25262b" } as any}>
                        <div style={statsCardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                                <div style={{ textAlign: "center" }}>
                                    <p style={miniLabel}>TIMER</p>
                                    <h2 style={statsValueStyle}>{formatTime(time)}</h2>
                                </div>
                                <div style={dividerStyle}></div>
                                <div style={{ textAlign: "center" }}>
                                    <p style={miniLabel}>ROTATIONS</p>
                                    <h2 style={statsValueStyle}>{moves}</h2>
                                </div>
                            </div>
                        </div>

                        <IonButton expand="block" onClick={() => cubeRef.current?.shuffle()} style={primaryBtnStyle as any}>
                            SHUFFLE
                        </IonButton>

                        <IonButton expand="block" fill="clear" onClick={resetAll} style={resetBtnStyle as any}>
                            RESET SESSION
                        </IonButton>

                        <div style={guideBoxStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                <IonIcon icon={keyOutline} style={{ color: "#4dabf7", fontSize: "1.1rem" }} />
                                <span style={guideTitleStyle}>HOW TO PLAY</span>
                            </div>
                            <div style={controlGrid}>
                                {['R', 'L', 'U', 'D', 'F', 'B'].map(key => (
                                    <div key={key} style={controlItem}>
                                        <span style={bigKeyCap}>{key}</span> <p style={keyText}>{key === 'U' ? 'Up' : key === 'D' ? 'Down' : key === 'F' ? 'Front' : key === 'B' ? 'Back' : key === 'R' ? 'Right' : 'Left'}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={shiftNote}>
                                <span style={shiftKeyCap}>SHIFT + KEY</span>
                                <p style={shiftSubStyle}>Prime Move (Reverse)</p>
                            </div>
                        </div>
                    </IonContent>
                </IonMenu>

                {/* MAIN VIEWPORT */}
                <div id="main" style={{ width: "100%", height: "100vh", background: "#141517", position: 'relative' }}>
                    
                    {/* SUCCESS OVERLAY */}
                    {showSuccess && (
                        <div style={successOverlayStyle}>
                            <div style={successCardStyle}>
                                <div style={trophyCircleStyle}>
                                    <IonIcon icon={trophyOutline} style={{ fontSize: '3rem', color: '#ffd43b' }} />
                                </div>
                                <h2 style={{ color: '#fff', fontSize: '2rem', margin: '10px 0' }}>Solved!</h2>
                                <p style={{ color: '#909296', marginBottom: '25px' }}>Excellent technique, speedcuber.</p>
                                
                                <div style={finalStatsRow}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={miniLabel}>FINAL TIME</p>
                                        <h3 style={{ color: '#fff', margin: 0 }}>{formatTime(time)}</h3>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={miniLabel}>TOTAL MOVES</p>
                                        <h3 style={{ color: '#fff', margin: 0 }}>{moves}</h3>
                                    </div>
                                </div>

                                <button onClick={resetAll} style={playAgainBtnStyle}>
                                    <IonIcon icon={refreshOutline} style={{ marginRight: '8px' }} />
                                    PLAY AGAIN
                                </button>
                            </div>
                        </div>
                    )}

                    <Canvas gl={{ antialias: true }}>
                        <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={35} />
                        <OrbitControls ref={orbitRef} enablePan={false} enableDamping dampingFactor={0.06} rotateSpeed={0.7} />
                        <ambientLight intensity={0.8} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <ContactShadows position={[0, -2, 0]} opacity={0.3} scale={12} blur={2.5} far={4} />
                        <Cube ref={cubeRef} onMove={handleMove} />
                        <EffectComposer>
                            <Bloom luminanceThreshold={1.1} intensity={0.2} radius={0.1} />
                        </EffectComposer>
                    </Canvas>
                </div>

                {/* RIGHT SIDEBAR */}
                <IonMenu contentId="main" side="end" className="ion-no-border">
                    <IonHeader className="ion-no-border">
                        <div style={{ padding: "30px 25px 15px", background: "#25262b" }}>
                            <h2 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Step Guide</h2>
                            <div style={progressBarContainer}>
                                <div style={{ ...progressBarFill, width: `${(completedSteps.length / STEPS.length) * 100}%` }}></div>
                            </div>
                        </div>
                    </IonHeader>

                    <IonContent className="ion-padding" style={{ "--background": "#25262b" } as any}>
                        {STEPS.map((step) => {
                            const isActive = activeStep === step.id;
                            const isDone = completedSteps.includes(step.id);
                            return (
                                <div key={step.id} onClick={() => setActiveStep(step.id)} style={{ ...(isActive ? stepActiveStyle : stepCollapsedStyle), background: isDone && !isActive ? "transparent" : isActive ? "#2c2e33" : "transparent" }}>
                                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCompletedSteps(prev => prev.includes(step.id) ? prev.filter(s => s !== step.id) : [...prev, step.id]);
                                            }}
                                            style={{ ...circleStyle, background: isDone ? "#40c057" : "transparent", borderColor: isDone ? "#40c057" : "#5c5f66" }}
                                        >
                                            {isDone && <span style={{ color: "#fff", fontSize: "10px" }}>✓</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.65rem", color: isDone ? "#40c057" : isActive ? "#4dabf7" : "#c1c2c5", fontWeight: "800" }}>
                                                {step.id} {step.title.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div style={{ marginTop: "15px" }}>
                                            <p style={detailTextStyle}>{step.detail}</p>
                                            <div style={algoContainerStyle}>
                                                <button onClick={(e) => { e.stopPropagation(); cubeRef.current?.executeSequence(step.algo); }} style={applyButtonStyle}>RUN SEQUENCE</button>
                                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                                                    {step.algo.map((a, i) => <span key={i} style={badgeStyle}>{a}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </IonContent>
                </IonMenu>
            </IonSplitPane>
        </IonApp>
    );
};

// --- ADDITIONAL SUCCESS STYLES ---
const successOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(20, 21, 23, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
};

const successCardStyle: React.CSSProperties = {
    background: '#25262b',
    padding: '40px',
    borderRadius: '24px',
    textAlign: 'center',
    border: '1px solid #373a40',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    maxWidth: '320px',
    width: '90%',
};

const trophyCircleStyle: React.CSSProperties = {
    width: '80px', height: '80px',
    background: 'rgba(255, 212, 59, 0.1)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
    border: '2px solid #ffd43b'
};

const finalStatsRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    background: '#1a1b1e',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '25px',
    border: '1px solid #373a40'
};

const playAgainBtnStyle: React.CSSProperties = {
    background: '#4dabf7',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%',
    boxShadow: '0 4px 15px rgba(77, 171, 247, 0.3)'
};

// --- PRE-EXISTING REFACTORED STYLES ---
const logoIconStyle: React.CSSProperties = { width: '42px', height: '42px', background: 'rgba(77, 171, 247, 0.1)', border: '2px solid #4dabf7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(77, 171, 247, 0.15)' };
const logoTextStyle: React.CSSProperties = { margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px', lineHeight: '0.9' };
const logoSubStyle: React.CSSProperties = { margin: '6px 0 0 0', fontSize: '0.6rem', fontWeight: '800', color: '#74c0fc', textTransform: 'uppercase', letterSpacing: '1.5px' };
const statsCardStyle: React.CSSProperties = { background: "#1a1b1e", padding: "18px", borderRadius: "12px", border: "1px solid #373a40" };
const miniLabel: React.CSSProperties = { fontSize: "0.55rem", letterSpacing: "1px", color: "#5c5f66", fontWeight: "bold", marginBottom: "4px" };
const statsValueStyle: React.CSSProperties = { color: "#fff", margin: 0, fontWeight: "600", fontSize: "1.4rem" };
const dividerStyle: React.CSSProperties = { width: "1px", height: "30px", background: "#373a40" };
const primaryBtnStyle = { marginTop: "20px", "--background": "#4dabf7", "--color": "#fff", "--border-radius": "10px", height: "48px", fontWeight: "bold" };
const resetBtnStyle = { marginTop: "5px", "--color": "#909296", fontSize: "0.7rem" };
const guideBoxStyle: React.CSSProperties = { background: "#1a1b1e", padding: "22px 18px", borderRadius: "16px", marginTop: "25px", border: "1px solid #373a40" };
const guideTitleStyle: React.CSSProperties = { fontSize: "0.75rem", color: "#c1c2c5", fontWeight: "800" };
const controlGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const controlItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: "10px" };
const bigKeyCap: React.CSSProperties = { background: "#2c2e33", color: "#fff", width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "800", border: "1px solid #373a40", boxShadow: "0 3px 0 #141517" };
const keyText: React.CSSProperties = { fontSize: "0.75rem", color: "#c1c2c5", fontWeight: "500", margin: 0 };
const shiftNote: React.CSSProperties = { marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #373a40", textAlign: "center" };
const shiftKeyCap: React.CSSProperties = { background: "#4dabf7", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "0.6rem", fontWeight: "bold", display: "inline-block" };
const shiftSubStyle: React.CSSProperties = { fontSize: "0.65rem", color: "#909296", margin: "5px 0 0 0" };
const stepActiveStyle: React.CSSProperties = { borderRadius: "12px", padding: "20px", border: "1px solid #373a40", marginBottom: "10px" };
const stepCollapsedStyle: React.CSSProperties = { padding: "16px 20px", borderBottom: "1px solid #2c2e33", cursor: "pointer" };
const circleStyle: React.CSSProperties = { width: "18px", height: "18px", borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const detailTextStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#909296", lineHeight: "1.5", margin: "0 0 15px 0" };
const algoContainerStyle: React.CSSProperties = { background: "#1a1b1e", padding: "15px", borderRadius: "10px", border: "1px solid #373a40" };
const badgeStyle: React.CSSProperties = { background: "#2c2e33", padding: "5px 9px", borderRadius: "5px", fontSize: "0.75rem", color: "#fff", border: "1px solid #373a40" };
const applyButtonStyle: React.CSSProperties = { background: '#4dabf7', border: 'none', borderRadius: '8px', padding: '12px', width: '100%', fontSize: '0.75rem', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(77, 171, 247, 0.2)' };
const progressBarContainer: React.CSSProperties = { width: "100%", height: "4px", background: "#373a40", borderRadius: "10px", marginTop: "12px" };
const progressBarFill: React.CSSProperties = { height: "100%", background: "#40c057", borderRadius: "10px", transition: "0.5s" };

export default App;