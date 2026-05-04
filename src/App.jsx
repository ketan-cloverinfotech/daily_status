import { useState, useEffect, useRef } from "react";

// ------------------------------------------------------------------
// Storage key — bumped to v1 so it doesn't collide with the MoM app.
// Change if you ever break the data shape.
// ------------------------------------------------------------------
const STORAGE_KEY = "daily-status-mail-v1";

// ------------------------------------------------------------------
// Defaults — change these to match your project / reporter / lead.
// ------------------------------------------------------------------
const DEFAULT_REPORTER = "Ketan Thombare";
const DEFAULT_PROJECT  = "Alfresco Support & DevOps";
const DEFAULT_TO       = "Reporting Manager";
const DEFAULT_GREETING = "Hi sir,";
const DEFAULT_INTRO    = "Please find the daily status update below.";
const DEFAULT_CLOSING  = "Regards,\nKetan Thombare";

const DEFAULT_COMPLETED = [
  { id: 1, desc: "", ticket: "", status: "Done", remarks: "" },
];
const DEFAULT_WIP = [
  { id: 1, desc: "", ticket: "", percent: "50%", eta: "", remarks: "" },
];
const DEFAULT_TOMORROW = [
  { id: 1, desc: "", priority: "P2", remarks: "" },
];
const DEFAULT_BLOCKERS = [
  { id: 1, desc: "", waitingOn: "", since: "", remarks: "" },
];
const DEFAULT_MEETINGS = [
  { id: 1, title: "", duration: "30 min", outcome: "" },
];
const DEFAULT_LEAVES = [
  { id: 1, name: "", period: "", remarks: "" },
];

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// "2026-05-04" → "4th May 2026"
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return s;
  const M = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const day = d.getDate();
  const sx = (day === 1 || day === 21 || day === 31) ? "st"
           : (day === 2 || day === 22)               ? "nd"
           : (day === 3 || day === 23)               ? "rd"
           :                                          "th";
  return `${day}${sx} ${M[d.getMonth()]} ${d.getFullYear()}`;
}

function uid() {
  return Date.now() + Math.random();
}

function load() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

function save(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

// Status options for status badges in the email
const STATUS_OPTS = ["Done","WIP","Pending","Hold","Cancelled"];
const PRIORITY_OPTS = ["P0","P1","P2","P3"];

// Tabs
const TABS = [
  { l: "Header",       i: "\u{1F4CB}" }, // 📋
  { l: "Completed",    i: "\u2705"    }, // ✅
  { l: "In Progress",  i: "\u23F3"    }, // ⏳
  { l: "Tomorrow",     i: "\u{1F4C5}" }, // 📅
  { l: "Blockers",     i: "\u{1F6A7}" }, // 🚧
  { l: "Meetings",     i: "\u{1F465}" }, // 👥
  { l: "Hours",        i: "\u23F1"    }, // ⏱
  { l: "Leaves",       i: "\u{1F3D6}" }, // 🏖
  { l: "Generate",     i: "\u2709"    }, // ✉
];

// ==================================================================
// Main component
// ==================================================================
export default function App() {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const fRef = useRef(null);
  const sv = load();

  // ---------------- Header fields ----------------
  const [date,     setDate]     = useState(sv?.date     || todayStr());
  const [reporter, setReporter] = useState(sv?.reporter || DEFAULT_REPORTER);
  const [project,  setProject]  = useState(sv?.project  || DEFAULT_PROJECT);
  const [toName,   setToName]   = useState(sv?.toName   || DEFAULT_TO);
  const [greeting, setGreeting] = useState(sv?.greeting || DEFAULT_GREETING);
  const [intro,    setIntro]    = useState(sv?.intro    || DEFAULT_INTRO);
  const [closing,  setClosing]  = useState(sv?.closing  || DEFAULT_CLOSING);

  // ---------------- Section data ----------------
  const [completed, setCompleted] = useState(sv?.completed || DEFAULT_COMPLETED);
  const [wip,       setWip]       = useState(sv?.wip       || DEFAULT_WIP);
  const [tomorrow,  setTomorrow]  = useState(sv?.tomorrow  || DEFAULT_TOMORROW);
  const [blockers,  setBlockers]  = useState(sv?.blockers  || DEFAULT_BLOCKERS);
  const [meetings,  setMeetings]  = useState(sv?.meetings  || DEFAULT_MEETINGS);
  const [leaves,    setLeaves]    = useState(sv?.leaves    || DEFAULT_LEAVES);
  const [hoursTotal, setHoursTotal] = useState(sv?.hoursTotal || "8");
  const [hoursNote,  setHoursNote]  = useState(sv?.hoursNote  || "");

  // ---------------- Auto-save ----------------
  useEffect(() => {
    save({
      date, reporter, project, toName, greeting, intro, closing,
      completed, wip, tomorrow, blockers, meetings, leaves,
      hoursTotal, hoursNote,
    });
  }, [date, reporter, project, toName, greeting, intro, closing,
      completed, wip, tomorrow, blockers, meetings, leaves,
      hoursTotal, hoursNote]);

  // ---------------- Export / Import JSON ----------------
  function doExport() {
    const data = {
      date, reporter, project, toName, greeting, intro, closing,
      completed, wip, tomorrow, blockers, meetings, leaves,
      hoursTotal, hoursNote,
      exportedAt: new Date().toISOString(),
    };
    const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `daily-status-${date || "data"}.json`;
    a.click();
    URL.revokeObjectURL(u);
  }

  function doImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.reporter)  setReporter(d.reporter);
        if (d.project)   setProject(d.project);
        if (d.toName)    setToName(d.toName);
        if (d.greeting)  setGreeting(d.greeting);
        if (d.intro)     setIntro(d.intro);
        if (d.closing)   setClosing(d.closing);
        if (d.wip)       setWip(d.wip);                // carry forward
        if (d.blockers)  setBlockers(d.blockers);      // carry forward
        // Reset daily lists for the new day
        setDate(todayStr());
        setCompleted(DEFAULT_COMPLETED);
        setTomorrow(DEFAULT_TOMORROW);
        setMeetings(DEFAULT_MEETINGS);
        setLeaves(DEFAULT_LEAVES);
        setHoursTotal("8");
        setHoursNote("");
        setMsg(`Imported. WIP & blockers carried forward, daily lists reset.`);
        setTimeout(() => setMsg(""), 6000);
      } catch {
        setMsg("Error: Invalid JSON file.");
        setTimeout(() => setMsg(""), 5000);
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  // ---------------- Move helpers ----------------
  // Move a WIP item to Completed (with one click on that day)
  function wipToDone(i) {
    const it = wip[i];
    setCompleted(c => [...c, { id: uid(), desc: it.desc, ticket: it.ticket, status: "Done", remarks: it.remarks || "" }]);
    setWip(w => w.filter((_, j) => j !== i));
  }

  // ==================================================================
  // EMAIL HTML GENERATION (Outlook-compatible inline styles)
  // ==================================================================
  function genHTML() {
    const d = fmtDate(date);
    // Color palette — same as MoM app for visual consistency
    const bc = "#1B4F72"; // brand color (deep blue)
    const ac = "#2E86C1"; // accent
    const lb = "#F8F9FA"; // light bg
    const bd = "#DEE2E6"; // border
    const td = "#212529"; // text dark
    const tm = "#6C757D"; // text muted
    const F  = "font-family:'Segoe UI',Calibri,Arial,sans-serif;";

    // Status badge HTML
    const badge = (s) => {
      const map = {
        "Done":      ["#D4EDDA", "#155724", "#C3E6CB"],
        "Completed": ["#D4EDDA", "#155724", "#C3E6CB"],
        "WIP":       ["#FFF3CD", "#856404", "#FFEAA7"],
        "Pending":   ["#CCE5FF", "#004085", "#B8DAFF"],
        "Hold":      ["#F8D7DA", "#721C24", "#F5C6CB"],
        "Cancelled": ["#E2E3E5", "#383D41", "#D6D8DB"],
        "P0":        ["#F8D7DA", "#721C24", "#F5C6CB"],
        "P1":        ["#FFF3CD", "#856404", "#FFEAA7"],
        "P2":        ["#CCE5FF", "#004085", "#B8DAFF"],
        "P3":        ["#E2E3E5", "#383D41", "#D6D8DB"],
      };
      const st = map[s] || map["Pending"];
      return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${st[0]};color:${st[1]};border:1px solid ${st[2]};">${s}</span>`;
    };

    // Section heading
    const section = (title, emoji) =>
      `<tr><td style="padding:24px 0 10px 0;">
         <table width="100%" cellpadding="0" cellspacing="0" border="0">
           <tr><td style="${F}font-size:15px;font-weight:700;color:${bc};padding-bottom:6px;border-bottom:2px solid ${ac};">
             ${emoji}&nbsp;&nbsp;${title}
           </td></tr>
         </table>
       </td></tr>`;

    // Table header row
    const thead = (cols) =>
      `<tr><td style="padding:6px 0 0 0;">
         <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${bd};border-radius:6px;overflow:hidden;">
           <tr>${cols.map(c => `<th style="background:${bc};color:#fff;${F}font-size:12px;font-weight:600;padding:9px 11px;text-align:left;letter-spacing:0.3px;text-transform:uppercase;">${c}</th>`).join("")}</tr>`;
    const tend = `</table></td></tr>`;

    // Body row (zebra-striped)
    const row = (cells, idx) => {
      const bg = idx % 2 === 0 ? "#FFFFFF" : lb;
      return `<tr>${cells.map(c => `<td style="background:${bg};${F}font-size:13px;color:${td};padding:9px 11px;border-bottom:1px solid ${bd};vertical-align:top;line-height:1.5;">${c || "&nbsp;"}</td>`).join("")}</tr>`;
    };

    // "No items" placeholder row for an empty section
    const empty = (cols) =>
      `<tr><td colspan="${cols}" style="background:${lb};${F}font-size:13px;color:${tm};padding:12px;text-align:center;font-style:italic;">No items</td></tr>`;

    // ---- Filter out blank rows ----
    const cFilled = completed.filter(x => x.desc?.trim());
    const wFilled = wip.filter(x => x.desc?.trim());
    const tFilled = tomorrow.filter(x => x.desc?.trim());
    const bFilled = blockers.filter(x => x.desc?.trim());
    const mFilled = meetings.filter(x => x.title?.trim());
    const lFilled = leaves.filter(x => x.name?.trim());

    // ---- Build the email ----
    let html = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;max-width:780px;${F}color:${td};">
      <tr><td style="padding:20px 24px;">

        <!-- Greeting -->
        <p style="${F}font-size:14px;color:${td};margin:0 0 8px 0;">${greeting}</p>
        <p style="${F}font-size:14px;color:${td};margin:0 0 16px 0;line-height:1.55;">${intro}</p>

        <!-- Meta block -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${lb};border:1px solid ${bd};border-radius:6px;">
          <tr>
            <td style="${F}font-size:13px;padding:10px 14px;color:${tm};width:120px;"><strong style="color:${td};">Date:</strong></td>
            <td style="${F}font-size:13px;padding:10px 14px;color:${td};">${d}</td>
          </tr>
          <tr>
            <td style="${F}font-size:13px;padding:10px 14px;color:${tm};border-top:1px solid ${bd};"><strong style="color:${td};">Project:</strong></td>
            <td style="${F}font-size:13px;padding:10px 14px;color:${td};border-top:1px solid ${bd};">${project}</td>
          </tr>
          <tr>
            <td style="${F}font-size:13px;padding:10px 14px;color:${tm};border-top:1px solid ${bd};"><strong style="color:${td};">Reporter:</strong></td>
            <td style="${F}font-size:13px;padding:10px 14px;color:${td};border-top:1px solid ${bd};">${reporter}</td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0">`;

    // ---- Completed Today ----
    html += section("Completed Today", "\u2705");
    html += thead(["#", "Task", "Ticket", "Status", "Remarks"]);
    if (cFilled.length === 0) {
      html += empty(5);
    } else {
      cFilled.forEach((x, i) => {
        html += row([i + 1, x.desc, x.ticket || "-", badge(x.status || "Done"), x.remarks || "-"], i);
      });
    }
    html += tend;

    // ---- In Progress ----
    html += section("In Progress / WIP", "\u23F3");
    html += thead(["#", "Task", "Ticket", "Progress", "ETA", "Remarks"]);
    if (wFilled.length === 0) {
      html += empty(6);
    } else {
      wFilled.forEach((x, i) => {
        html += row([i + 1, x.desc, x.ticket || "-", x.percent || "-", x.eta || "-", x.remarks || "-"], i);
      });
    }
    html += tend;

    // ---- Plan for Tomorrow ----
    html += section("Plan for Tomorrow", "\u{1F4C5}");
    html += thead(["#", "Task", "Priority", "Remarks"]);
    if (tFilled.length === 0) {
      html += empty(4);
    } else {
      tFilled.forEach((x, i) => {
        html += row([i + 1, x.desc, badge(x.priority || "P2"), x.remarks || "-"], i);
      });
    }
    html += tend;

    // ---- Blockers (only if any) ----
    if (bFilled.length > 0) {
      html += section("Blockers / Help Needed", "\u{1F6A7}");
      html += thead(["#", "Issue", "Waiting On", "Since", "Remarks"]);
      bFilled.forEach((x, i) => {
        html += row([i + 1, x.desc, x.waitingOn || "-", x.since || "-", x.remarks || "-"], i);
      });
      html += tend;
    }

    // ---- Meetings (only if any) ----
    if (mFilled.length > 0) {
      html += section("Meetings Attended", "\u{1F465}");
      html += thead(["#", "Title", "Duration", "Outcome"]);
      mFilled.forEach((x, i) => {
        html += row([i + 1, x.title, x.duration || "-", x.outcome || "-"], i);
      });
      html += tend;
    }

    // ---- Hours ----
    html += section("Time Logged", "\u23F1");
    html += `<tr><td style="padding:6px 0 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${lb};border:1px solid ${bd};border-radius:6px;">
        <tr>
          <td style="${F}font-size:13px;padding:10px 14px;color:${tm};width:120px;"><strong style="color:${td};">Total Hours:</strong></td>
          <td style="${F}font-size:13px;padding:10px 14px;color:${td};">${hoursTotal || "-"}${hoursNote ? ` <span style="color:${tm};">— ${hoursNote}</span>` : ""}</td>
        </tr>
      </table>
    </td></tr>`;

    // ---- Leaves (only if any) ----
    if (lFilled.length > 0) {
      html += section("Leaves / PTO", "\u{1F3D6}");
      html += thead(["#", "Name", "Period", "Remarks"]);
      lFilled.forEach((x, i) => {
        html += row([i + 1, x.name, x.period || "-", x.remarks || "-"], i);
      });
      html += tend;
    }

    // ---- Closing ----
    html += `</table>
        <p style="${F}font-size:14px;color:${td};margin:24px 0 0 0;line-height:1.55;white-space:pre-line;">${closing}</p>
      </td></tr>
    </table>`;

    return html;
  }

  // ---------------- Copy to clipboard (rich HTML for Outlook) ----------------
  async function copyHTML() {
    const html = genHTML();
    try {
      // Modern clipboard API supports rich HTML
      const blob = new Blob([html], { type: "text/html" });
      const text = new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": text }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback: copy raw HTML as text
      try {
        await navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        setMsg("Copy failed. Use the iframe right-click → Copy instead.");
        setTimeout(() => setMsg(""), 4000);
      }
    }
  }

  // ==================================================================
  // Render
  // ==================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Daily Status Mail Generator</h1>
            <p className="text-blue-100 text-xs md:text-sm">Fill the form, generate the email, paste into Outlook.</p>
          </div>
          <div className="flex gap-2 text-xs md:text-sm">
            <button
              onClick={doExport}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded font-medium"
            >⬇ Export JSON</button>
            <button
              onClick={() => fRef.current?.click()}
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded font-medium"
            >⬆ Import JSON</button>
            <input ref={fRef} type="file" accept=".json" onChange={doImport} className="hidden" />
          </div>
        </div>
      </div>

      {/* Status messages */}
      {msg && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 rounded text-sm">{msg}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="flex flex-wrap gap-1 border-b border-slate-300">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={
                "px-3 py-2 text-sm font-medium rounded-t transition " +
                (tab === i
                  ? "bg-white border border-b-white border-slate-300 text-blue-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60")
              }
            >
              <span className="mr-1">{t.i}</span>{t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6">
          {tab === 0 && (
            <HeaderTab
              date={date} setDate={setDate}
              reporter={reporter} setReporter={setReporter}
              project={project} setProject={setProject}
              toName={toName} setToName={setToName}
              greeting={greeting} setGreeting={setGreeting}
              intro={intro} setIntro={setIntro}
              closing={closing} setClosing={setClosing}
            />
          )}
          {tab === 1 && (
            <ListTab
              title="Completed Today"
              items={completed}
              setItems={setCompleted}
              emptyItem={() => ({ id: uid(), desc: "", ticket: "", status: "Done", remarks: "" })}
              fields={[
                { key: "desc",    label: "Task",    type: "textarea" },
                { key: "ticket",  label: "Ticket / Ref", type: "text", w: "w-32" },
                { key: "status",  label: "Status",  type: "select", opts: STATUS_OPTS, w: "w-32" },
                { key: "remarks", label: "Remarks", type: "textarea" },
              ]}
            />
          )}
          {tab === 2 && (
            <ListTab
              title="In Progress / WIP"
              items={wip}
              setItems={setWip}
              emptyItem={() => ({ id: uid(), desc: "", ticket: "", percent: "50%", eta: "", remarks: "" })}
              fields={[
                { key: "desc",    label: "Task",         type: "textarea" },
                { key: "ticket",  label: "Ticket / Ref", type: "text", w: "w-32" },
                { key: "percent", label: "% Done",       type: "text", w: "w-24" },
                { key: "eta",     label: "ETA",          type: "text", w: "w-32" },
                { key: "remarks", label: "Remarks",      type: "textarea" },
              ]}
              extraActions={(i) => (
                <button
                  onClick={() => wipToDone(i)}
                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 px-2 py-1 rounded"
                  title="Move to Completed Today"
                >→ Done</button>
              )}
            />
          )}
          {tab === 3 && (
            <ListTab
              title="Plan for Tomorrow"
              items={tomorrow}
              setItems={setTomorrow}
              emptyItem={() => ({ id: uid(), desc: "", priority: "P2", remarks: "" })}
              fields={[
                { key: "desc",     label: "Task",     type: "textarea" },
                { key: "priority", label: "Priority", type: "select", opts: PRIORITY_OPTS, w: "w-24" },
                { key: "remarks",  label: "Remarks",  type: "textarea" },
              ]}
            />
          )}
          {tab === 4 && (
            <ListTab
              title="Blockers / Help Needed"
              items={blockers}
              setItems={setBlockers}
              emptyItem={() => ({ id: uid(), desc: "", waitingOn: "", since: "", remarks: "" })}
              fields={[
                { key: "desc",      label: "Issue",      type: "textarea" },
                { key: "waitingOn", label: "Waiting On", type: "text", w: "w-40" },
                { key: "since",     label: "Since",      type: "text", w: "w-32" },
                { key: "remarks",   label: "Remarks",    type: "textarea" },
              ]}
            />
          )}
          {tab === 5 && (
            <ListTab
              title="Meetings Attended"
              items={meetings}
              setItems={setMeetings}
              emptyItem={() => ({ id: uid(), title: "", duration: "30 min", outcome: "" })}
              fields={[
                { key: "title",    label: "Title",    type: "text" },
                { key: "duration", label: "Duration", type: "text", w: "w-28" },
                { key: "outcome",  label: "Outcome",  type: "textarea" },
              ]}
            />
          )}
          {tab === 6 && (
            <HoursTab
              hoursTotal={hoursTotal} setHoursTotal={setHoursTotal}
              hoursNote={hoursNote}   setHoursNote={setHoursNote}
            />
          )}
          {tab === 7 && (
            <ListTab
              title="Leaves / PTO"
              items={leaves}
              setItems={setLeaves}
              emptyItem={() => ({ id: uid(), name: "", period: "", remarks: "" })}
              fields={[
                { key: "name",    label: "Name",    type: "text",     w: "w-48" },
                { key: "period",  label: "Period",  type: "text",     w: "w-40" },
                { key: "remarks", label: "Remarks", type: "textarea" },
              ]}
            />
          )}
          {tab === 8 && (
            <GenerateTab
              html={genHTML()}
              copyHTML={copyHTML}
              copied={copied}
            />
          )}
        </div>

        {/* Tab nav arrows */}
        <div className="mt-4 flex justify-between">
          <button
            disabled={tab === 0}
            onClick={() => setTab(t => Math.max(0, t - 1))}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >← Previous</button>
          <button
            disabled={tab === TABS.length - 1}
            onClick={() => setTab(t => Math.min(TABS.length - 1, t + 1))}
            className="text-sm px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >Next →</button>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500">
        Auto-saves to your browser. Export JSON to keep a backup.
      </footer>
    </div>
  );
}

// ==================================================================
// Header tab — a simple form
// ==================================================================
function HeaderTab({ date, setDate, reporter, setReporter, project, setProject,
                    toName, setToName, greeting, setGreeting, intro, setIntro,
                    closing, setClosing }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Date">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Reporter">
        <input type="text" value={reporter} onChange={e => setReporter(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Project">
        <input type="text" value={project} onChange={e => setProject(e.target.value)} className={inputCls} />
      </Field>
      <Field label="To (label only — for your reference)">
        <input type="text" value={toName} onChange={e => setToName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Greeting" className="md:col-span-2">
        <input type="text" value={greeting} onChange={e => setGreeting(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Intro line" className="md:col-span-2">
        <input type="text" value={intro} onChange={e => setIntro(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Closing (multi-line, e.g. Regards / Name)" className="md:col-span-2">
        <textarea
          value={closing}
          onChange={e => setClosing(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ==================================================================
// Hours tab
// ==================================================================
function HoursTab({ hoursTotal, setHoursTotal, hoursNote, setHoursNote }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Total Hours Logged Today">
        <input
          type="text"
          value={hoursTotal}
          onChange={e => setHoursTotal(e.target.value)}
          placeholder="e.g. 8 or 7.5"
          className={inputCls}
        />
      </Field>
      <Field label="Note (optional)" className="md:col-span-2">
        <input
          type="text"
          value={hoursNote}
          onChange={e => setHoursNote(e.target.value)}
          placeholder="e.g. 5h on Alfresco upgrade, 3h on K8s ticket"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ==================================================================
// ListTab — generic list editor (used by 6 of the tabs)
// ==================================================================
function ListTab({ title, items, setItems, emptyItem, fields, extraActions }) {
  function update(i, key, val) {
    setItems(arr => arr.map((it, j) => j === i ? { ...it, [key]: val } : it));
  }
  function add() {
    setItems(arr => [...arr, emptyItem()]);
  }
  function del(i) {
    setItems(arr => arr.filter((_, j) => j !== i));
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <button
          onClick={add}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium"
        >+ Add</button>
      </div>

      {items.length === 0 && (
        <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded p-4 text-center">
          No items. Click <strong>+ Add</strong> to insert one.
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
              <div className="flex gap-2">
                {extraActions && extraActions(i)}
                <button
                  onClick={() => del(i)}
                  className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded"
                >Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map(f => (
                <Field key={f.key} label={f.label} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  {f.type === "textarea" && (
                    <textarea
                      value={it[f.key] || ""}
                      onChange={e => update(i, f.key, e.target.value)}
                      rows={2}
                      className={inputCls}
                    />
                  )}
                  {f.type === "text" && (
                    <input
                      type="text"
                      value={it[f.key] || ""}
                      onChange={e => update(i, f.key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                  {f.type === "select" && (
                    <select
                      value={it[f.key] || ""}
                      onChange={e => update(i, f.key, e.target.value)}
                      className={inputCls}
                    >
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================================================================
// GenerateTab — preview + copy + raw HTML
// ==================================================================
function GenerateTab({ html, copyHTML, copied }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={copyHTML}
          className={
            "px-4 py-2 rounded font-semibold text-sm transition " +
            (copied
              ? "bg-emerald-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white")
          }
        >
          {copied ? "✓ Copied to clipboard" : "📋 Copy email (paste into Outlook)"}
        </button>
        <button
          onClick={() => setShowRaw(s => !s)}
          className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded border border-slate-300"
        >
          {showRaw ? "Hide" : "Show"} raw HTML
        </button>
      </div>

      <div className="text-xs text-slate-500 mb-2">
        Preview (this is what your manager will see in Outlook):
      </div>
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
        <iframe
          title="email-preview"
          srcDoc={`<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:16px;">${html}</body></html>`}
          className="w-full"
          style={{ height: "650px", border: 0 }}
        />
      </div>

      {showRaw && (
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-2">Raw HTML (for debugging):</div>
          <textarea
            readOnly
            value={html}
            className="w-full h-64 font-mono text-xs p-3 border border-slate-300 rounded bg-slate-50"
          />
        </div>
      )}
    </div>
  );
}

// ==================================================================
// Tiny helpers — Field wrapper + shared input class
// ==================================================================
const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
