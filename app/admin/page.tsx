"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AirlineMark } from "../../components/AirlineMark";
import type { AirlinePoolItem, TimerStatus } from "../../lib/types";
import { formatTime, useBoothState } from "../../lib/use-booth-state";

type Toast = { type: "success" | "error"; message: string } | null;

const STATUS_TEXT: Record<TimerStatus, string> = {
  idle: "출발 준비",
  running: "진행 중",
  paused: "일시정지",
  finished: "종료",
};

export default function AdminPage() {
  const { state, receivedAt, error, refresh } = useBoothState(1000);
  const [teamName, setTeamName] = useState("");
  const [airlinePool, setAirlinePool] = useState<AirlinePoolItem[]>([]);
  const [selectedAirlineCode, setSelectedAirlineCode] = useState("");
  const [poolName, setPoolName] = useState("");
  const [poolCode, setPoolCode] = useState("");
  const [poolColor, setPoolColor] = useState("#4A63D8");
  const [baselineScore, setBaselineScore] = useState(0);
  const [baselineAirlineCode, setBaselineAirlineCode] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const loadAirlinePool = useCallback(async () => {
    try {
      const response = await fetch("/api/airlines", { cache: "no-store" });
      const payload = (await response.json()) as { airlines?: AirlinePoolItem[]; error?: string };
      if (!response.ok || !payload.airlines) {
        throw new Error(payload.error || "추첨 항공사를 불러오지 못했습니다.");
      }
      setAirlinePool(payload.airlines);
      setSelectedAirlineCode((current) =>
        payload.airlines!.some((airline) => airline.code === current)
          ? current
          : payload.airlines![0]?.code ?? "",
      );
    } catch (caught) {
      setToast({
        type: "error",
        message: caught instanceof Error ? caught.message : "추첨 항공사를 불러오지 못했습니다.",
      });
    }
  }, []);

  useEffect(() => {
    void loadAirlinePool();
  }, [loadAirlinePool]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!state) return;
    setMinutes(Math.floor(state.timer.durationSeconds / 60));
    setSeconds(state.timer.durationSeconds % 60);
  }, [state?.timer.durationSeconds]);

  useEffect(() => {
    if (!state) return;
    setBaselineScore(state.baseline.score);
    setBaselineAirlineCode(state.baseline.airlineCode);
  }, [
    state?.baseline.airlineCode,
    state?.baseline.airlineColor,
    state?.baseline.airlineName,
    state?.baseline.score,
  ]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const baselineAirlines = useMemo(() => {
    if (!state?.baseline || airlinePool.some((airline) => airline.code === state.baseline.airlineCode)) {
      return airlinePool;
    }
    return [
      {
        id: 0,
        code: state.baseline.airlineCode,
        name: state.baseline.airlineName,
        color: state.baseline.airlineColor,
        createdAt: "",
      },
      ...airlinePool,
    ];
  }, [
    airlinePool,
    state?.baseline.airlineCode,
    state?.baseline.airlineColor,
    state?.baseline.airlineName,
  ]);

  const remaining = state
    ? Math.max(
        0,
        state.timer.remainingSeconds -
          (state.timer.status === "running" ? (clock - receivedAt) / 1000 : 0),
      )
    : 0;
  const displayStatus: TimerStatus =
    state?.timer.status === "running" && remaining <= 0
      ? "finished"
      : state?.timer.status || "idle";

  async function request(path: string, options: RequestInit, busyKey: string, success?: string) {
    setBusy(busyKey);
    try {
      const response = await fetch(path, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "요청을 처리하지 못했습니다.");
      await refresh();
      if (success) setToast({ type: "success", message: success });
      return true;
    } catch (caught) {
      setToast({
        type: "error",
        message: caught instanceof Error ? caught.message : "요청을 처리하지 못했습니다.",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const airline = airlinePool.find((item) => item.code === selectedAirlineCode);
    if (!teamName.trim() || !airline) {
      setToast({ type: "error", message: "팀 이름과 항공사를 모두 입력해 주세요." });
      return;
    }
    const ok = await request(
      "/api/teams",
      {
        method: "POST",
        body: JSON.stringify({
          name: teamName,
          airlineCode: airline.code,
          airlineName: airline.name,
          airlineColor: airline.color,
        }),
      },
      "add-team",
      `${teamName.trim()} 팀을 등록했습니다.`,
    );
    if (ok) setTeamName("");
  }

  async function submitAirline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!poolName.trim() || !poolCode.trim()) {
      setToast({ type: "error", message: "항공사명과 코드를 모두 입력해 주세요." });
      return;
    }
    setBusy("add-airline");
    try {
      const response = await fetch("/api/airlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: poolName, code: poolCode, color: poolColor }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "항공사를 추가하지 못했습니다.");
      setPoolName("");
      setPoolCode("");
      await loadAirlinePool();
      setToast({ type: "success", message: "랜덤 추첨 항공사를 추가했습니다." });
    } catch (caught) {
      setToast({
        type: "error",
        message: caught instanceof Error ? caught.message : "항공사를 추가하지 못했습니다.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function deleteAirline(airline: AirlinePoolItem) {
    setBusy(`delete-airline-${airline.id}`);
    try {
      const response = await fetch("/api/airlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: airline.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "항공사를 삭제하지 못했습니다.");
      await loadAirlinePool();
      setToast({ type: "success", message: `${airline.name}을 추첨 목록에서 삭제했습니다.` });
    } catch (caught) {
      setToast({
        type: "error",
        message: caught instanceof Error ? caught.message : "항공사를 삭제하지 못했습니다.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function saveBaseline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const airline = baselineAirlines.find((item) => item.code === baselineAirlineCode);
    if (!airline) {
      setToast({ type: "error", message: "기준 기록의 항공사를 선택해 주세요." });
      return;
    }
    await request(
      "/api/baseline",
      {
        method: "PATCH",
        body: JSON.stringify({
          score: baselineScore,
          airlineCode: airline.code,
          airlineName: airline.name,
          airlineColor: airline.color,
        }),
      },
      "baseline",
      "운영팀 기준 기록을 저장했습니다.",
    );
  }

  async function timerAction(action: "start" | "pause" | "reset") {
    await request(
      "/api/timer",
      { method: "PATCH", body: JSON.stringify({ action }) },
      `timer-${action}`,
    );
  }

  async function saveDuration() {
    const durationSeconds = Math.max(0, Number(minutes) * 60 + Number(seconds));
    await request(
      "/api/timer",
      { method: "PATCH", body: JSON.stringify({ action: "setDuration", durationSeconds }) },
      "duration",
      "타이머 시간을 저장했습니다.",
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow eyebrow--dark">SMART FACTORY · CONTROL</p>
          <h1>부스 운영 센터</h1>
        </div>
        <div className="admin-header__links">
          <Link className="display-link" href="/checkin" target="_blank">추첨 화면 <span>↗</span></Link>
          <Link className="display-link" href="/" target="_blank">전광판 <span>↗</span></Link>
        </div>
      </header>

      <div className={`connection-bar${error ? " connection-bar--error" : ""}`}>
        <span aria-hidden="true" />
        {error ? "전광판과 다시 연결하고 있습니다" : "전광판과 실시간 연결됨"}
      </div>

      <div className="admin-grid">
        <section className="admin-card timer-control-card">
          <div className="card-heading">
            <div><span className="section-number">01</span><h2>생산 타이머</h2></div>
            <span className={`status-chip status-chip--${displayStatus}`}>{STATUS_TEXT[displayStatus]}</span>
          </div>

          <div className={`admin-clock admin-clock--${displayStatus}`}>{formatTime(remaining)}</div>
          <div className="timer-buttons">
            {displayStatus === "running" ? (
              <button className="button button--warning" onClick={() => void timerAction("pause")} disabled={busy !== null}><span aria-hidden="true">Ⅱ</span> 일시정지</button>
            ) : (
              <button className="button button--primary" onClick={() => void timerAction("start")} disabled={busy !== null}><span aria-hidden="true">▶</span> {displayStatus === "paused" ? "계속하기" : "시작"}</button>
            )}
            <button className="button button--ghost" onClick={() => void timerAction("reset")} disabled={busy !== null}><span aria-hidden="true">↺</span> 초기화</button>
          </div>

          <div className="duration-setting">
            <div><label htmlFor="timer-minutes">제한 시간 설정</label><p>저장하면 타이머가 처음으로 돌아갑니다.</p></div>
            <div className="duration-inputs">
              <label><input id="timer-minutes" type="number" min="0" max="60" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /><span>분</span></label>
              <label><input type="number" min="0" max="59" value={seconds} onChange={(event) => setSeconds(Number(event.target.value))} aria-label="초" /><span>초</span></label>
              <button className="small-save" onClick={() => void saveDuration()} disabled={busy !== null}>저장</button>
            </div>
          </div>
        </section>

        <section className="admin-card baseline-card">
          <div className="card-heading">
            <div><span className="section-number">02</span><h2>운영팀 기준 기록</h2></div>
            <span className="status-chip">BASE</span>
          </div>
          <form className="baseline-form" onSubmit={(event) => void saveBaseline(event)}>
            <label className="field-label" htmlFor="baseline-airline">기준 항공사</label>
            <select
              className="admin-select"
              id="baseline-airline"
              value={baselineAirlineCode}
              onChange={(event) => setBaselineAirlineCode(event.target.value)}
            >
              {baselineAirlines.map((airline) => <option value={airline.code} key={`${airline.id}-${airline.code}`}>{airline.name} · {airline.code}</option>)}
            </select>
            {baselineAirlines.find((airline) => airline.code === baselineAirlineCode) && (
              <div className="baseline-preview">
                <AirlineMark {...baselineAirlines.find((airline) => airline.code === baselineAirlineCode)!} />
              </div>
            )}
            <label className="field-label" htmlFor="baseline-score">기준 생산량</label>
            <label className="baseline-score-input">
              <input id="baseline-score" type="number" min="0" value={baselineScore} onChange={(event) => setBaselineScore(Math.max(0, Number(event.target.value)))} />
              <span>대</span>
            </label>
            <button className="button button--primary" type="submit" disabled={busy !== null}>{busy === "baseline" ? "저장 중…" : "기준 기록 저장"}</button>
          </form>
        </section>

        <section className="admin-card airline-pool-card">
          <div className="card-heading">
            <div><span className="section-number">03</span><h2>랜덤 항공사 관리</h2></div>
            <span className="team-count">{airlinePool.length}개</span>
          </div>
          <form className="airline-pool-form" onSubmit={(event) => void submitAirline(event)}>
            <label><span>항공사명</span><input className="text-input" maxLength={20} placeholder="예: SVP 항공" value={poolName} onChange={(event) => setPoolName(event.target.value)} /></label>
            <label><span>코드</span><input className="text-input" maxLength={4} placeholder="SVP" value={poolCode} onChange={(event) => setPoolCode(event.target.value.toUpperCase())} /></label>
            <label className="airline-color-field"><span>색상</span><input type="color" value={poolColor} onChange={(event) => setPoolColor(event.target.value)} aria-label="항공사 색상" /></label>
            <button className="button button--register" type="submit" disabled={busy !== null}>{busy === "add-airline" ? "추가 중…" : "추첨 항공사 추가"}</button>
          </form>
          <div className="airline-pool-list">
            {airlinePool.map((airline) => (
              <div className="airline-pool-item" key={airline.id}>
                <AirlineMark {...airline} compact />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`${airline.name}을 랜덤 추첨 목록에서 삭제할까요?`)) void deleteAirline(airline);
                  }}
                  disabled={busy !== null || airlinePool.length <= 1}
                  aria-label={`${airline.name} 추첨 목록에서 삭제`}
                >×</button>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card registration-card">
          <div className="card-heading"><div><span className="section-number">04</span><h2>새 팀 수동 등록</h2></div></div>
          <form onSubmit={(event) => void submitTeam(event)}>
            <label className="field-label" htmlFor="team-name">팀 이름</label>
            <input className="text-input" id="team-name" maxLength={24} placeholder="예: 반도체 드림팀" value={teamName} onChange={(event) => setTeamName(event.target.value)} />
            <div className="field-heading"><span className="field-label">항공사 선택</span><small>추첨 목록과 동일</small></div>
            <div className="airline-picker">
              {airlinePool.map((airline) => (
                <button
                  type="button"
                  className={`airline-option${selectedAirlineCode === airline.code ? " airline-option--selected" : ""}`}
                  onClick={() => setSelectedAirlineCode(airline.code)}
                  key={airline.id}
                  aria-pressed={selectedAirlineCode === airline.code}
                >
                  <AirlineMark {...airline} compact />
                  <span className="option-check" aria-hidden="true">✓</span>
                </button>
              ))}
            </div>
            <button className="button button--register" type="submit" disabled={busy !== null || airlinePool.length === 0}>{busy === "add-team" ? "등록 중…" : "팀 등록하기"}</button>
          </form>
        </section>

        <section className="admin-card score-card">
          <div className="card-heading score-heading">
            <div><span className="section-number">05</span><h2>실시간 생산 입력</h2></div>
            <span className="team-count">{state?.teams.length || 0}개 팀</span>
          </div>

          {!state || state.teams.length === 0 ? (
            <div className="empty-team-list"><span aria-hidden="true">＋</span><p>팀을 등록하면 점수 입력판이 나타납니다.</p></div>
          ) : (
            <div className="team-control-list">
              {state.teams.map((team, index) => (
                <article className={`team-control${team.id === state.currentTeam?.id ? " team-control--active" : ""}`} key={team.id}>
                  <div className="team-control__info">
                    <span className="mini-rank">{index + 1}</span>
                    <div>
                      <strong>{team.name}{team.id === state.currentTeam?.id && <em>현재 팀</em>}</strong>
                      <AirlineMark code={team.airlineCode} name={team.airlineName} color={team.airlineColor} compact />
                    </div>
                  </div>
                  <div className="score-controls">
                    {team.id !== state.currentTeam?.id && <button className="set-current-team" onClick={() => void request("/api/teams", { method: "PATCH", body: JSON.stringify({ id: team.id, action: "setActive" }) }, `active-${team.id}`, `${team.name} 팀을 현재 팀으로 설정했습니다.`)} disabled={busy !== null}>현재 팀</button>}
                    <button className="score-button score-button--minus" onClick={() => void request("/api/teams", { method: "PATCH", body: JSON.stringify({ id: team.id, delta: -1 }) }, `score-${team.id}`)} disabled={busy !== null || team.score <= 0} aria-label={`${team.name} 생산량 1 감소`}>−</button>
                    <label className="score-input-wrap">
                      <input key={`${team.id}-${team.score}`} type="number" min="0" defaultValue={team.score} onBlur={(event) => { const score = Number(event.target.value); if (score !== team.score) void request("/api/teams", { method: "PATCH", body: JSON.stringify({ id: team.id, score }) }, `score-${team.id}`); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label={`${team.name} 생산량 직접 입력`} />
                      <span>대</span>
                    </label>
                    <button className="score-button score-button--plus" onClick={() => void request("/api/teams", { method: "PATCH", body: JSON.stringify({ id: team.id, delta: 1 }) }, `score-${team.id}`)} disabled={busy !== null} aria-label={`${team.name} 생산량 1 증가`}>＋</button>
                    <button className="delete-team" onClick={() => { if (window.confirm(`${team.name} 팀을 삭제할까요?`)) void request("/api/teams", { method: "DELETE", body: JSON.stringify({ id: team.id }) }, `delete-${team.id}`, "팀을 삭제했습니다."); }} disabled={busy !== null} aria-label={`${team.name} 삭제`}>×</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {state && state.teams.length > 0 && <button className="reset-scores" onClick={() => { if (window.confirm("모든 팀의 생산량을 0대로 초기화할까요?")) void request("/api/teams", { method: "PATCH", body: JSON.stringify({ action: "resetScores" }) }, "reset-scores", "모든 점수를 초기화했습니다."); }} disabled={busy !== null}>모든 팀 점수 초기화</button>}
        </section>
      </div>

      {toast && <div className={`toast toast--${toast.type}`} role="status">{toast.message}</div>}
    </main>
  );
}
