import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  navy:      "#0F1C2E",
  navyMid:   "#1A2D44",
  navyLight: "#243B55",
  vellum:    "#FBF5E0",
  ivory:     "#FFF8E7",
  gold:      "#C9922A",
  goldLight: "#E0AE50",
  goldPale:  "#F5E4B8",
  ink:       "#1C1C1C",
  muted:     "#7A7060",
  border:    "#D4C49A",
  red:       "#C0392B",
  green:     "#1D6B44",
  white:     "#FFFFFF",
};
const FONT = "'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const PAYPAL_LINK = "https://www.paypal.com/paypalme/matjudah"; // ← update to your PayPal.me
const KOFI_LINK   = "https://ko-fi.com/pstrmatjudah";
const AMAZON_LINK = "https://www.amazon.com/author/matjudah";   // ← update to your author page
const LINKEDIN    = "https://linkedin.com/in/mat-judah-real";

const TRIAL_DAYS  = 7;
const LIFETIME_PRICE = "10.99";

const BIBLE_VERSIONS = [
  { id:"NIV",  name:"New International Version",  pro:false },
  { id:"KJV",  name:"King James Version",          pro:false },
  { id:"ESV",  name:"English Standard Version",    pro:true  },
  { id:"NLT",  name:"New Living Translation",      pro:true  },
  { id:"NKJV", name:"New King James Version",      pro:true  },
  { id:"AMP",  name:"Amplified Bible",             pro:true  },
  { id:"MSG",  name:"The Message",                 pro:true  },
  { id:"CSB",  name:"Christian Standard Bible",    pro:true  },
];

const TOPICS = [
  "Faith","Strength","Peace","Purpose","Hope","Courage",
  "Wisdom","Grace","Love","Prayer","Provision","Healing",
  "Identity in Christ","Spiritual Warfare","Gratitude","Obedience",
  "Forgiveness","Family","Business & Work","Perseverance",
];

const BOOKS = [
  {
    title:"Warrior's Prayer Journal",
    subtitle:"For Men · Spiritual Warfare Edition",
    desc:"60 days of scripture-backed declarations, reflection prompts, and prayer frameworks for the man of God.",
    badge:"Men", badgeColor:"#1A2D44", emoji:"📖",
    asin:"PLACEHOLDER", // replace with real ASIN
  },
  {
    title:"Women of the Word",
    subtitle:"Prayer & Devotional Journal",
    desc:"A guided 90-day journal for women to anchor their daily walk in scripture, prayer, and purpose.",
    badge:"Women", badgeColor:"#6B3A5E", emoji:"✨",
    asin:"PLACEHOLDER",
  },
  {
    title:"Teen Prayer Journal",
    subtitle:"Faith for the Next Generation",
    desc:"Daily prompts, scripture memorisation pages, and prayers designed for teenagers navigating life with God.",
    badge:"Teens", badgeColor:"#1D5C6B", emoji:"🙏",
    asin:"PLACEHOLDER",
  },
  {
    title:"Couples Prayer Journal",
    subtitle:"Building Your Home on the Word",
    desc:"Side-by-side daily devotions and prayer points for couples committed to growing together in faith.",
    badge:"Couples", badgeColor:"#5C3A1D", emoji:"💑",
    asin:"PLACEHOLDER",
  },
];

// ─────────────────────────────────────────────
// LICENSE / TRIAL HELPERS  (localStorage)
// ─────────────────────────────────────────────
const LS_KEY = "sm_license_v2";

function getLicense() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveLicense(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

function getAccessStatus() {
  const lic = getLicense();
  if (lic.lifetime) return { type:"lifetime", isPro:true, trialDaysLeft:0 };
  if (lic.trialStart) {
    const elapsed = (Date.now() - lic.trialStart) / 86400000;
    const left = Math.max(0, TRIAL_DAYS - Math.floor(elapsed));
    return { type:"trial", isPro: left > 0, trialDaysLeft: left };
  }
  return { type:"none", isPro:false, trialDaysLeft:0 };
}

function startTrial() {
  saveLicense({ trialStart: Date.now() });
}

function activateLifetime() {
  saveLicense({ lifetime: true, activatedAt: Date.now() });
}

// ─────────────────────────────────────────────
// CLAUDE API HELPER
// ─────────────────────────────────────────────
async function callClaude(system, userMsg) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role:"user", content:userMsg }],
    }),
  });
  const data = await res.json();
  return (data.content||[]).map(b=>b.text||"").join("").trim();
}

// ─────────────────────────────────────────────
// SMALL UI COMPONENTS
// ─────────────────────────────────────────────
function Btn({ children, onClick, disabled, style={}, variant="gold", size="md" }) {
  const pad = { sm:"7px 14px", md:"11px 24px", lg:"14px 32px" }[size];
  const fs  = size==="sm" ? "12px" : "14px";
  const vars = {
    gold:  { background:C.gold,     color:C.ivory  },
    dark:  { background:C.navy,     color:C.ivory  },
    ghost: { background:"transparent", color:C.muted, border:`1px solid ${C.border}` },
    pro:   { background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, color:C.ivory },
    paypal:{ background:"#003087",  color:C.white  },
    green: { background:C.green,    color:C.white  },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:pad, border:"none", borderRadius:"8px",
      fontFamily:FONT, fontSize:fs, fontWeight:"600",
      cursor:disabled?"not-allowed":"pointer",
      letterSpacing:"0.04em", opacity:disabled?0.5:1,
      display:"inline-flex", alignItems:"center", gap:"6px",
      transition:"opacity 0.2s",
      ...vars[variant], ...style,
    }}>{children}</button>
  );
}

function Tag({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 14px", borderRadius:"20px",
      border:`1px solid ${active?C.gold:C.border}`,
      background:active?C.goldPale:"transparent",
      color:active?C.navy:C.muted,
      fontSize:"13px", cursor:"pointer", fontFamily:FONT,
      fontWeight:active?"700":"400", transition:"all 0.15s",
    }}>{children}</button>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"26px 0 18px" }}>
      <div style={{ flex:1, height:"1px", background:C.border }}/>
      <span style={{ fontSize:"11px", color:C.muted, letterSpacing:"0.2em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:"1px", background:C.border }}/>
    </div>
  );
}

function NavRow({ current, total, onPrev, onNext }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"4px" }}>
      <Btn variant="ghost" size="sm" onClick={onPrev}>← Prev</Btn>
      <span style={{ fontSize:"13px", color:C.muted }}>{current+1} / {total}</span>
      <Btn variant="ghost" size="sm" onClick={onNext}>Next →</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRO UPGRADE MODAL
// ─────────────────────────────────────────────
function ProModal({ access, onClose, onActivate }) {
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function redeem() {
    // In production: verify against your backend / PayPal webhook
    if (code.trim().toUpperCase() === "MATJUDAH") {
      onActivate(); return;
    }
    setError("Code not recognised. Purchase via PayPal below.");
  }

  const trialActive = access.type === "trial" && access.isPro;
  const trialExpired = access.type === "trial" && !access.isPro;

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(5,10,18,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9999, padding:"16px",
    }}>
      <div style={{
        background:C.vellum, borderRadius:"18px", maxWidth:"460px", width:"100%",
        padding:"32px 26px", border:`2px solid ${C.gold}`,
        boxShadow:"0 20px 70px rgba(0,0,0,0.6)", maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"22px" }}>
          <div style={{ fontSize:"36px", marginBottom:"8px" }}>✦</div>
          <h2 style={{ margin:"0 0 6px", fontSize:"22px", color:C.navy, fontFamily:FONT }}>
            {trialExpired ? "Your free trial has ended" : "Upgrade to Lifetime Pro"}
          </h2>
          <p style={{ margin:0, color:C.muted, fontSize:"13px", lineHeight:"1.6" }}>
            {trialExpired
              ? "You've experienced the full power of Scripture Memoriser. Keep it forever."
              : "Pay once. Own it forever. No monthly fees, ever."}
          </p>
        </div>

        {/* Trial status banner */}
        {trialActive && (
          <div style={{ background:"#E8F5E9", border:"1px solid #1D6B44", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", textAlign:"center" }}>
            <span style={{ color:C.green, fontSize:"13px", fontWeight:"700" }}>
              ✓ Free trial active — {access.trialDaysLeft} day{access.trialDaysLeft!==1?"s":""} remaining
            </span>
          </div>
        )}

        {/* Pricing hero */}
        <div style={{
          background:C.navy, borderRadius:"12px", padding:"22px", textAlign:"center", marginBottom:"18px",
        }}>
          <div style={{ fontSize:"12px", color:C.goldLight, letterSpacing:"0.2em", marginBottom:"8px" }}>LIFETIME ACCESS</div>
          <div style={{ fontSize:"48px", fontWeight:"700", color:C.white, lineHeight:"1" }}>$10<span style={{ fontSize:"28px" }}>.99</span></div>
          <div style={{ fontSize:"13px", color:"#8899AA", marginTop:"6px" }}>One payment · All future updates included</div>
        </div>

        {/* Feature list */}
        <div style={{ background:C.ivory, borderRadius:"10px", padding:"16px", marginBottom:"18px" }}>
          {[
            [true, "All 8 Bible versions (ESV, NLT, NKJV, AMP, MSG, CSB + free NIV & KJV)"],
            [true, "AI Prayer Point generator for every verse"],
            [true, "Unlimited topic-based scripture packs"],
            [true, "All future features — free forever"],
            [false, "Free: NIV & KJV only"],
            [false, "Free: Memorise & Quiz only"],
          ].map(([inc,txt],i)=>(
            <div key={i} style={{ display:"flex", gap:"10px", marginBottom:i<5?"8px":"0",
              fontSize:"13px", color:inc?C.green:C.muted }}>
              <span style={{ fontWeight:"700", minWidth:"16px" }}>{inc?"✓":"✗"}</span>
              <span>{txt}</span>
            </div>
          ))}
        </div>

        {/* PayPal button */}
        <a href={`${PAYPAL_LINK}/10.99USD`} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textDecoration:"none", marginBottom:"10px" }}>
          <div style={{
            background:"#003087", borderRadius:"9px", padding:"14px",
            textAlign:"center", cursor:"pointer",
          }}>
            <div style={{ color:C.white, fontFamily:FONT, fontSize:"15px", fontWeight:"700" }}>
              Pay $10.99 via PayPal →
            </div>
            <div style={{ color:"#A0B8D8", fontSize:"12px", marginTop:"4px" }}>
              Secure · Worldwide · One-time payment
            </div>
          </div>
        </a>

        {/* PayPal instruction */}
        <div style={{ background:"#EEF4FF", border:"1px solid #B0C4DE", borderRadius:"8px", padding:"12px 14px", marginBottom:"16px", fontSize:"12px", color:"#2C3E6B", lineHeight:"1.7" }}>
          <strong>After paying:</strong> Send your PayPal email to <strong>matjudah@gmail.com</strong> and you'll receive your unlock code within 24 hours. Or enter it below if you already have one.
        </div>

        {/* Promo/unlock code */}
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"12px", color:C.muted, marginBottom:"6px" }}>Already have an unlock code?</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <input value={code} onChange={e=>{ setCode(e.target.value); setError(""); }}
              placeholder="Enter unlock code"
              style={{ flex:1, padding:"9px 12px", border:`1px solid ${error?C.red:C.border}`,
                borderRadius:"7px", fontFamily:FONT, fontSize:"13px", color:C.ink, background:C.ivory }}
            />
            <Btn onClick={redeem} size="sm" variant="dark">Unlock</Btn>
          </div>
          {error && <p style={{ fontSize:"12px", color:C.red, marginTop:"6px" }}>{error}</p>}
        </div>

        <Btn variant="ghost" onClick={onClose}
          style={{ width:"100%", justifyContent:"center", marginBottom:"10px" }}>
          {trialActive ? `Continue free trial (${access.trialDaysLeft} days left)` : "Continue with Free"}
        </Btn>

        <p style={{ textAlign:"center", fontSize:"11px", color:C.muted, marginBottom:0 }}>
          No subscriptions · No auto-renewals · Supports independent Christian ministry
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ONBOARDING / WELCOME SCREEN
// ─────────────────────────────────────────────
function Welcome({ onStart, access, onShowPro }) {
  const [version,     setVersion]     = useState("NIV");
  const [topic,       setTopic]       = useState("");
  const [customTopic, setCustomTopic] = useState("");

  const canStart = version && (topic || customTopic.trim());

  return (
    <div style={{
      minHeight:"100vh", background:C.navy,
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"24px", fontFamily:FONT,
    }}>
      {/* Brand */}
      <div style={{ fontSize:"38px", color:C.gold, marginBottom:"8px" }}>✦</div>
      <h1 style={{ margin:"0 0 4px", color:C.ivory, fontSize:"30px", fontWeight:"700" }}>Scripture Memoriser</h1>
      <p style={{ margin:"0 0 4px", color:"#8899AA", fontSize:"13px", letterSpacing:"0.15em", textTransform:"uppercase" }}>by Mat Judah</p>
      <p style={{ margin:"0 0 28px", color:C.goldLight, fontSize:"14px", fontStyle:"italic" }}>
        "Thy word have I hid in mine heart" — Psalm 119:11 KJV
      </p>

      {/* Trial / Pro status banner */}
      {access.type==="none" && (
        <div style={{
          background:C.navyLight, border:`1px solid ${C.gold}`, borderRadius:"10px",
          padding:"14px 20px", marginBottom:"22px", maxWidth:"500px", width:"100%",
          textAlign:"center", cursor:"pointer",
        }} onClick={onShowPro}>
          <div style={{ color:C.ivory, fontSize:"14px", fontWeight:"600" }}>
            🎁 Start your <span style={{ color:C.goldLight }}>7-day free trial</span> — full Pro access
          </div>
          <div style={{ color:"#6A8099", fontSize:"12px", marginTop:"4px" }}>
            Then $10.99 once for lifetime access. No subscriptions.
          </div>
        </div>
      )}
      {access.type==="trial" && access.isPro && (
        <div style={{
          background:"#0D2E1A", border:"1px solid #1D6B44", borderRadius:"10px",
          padding:"12px 20px", marginBottom:"22px", maxWidth:"500px", width:"100%", textAlign:"center",
        }}>
          <span style={{ color:"#4CAF50", fontSize:"13px", fontWeight:"700" }}>
            ✓ Free trial active · {access.trialDaysLeft} day{access.trialDaysLeft!==1?"s":""} remaining
          </span>
        </div>
      )}
      {access.type==="lifetime" && (
        <div style={{
          background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,
          border:`1px solid ${C.gold}`, borderRadius:"10px",
          padding:"12px 20px", marginBottom:"22px", maxWidth:"500px", width:"100%", textAlign:"center",
        }}>
          <span style={{ color:C.goldLight, fontSize:"13px", fontWeight:"700" }}>✦ Lifetime Pro · All features unlocked</span>
        </div>
      )}

      {/* Setup card */}
      <div style={{
        width:"100%", maxWidth:"500px", background:C.vellum,
        borderRadius:"16px", padding:"26px 22px",
        boxShadow:"0 16px 60px rgba(0,0,0,0.45)",
      }}>

        {/* Bible version */}
        <p style={{ margin:"0 0 10px", fontWeight:"700", color:C.navy, fontSize:"14px", letterSpacing:"0.04em" }}>
          Choose your Bible version
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"22px" }}>
          {BIBLE_VERSIONS.map(v => {
            const locked = v.pro && !access.isPro;
            const sel    = version===v.id;
            return (
              <button key={v.id} onClick={()=> locked ? onShowPro() : setVersion(v.id)}
                style={{
                  padding:"10px 12px", border:`2px solid ${sel?C.gold:C.border}`,
                  borderRadius:"9px", background:locked?"#F0EAD8": sel?C.goldPale:C.ivory,
                  cursor:"pointer", fontFamily:FONT, textAlign:"left", opacity:locked?0.75:1,
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:"700", fontSize:"14px", color:locked?C.muted:C.navy }}>{v.id}</span>
                  {locked && <span style={{ fontSize:"10px", color:C.gold, fontWeight:"700", letterSpacing:"0.05em" }}>PRO</span>}
                  {!locked && sel && <span style={{ fontSize:"14px", color:C.gold }}>✓</span>}
                </div>
                <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px", lineHeight:"1.3" }}>{v.name}</div>
              </button>
            );
          })}
        </div>

        {/* Topic */}
        <p style={{ margin:"0 0 10px", fontWeight:"700", color:C.navy, fontSize:"14px", letterSpacing:"0.04em" }}>
          What do you want to study?
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", marginBottom:"12px" }}>
          {TOPICS.map(t=>(
            <Tag key={t} active={topic===t} onClick={()=>{ setTopic(t); setCustomTopic(""); }}>{t}</Tag>
          ))}
        </div>
        <input placeholder="Or type your own topic…" value={customTopic}
          onChange={e=>{ setCustomTopic(e.target.value); setTopic(""); }}
          style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:"7px",
            fontFamily:FONT, fontSize:"13px", color:C.ink, background:C.ivory,
            boxSizing:"border-box", marginBottom:"20px" }}
        />

        <Btn onClick={()=>onStart(version, topic||customTopic.trim())}
          disabled={!canStart}
          style={{ width:"100%", justifyContent:"center", fontSize:"15px", padding:"13px" }}>
          Open the Word →
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [screen,       setScreen]       = useState("welcome");
  const [bibleVersion, setBibleVersion] = useState("NIV");
  const [topic,        setTopic]        = useState("");
  const [scriptures,   setScriptures]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [current,      setCurrent]      = useState(0);
  const [tab,          setTab]          = useState("memorise");
  const [access,       setAccess]       = useState(getAccessStatus());
  const [showPro,      setShowPro]      = useState(false);

  // Memorise
  const [revealed,     setRevealed]     = useState(new Set());
  // Quiz
  const [quizMode,     setQuizMode]     = useState("fill");
  const [cardFlipped,  setCardFlipped]  = useState(false);
  const [userInput,    setUserInput]    = useState("");
  const [checked,      setChecked]      = useState(false);
  const [score,        setScore]        = useState({ correct:0, total:0 });
  // Prayer
  const [prayer,       setPrayer]       = useState("");
  const [prayLoading,  setPrayLoading]  = useState(false);
  const [prayGlow,     setPrayGlow]     = useState(false);
  // Load more
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [newTopic,     setNewTopic]     = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  // Donation
  const [donAmt,       setDonAmt]       = useState("10");

  const scripture = scriptures[current];
  const words     = scripture ? scripture.text.split(" ") : [];

  // Refresh access status when Pro modal closes
  const refreshAccess = useCallback(()=> setAccess(getAccessStatus()), []);

  // ── Load scriptures ──────────────────────────────────
  async function loadVerses(version, topicStr, count=10) {
    setLoading(true);
    try {
      const raw = await callClaude(
        `You are a biblical scholar. Return ONLY a valid JSON array, no markdown, no explanation.
Each element: {"ref":"Book Ch:V","text":"verse text in the ${version} translation"}.
Use exact wording of the ${version} Bible.`,
        `Give ${count} well-known Bible verses about "${topicStr}" in ${version}.
Mix Old and New Testament. Return only the JSON array.`
      );
      const cleaned = raw.replace(/```json|```/g,"").trim();
      return JSON.parse(cleaned).filter(s=>s.ref&&s.text);
    } catch { return []; }
    finally { setLoading(false); }
  }

  async function handleStart(version, topicStr) {
    setBibleVersion(version); setTopic(topicStr);
    setScreen("loading");
    // Auto-start trial on first use
    const a = getAccessStatus();
    if (a.type==="none") { startTrial(); setAccess(getAccessStatus()); }
    const verses = await loadVerses(version, topicStr);
    if (verses.length) {
      setScriptures(verses); setCurrent(0); resetVerse();
      setScore({ correct:0, total:0 }); setScreen("main");
    } else { setScreen("welcome"); alert("Could not load scriptures — please try again."); }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    const t = newTopic.trim()||topic;
    const more = await loadVerses(bibleVersion, t, 8);
    if (more.length) {
      const existing = new Set(scriptures.map(s=>s.ref));
      setScriptures(p=>[...p, ...more.filter(s=>!existing.has(s.ref))]);
      setNewTopic(""); setShowAdd(false);
    }
    setLoadingMore(false);
  }

  function resetVerse() {
    setRevealed(new Set()); setCardFlipped(false);
    setUserInput(""); setChecked(false);
    setPrayer(""); setPrayGlow(false);
  }

  function go(dir) {
    setCurrent(c=>(c+dir+scriptures.length)%scriptures.length);
    resetVerse();
  }

  // ── Prayer ────────────────────────────────────────────
  async function generatePrayer() {
    if (!access.isPro) { setShowPro(true); return; }
    setPrayLoading(true); setPrayer(""); setPrayGlow(false);
    try {
      const text = await callClaude(
        `You are a devout Christian prayer writer. Rules:
- Address God at the start (Father / Lord / Heavenly Father etc.)
- Echo the exact language and promises of the verse
- Keep it to exactly 2–3 sentences — short and powerful
- End with either "in Jesus' mighty name, Amen." or "in the name of Jesus, Amen." (vary naturally)
- Return ONLY the prayer text, nothing else`,
        `Scripture (${bibleVersion}): ${scripture.ref} — "${scripture.text}"\n\nWrite a short prayer point.`
      );
      setPrayer(text); setPrayGlow(true);
      setTimeout(()=>setPrayGlow(false), 3500);
    } catch { setPrayer("Unable to generate prayer. Please try again."); }
    setPrayLoading(false);
  }

  // ── Quiz ──────────────────────────────────────────────
  function checkAnswer() {
    setChecked(true);
    const clean = s=>s.toLowerCase().replace(/[^a-z\s]/g,"").trim();
    const ok = clean(userInput)===clean(scripture.text);
    setScore(s=>({ correct:s.correct+(ok?1:0), total:s.total+1 }));
  }

  // ── Masked words ──────────────────────────────────────
  const masked = words.map((w,i)=>{
    if (revealed.has(i)) return w;
    const letters = w.replace(/[^a-zA-Z]/g,"");
    const punct   = (w.match(/[^a-zA-Z]+$/)||[""])[0];
    return "_".repeat(letters.length)+punct;
  });

  const accuracy = score.total>0 ? Math.round(score.correct/score.total*100) : null;

  // ── Tab style ─────────────────────────────────────────
  const tabStyle = t => ({
    padding:"11px 16px", border:"none",
    borderBottom:`3px solid ${tab===t?C.gold:"transparent"}`,
    background:"transparent",
    color:tab===t?C.goldLight:"#5A7490",
    fontFamily:FONT, fontSize:"13px",
    fontWeight:tab===t?"700":"400",
    cursor:"pointer", letterSpacing:"0.04em", whiteSpace:"nowrap",
  });

  // ── LOADING ───────────────────────────────────────────
  if (screen==="loading") return (
    <div style={{ minHeight:"100vh", background:C.navy, display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:FONT, gap:"14px" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:"44px", color:C.gold, animation:"spin 3s linear infinite" }}>✦</div>
      <p style={{ color:C.ivory, fontSize:"16px", margin:0 }}>Loading <em>{topic}</em>…</p>
      <p style={{ color:"#5A7490", fontSize:"13px", margin:0 }}>{bibleVersion} translation</p>
    </div>
  );

  // ── WELCOME ───────────────────────────────────────────
  if (screen==="welcome") return (
    <>
      <Welcome onStart={handleStart} access={access}
        onShowPro={()=>setShowPro(true)} />
      {showPro && (
        <ProModal access={access} onClose={()=>{ setShowPro(false); refreshAccess(); }}
          onActivate={()=>{ activateLifetime(); refreshAccess(); setShowPro(false); }} />
      )}
    </>
  );

  // ── MAIN APP ──────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.vellum, fontFamily:FONT, color:C.ink }}>
      <style>{`
        @keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,146,42,0)}50%{box-shadow:0 0 32px 10px rgba(201,146,42,0.3)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.35s ease both}
        .glow-pulse{animation:goldPulse 2.5s ease-in-out 3}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${C.gold};border-radius:3px}
      `}</style>

      {showPro && (
        <ProModal access={access}
          onClose={()=>{ setShowPro(false); refreshAccess(); }}
          onActivate={()=>{ activateLifetime(); refreshAccess(); setShowPro(false); }} />
      )}

      {/* HEADER */}
      <div style={{ background:C.navy, borderBottom:`3px solid ${C.gold}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:"640px", margin:"0 auto", padding:"14px 18px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"10px", color:C.gold, letterSpacing:"0.3em", textTransform:"uppercase" }}>✦ Mat Judah</div>
              <h1 style={{ margin:"3px 0 2px", color:C.ivory, fontSize:"18px", fontWeight:"700" }}>Scripture Memoriser</h1>
              <div style={{ fontSize:"11px", color:"#5A7490" }}>
                {topic} · {bibleVersion} · {scriptures.length} verses
                {access.type==="lifetime" && <span style={{ color:C.goldLight, marginLeft:"8px", fontWeight:"700" }}>✦ Lifetime</span>}
                {access.type==="trial" && access.isPro && <span style={{ color:"#4CAF50", marginLeft:"8px" }}>Trial: {access.trialDaysLeft}d left</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {!access.isPro && (
                <Btn size="sm" variant="pro" onClick={()=>setShowPro(true)}>Upgrade $10.99</Btn>
              )}
              {access.type==="trial" && access.isPro && (
                <Btn size="sm" variant="gold" onClick={()=>setShowPro(true)}>Get Lifetime</Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={()=>setScreen("welcome")} style={{ fontSize:"11px", padding:"6px 10px" }}>✦</Btn>
            </div>
          </div>
          {score.total>0 && (
            <div style={{ fontSize:"11px", color:C.goldLight, marginBottom:"8px" }}>
              Quiz: {score.correct}/{score.total} · {accuracy}%
            </div>
          )}
          {/* Tabs */}
          <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
            {["memorise","quiz","prayer","books","give"].map(t=>(
              <button key={t} style={tabStyle(t)} onClick={()=>setTab(t)}>
                {({memorise:"Memorise",quiz:"Quiz Me",prayer:"Prayer",books:"Books",give:"Give ♥"})[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"20px 16px 60px" }}>

        {/* Scripture selector bar */}
        {["memorise","quiz","prayer"].includes(tab) && (
          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            <select value={current} onChange={e=>{ setCurrent(Number(e.target.value)); resetVerse(); }}
              style={{ flex:1, padding:"9px 12px", background:C.ivory, border:`1px solid ${C.border}`,
                borderRadius:"7px", fontFamily:FONT, fontSize:"13px", color:C.navy }}>
              {scriptures.map((s,i)=><option key={i} value={i}>{s.ref}</option>)}
            </select>
            <Btn variant="ghost" size="sm" onClick={()=>setShowAdd(!showAdd)}>+ More</Btn>
          </div>
        )}

        {/* Load more verses panel */}
        {showAdd && (
          <div style={{ background:C.ivory, border:`1px solid ${C.border}`, borderRadius:"10px",
            padding:"16px", marginBottom:"16px" }}>
            <p style={{ margin:"0 0 10px", fontWeight:"700", color:C.navy, fontSize:"13px" }}>Add more verses</p>
            <input placeholder={`Same topic (${topic}) or a new one…`}
              value={newTopic} onChange={e=>setNewTopic(e.target.value)}
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:"7px",
                fontFamily:FONT, fontSize:"13px", color:C.ink, background:C.vellum,
                boxSizing:"border-box", marginBottom:"10px" }}
            />
            <Btn onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore?"Loading…":`Load 8 more (${bibleVersion})`}
            </Btn>
          </div>
        )}

        {/* ── MEMORISE ── */}
        {tab==="memorise" && scripture && (
          <div className="fade-up">
            <div style={{ background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:"14px",
              padding:"24px", marginBottom:"18px", boxShadow:"0 2px 18px rgba(201,146,42,0.08)" }}>
              <div style={{ fontSize:"11px", letterSpacing:"0.25em", color:C.gold, textTransform:"uppercase", marginBottom:"14px" }}>
                {scripture.ref} · {bibleVersion}
              </div>
              <p style={{ fontSize:"19px", lineHeight:"1.9", margin:0, color:C.navy }}>
                {masked.map((w,i)=>(
                  <span key={i}>
                    <span onClick={()=>!revealed.has(i)&&setRevealed(r=>new Set([...r,i]))}
                      title={revealed.has(i)?"":"Tap to reveal"}
                      style={{
                        cursor:revealed.has(i)?"default":"pointer",
                        color:revealed.has(i)?C.navy:C.gold,
                        borderBottom:revealed.has(i)?"none":`2px dotted ${C.goldLight}`,
                        fontStyle:revealed.has(i)?"normal":"italic",
                      }}>{w}</span>
                    {i<words.length-1?" ":""}
                  </span>
                ))}
              </p>
            </div>
            <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
              <Btn onClick={()=>setRevealed(new Set(words.map((_,i)=>i)))}>Reveal all</Btn>
              <Btn variant="ghost" onClick={()=>setRevealed(new Set())}>Hide all</Btn>
            </div>
            <NavRow current={current} total={scriptures.length} onPrev={()=>go(-1)} onNext={()=>go(1)}/>
          </div>
        )}

        {/* ── QUIZ ── */}
        {tab==="quiz" && scripture && (
          <div className="fade-up">
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
              {["fill","cards"].map(m=>(
                <button key={m} onClick={()=>{ setQuizMode(m); resetVerse(); }} style={{
                  padding:"8px 18px", border:"none", borderRadius:"7px",
                  background:quizMode===m?C.gold:"#E8DFC8",
                  color:quizMode===m?C.ivory:C.navy,
                  fontFamily:FONT, fontSize:"13px",
                  fontWeight:quizMode===m?"700":"400", cursor:"pointer",
                }}>
                  {m==="fill"?"Type it out":"Flash cards"}
                </button>
              ))}
            </div>

            {quizMode==="fill" && (
              <div>
                <div style={{ background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:"12px",
                  padding:"20px", marginBottom:"14px" }}>
                  <div style={{ fontSize:"11px", color:C.gold, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"10px" }}>
                    {scripture.ref}
                  </div>
                  <textarea value={userInput} onChange={e=>setUserInput(e.target.value)}
                    placeholder="Type the verse from memory…" rows={4} disabled={checked}
                    style={{ width:"100%", padding:"10px", border:`1px solid ${C.border}`, borderRadius:"7px",
                      fontFamily:FONT, fontSize:"14px", color:C.ink, background:C.vellum,
                      resize:"none", boxSizing:"border-box" }}
                  />
                </div>
                {!checked
                  ? <Btn onClick={checkAnswer} disabled={!userInput.trim()}>Check answer</Btn>
                  : (
                    <div>
                      <div style={{ background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:"10px",
                        padding:"16px", marginBottom:"12px" }}>
                        <div style={{ fontSize:"11px", color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Correct verse</div>
                        <p style={{ margin:0, color:C.navy, lineHeight:"1.8", fontStyle:"italic" }}>{scripture.text}</p>
                      </div>
                      <Btn variant="dark" onClick={()=>{ resetVerse(); go(1); }}>Next verse →</Btn>
                    </div>
                  )
                }
              </div>
            )}

            {quizMode==="cards" && (
              <div>
                <div onClick={()=>setCardFlipped(!cardFlipped)} style={{
                  background:cardFlipped?C.navy:C.ivory,
                  border:`2px solid ${C.gold}`, borderRadius:"14px",
                  padding:"40px 24px", textAlign:"center", cursor:"pointer",
                  minHeight:"200px", display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"background 0.3s", marginBottom:"16px",
                  boxShadow:"0 4px 24px rgba(201,146,42,0.10)",
                }}>
                  {!cardFlipped
                    ? <div>
                        <div style={{ fontSize:"11px", color:C.muted, letterSpacing:"0.2em", marginBottom:"14px" }}>REFERENCE</div>
                        <div style={{ fontSize:"26px", fontWeight:"700", color:C.gold }}>{scripture.ref}</div>
                        <div style={{ fontSize:"12px", color:C.muted, marginTop:"14px" }}>Tap to reveal verse</div>
                      </div>
                    : <div>
                        <div style={{ fontSize:"11px", color:C.goldLight, letterSpacing:"0.2em", marginBottom:"12px" }}>VERSE · {bibleVersion}</div>
                        <p style={{ fontSize:"16px", lineHeight:"1.9", color:C.ivory, margin:0, fontStyle:"italic" }}>{scripture.text}</p>
                      </div>
                  }
                </div>
                <NavRow current={current} total={scriptures.length} onPrev={()=>go(-1)} onNext={()=>go(1)}/>
              </div>
            )}
          </div>
        )}

        {/* ── PRAYER ── */}
        {tab==="prayer" && scripture && (
          <div className="fade-up">
            <div style={{ background:C.ivory, border:`1.5px solid ${C.gold}`, borderRadius:"12px",
              padding:"20px", marginBottom:"16px" }}>
              <div style={{ fontSize:"11px", color:C.gold, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"8px" }}>
                {scripture.ref} · {bibleVersion}
              </div>
              <p style={{ margin:0, lineHeight:"1.8", fontStyle:"italic", color:C.navy }}>{scripture.text}</p>
            </div>

            {!access.isPro && (
              <div style={{ background:`linear-gradient(135deg,${C.navyMid},${C.navy})`,
                borderRadius:"12px", padding:"22px", marginBottom:"16px", textAlign:"center",
                border:`1px solid ${C.gold}` }}>
                <div style={{ fontSize:"28px", marginBottom:"10px" }}>🔒</div>
                <p style={{ margin:"0 0 6px", color:C.ivory, fontSize:"15px" }}>
                  Prayer generation is a <strong style={{ color:C.goldLight }}>Pro feature</strong>
                </p>
                <p style={{ margin:"0 0 14px", color:"#5A7490", fontSize:"13px" }}>
                  $10.99 once · Lifetime access · PayPal
                </p>
                <Btn variant="pro" onClick={()=>setShowPro(true)} size="lg">Unlock for $10.99 →</Btn>
              </div>
            )}

            {access.isPro && (
              <Btn onClick={generatePrayer} disabled={prayLoading}
                style={{ width:"100%", justifyContent:"center", marginBottom:"16px", fontSize:"15px", padding:"13px" }}>
                {prayLoading?"✦ Composing prayer…":"✦ Turn into Prayer Point"}
              </Btn>
            )}

            {prayLoading && (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"30px", marginBottom:"8px", animation:"spin 2s linear infinite", display:"inline-block" }}>✦</div>
                <div style={{ fontSize:"13px", color:C.muted }}>Composing your prayer…</div>
              </div>
            )}

            {prayer && !prayLoading && (
              <div className={prayGlow?"glow-pulse":""} style={{
                background:C.navy, borderRadius:"14px", padding:"24px 20px",
                marginBottom:"16px", border:`1.5px solid ${C.gold}`,
                boxShadow:"0 4px 28px rgba(0,0,0,0.2)",
              }}>
                <div style={{ fontSize:"11px", letterSpacing:"0.25em", color:C.goldLight,
                  textTransform:"uppercase", marginBottom:"12px" }}>✦ Prayer · {scripture.ref}</div>
                <p style={{ margin:"0 0 18px", color:C.ivory, lineHeight:"2", fontSize:"15px", fontStyle:"italic" }}>{prayer}</p>
                <Btn size="sm" variant="ghost" onClick={()=>navigator.clipboard?.writeText(prayer)}
                  style={{ color:C.goldLight, borderColor:"#3A4F68" }}>Copy prayer</Btn>
              </div>
            )}

            <NavRow current={current} total={scriptures.length} onPrev={()=>go(-1)} onNext={()=>go(1)}/>
          </div>
        )}

        {/* ── BOOKS ── */}
        {tab==="books" && (
          <div className="fade-up">
            <div style={{ textAlign:"center", marginBottom:"26px" }}>
              <div style={{ fontSize:"11px", color:C.gold, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"8px" }}>Devotional Literature</div>
              <h2 style={{ margin:"0 0 8px", fontSize:"22px", color:C.navy }}>Books & Journals by Mat Judah</h2>
              <p style={{ margin:0, color:C.muted, fontSize:"14px" }}>Available on Amazon · Printed & delivered worldwide</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"24px" }}>
              {BOOKS.map((book,i)=>(
                <div key={i} style={{
                  background:C.ivory, border:`1px solid ${C.border}`, borderRadius:"12px",
                  padding:"18px", display:"flex", gap:"16px", alignItems:"flex-start",
                }}>
                  <div style={{
                    width:"58px", height:"74px", borderRadius:"6px", flexShrink:0,
                    background:`linear-gradient(160deg,${book.badgeColor},${C.navy})`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px",
                  }}>{book.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"8px", marginBottom:"3px" }}>
                      <h3 style={{ margin:0, fontSize:"15px", color:C.navy }}>{book.title}</h3>
                      <span style={{ padding:"2px 8px", background:book.badgeColor, color:C.white, fontSize:"10px", fontWeight:"700", borderRadius:"4px" }}>{book.badge}</span>
                    </div>
                    <div style={{ fontSize:"12px", color:C.gold, marginBottom:"6px", fontStyle:"italic" }}>{book.subtitle}</div>
                    <p style={{ margin:"0 0 12px", fontSize:"13px", color:C.muted, lineHeight:"1.6" }}>{book.desc}</p>
                    <a href={`https://www.amazon.com/dp/${book.asin}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-block", padding:"7px 16px", background:C.gold, color:C.ivory,
                        borderRadius:"6px", fontSize:"12px", fontWeight:"700", textDecoration:"none", fontFamily:FONT }}>
                      View on Amazon →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <Divider label="More from Mat Judah" />
            <div style={{ background:C.ivory, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"20px", textAlign:"center", marginBottom:"16px" }}>
              <div style={{ fontSize:"26px", marginBottom:"10px" }}>📚</div>
              <h3 style={{ margin:"0 0 6px", color:C.navy, fontSize:"16px" }}>More titles on the way</h3>
              <p style={{ margin:"0 0 14px", color:C.muted, fontSize:"13px" }}>
                Sermon journals, Bible study guides, and leadership devotionals in progress.
              </p>
              <a href={AMAZON_LINK} target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-block", padding:"9px 22px", background:C.navy, color:C.ivory,
                  borderRadius:"7px", fontSize:"13px", fontWeight:"700", textDecoration:"none", fontFamily:FONT }}>
                See all titles on Amazon →
              </a>
            </div>
          </div>
        )}

        {/* ── GIVE ── */}
        {tab==="give" && (
          <div className="fade-up">
            <div style={{ textAlign:"center", marginBottom:"24px" }}>
              <div style={{ fontSize:"40px", marginBottom:"10px" }}>🙏</div>
              <h2 style={{ margin:"0 0 8px", fontSize:"22px", color:C.navy }}>Support this Ministry</h2>
              <p style={{ margin:0, color:C.muted, fontSize:"14px", lineHeight:"1.7" }}>
                This app is a labour of love — free for all believers.<br/>Your gift keeps it running, maintained, and free.
              </p>
            </div>

            {/* Scripture on giving */}
            <div style={{ background:C.navy, borderRadius:"12px", padding:"18px 20px", marginBottom:"22px", textAlign:"center" }}>
              <p style={{ margin:0, color:C.ivory, lineHeight:"1.9", fontSize:"14px", fontStyle:"italic" }}>
                "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
              </p>
              <div style={{ fontSize:"12px", color:C.goldLight, marginTop:"10px", letterSpacing:"0.1em" }}>2 Corinthians 9:7 · NIV</div>
            </div>

            {/* Ko-fi donation */}
            <div style={{ background:C.ivory, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"22px", marginBottom:"16px" }}>
              <p style={{ margin:"0 0 14px", fontWeight:"700", color:C.navy, fontSize:"14px" }}>Give a one-time gift</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"14px" }}>
                {["5","10","20","50"].map(amt=>(
                  <button key={amt} onClick={()=>setDonAmt(amt)} style={{
                    padding:"12px 6px", border:`2px solid ${donAmt===amt?C.gold:C.border}`,
                    borderRadius:"8px", background:donAmt===amt?C.goldPale:C.vellum,
                    color:donAmt===amt?C.navy:C.muted,
                    fontFamily:FONT, fontSize:"16px", fontWeight:"700", cursor:"pointer",
                  }}>${amt}</button>
                ))}
              </div>
              <input type="number" placeholder="Or enter amount…"
                value={["5","10","20","50"].includes(donAmt)?"":donAmt}
                onChange={e=>setDonAmt(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:"7px",
                  fontFamily:FONT, fontSize:"14px", color:C.ink, background:C.vellum,
                  boxSizing:"border-box", marginBottom:"12px" }}
              />
              {/* Ko-fi primary */}
              <a href={KOFI_LINK} target="_blank" rel="noopener noreferrer"
                style={{ display:"block", textAlign:"center", padding:"14px", background:C.gold,
                  color:C.ivory, borderRadius:"9px", fontFamily:FONT, fontSize:"15px",
                  fontWeight:"700", textDecoration:"none", letterSpacing:"0.04em", marginBottom:"10px" }}>
                Give ${donAmt||"10"} via Ko-fi ♥
              </a>
              {/* PayPal secondary */}
              <a href={`${PAYPAL_LINK}/${donAmt||"10"}USD`} target="_blank" rel="noopener noreferrer"
                style={{ display:"block", textAlign:"center", padding:"12px", background:"#003087",
                  color:C.white, borderRadius:"9px", fontFamily:FONT, fontSize:"14px",
                  fontWeight:"700", textDecoration:"none" }}>
                Give via PayPal
              </a>
            </div>

            <Divider label="Other ways to support" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"22px" }}>
              {[
                { icon:"📖", label:"Buy a journal",       sub:"Amazon KDP",         href:AMAZON_LINK },
                { icon:"⭐", label:"Share the app",        sub:"Tell someone today",  href:"#" },
                { icon:"🔗", label:"Follow on LinkedIn",   sub:"@mat-judah-real",    href:LINKEDIN },
                { icon:"🙏", label:"Pray for this work",   sub:"That's enough",      href:"#" },
              ].map((item,i)=>(
                <a key={i} href={item.href} target={item.href!=="#"?"_blank":"_self"} rel="noopener noreferrer"
                  style={{ textDecoration:"none", background:C.ivory, border:`1px solid ${C.border}`,
                    borderRadius:"10px", padding:"16px 14px", textAlign:"center", display:"block" }}>
                  <div style={{ fontSize:"26px", marginBottom:"6px" }}>{item.icon}</div>
                  <div style={{ fontWeight:"700", fontSize:"13px", color:C.navy }}>{item.label}</div>
                  <div style={{ fontSize:"12px", color:C.muted, marginTop:"2px" }}>{item.sub}</div>
                </a>
              ))}
            </div>

            {/* Upgrade CTA in Give tab */}
            {!access.isPro && (
              <div style={{ background:`linear-gradient(135deg,${C.navyMid},${C.navy})`,
                border:`1px solid ${C.gold}`, borderRadius:"12px", padding:"20px", textAlign:"center" }}>
                <p style={{ margin:"0 0 6px", color:C.ivory, fontSize:"15px", fontWeight:"600" }}>
                  Unlock the full app for $10.99
                </p>
                <p style={{ margin:"0 0 14px", color:"#5A7490", fontSize:"13px" }}>All 8 Bible versions · AI prayer generator · Lifetime access</p>
                <Btn variant="pro" onClick={()=>setShowPro(true)}>Get Lifetime Pro →</Btn>
              </div>
            )}

            <p style={{ textAlign:"center", fontSize:"12px", color:C.muted, marginTop:"24px", lineHeight:"1.8" }}>
              Built with love by <strong>Mat Judah</strong><br/>
              Barati Prime (Pty) Ltd · Bokaa Village, Botswana
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
