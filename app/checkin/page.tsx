"use client";

import { FormEvent, useState } from "react";
import { AirlineHero } from "../../components/AirlineMark";
import type { AirlinePoolItem, Team } from "../../lib/types";

type BusyState = "draw" | "submit" | null;

export default function CheckinPage() {
  const [teamName, setTeamName] = useState("");
  const [selected, setSelected] = useState<AirlinePoolItem | null>(null);
  const [completedTeam, setCompletedTeam] = useState<Team | null>(null);
  const [busy, setBusy] = useState<BusyState>(null);
  const [error, setError] = useState<string | null>(null);

  async function drawAirline() {
    if (!teamName.trim()) {
      setError("팀 이름을 먼저 입력해 주세요.");
      return;
    }

    setBusy("draw");
    setError(null);
    try {
      const response = await fetch("/api/airlines?draw=1", { cache: "no-store" });
      const payload = (await response.json()) as { airline?: AirlinePoolItem; error?: string };
      if (!response.ok || !payload.airline) {
        throw new Error(payload.error || "항공사를 추첨하지 못했습니다.");
      }
      setSelected(payload.airline);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "항공사를 추첨하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamName.trim()) {
      setError("팀 이름을 먼저 입력해 주세요.");
      return;
    }
    if (!selected) {
      await drawAirline();
      return;
    }

    setBusy("submit");
    setError(null);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          airlineId: selected.id,
          setActive: true,
        }),
      });
      const payload = (await response.json()) as { team?: Team; error?: string };
      if (!response.ok || !payload.team) {
        throw new Error(payload.error || "선택을 저장하지 못했습니다.");
      }
      setCompletedTeam(payload.team);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "선택을 저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function nextTeam() {
    setTeamName("");
    setSelected(null);
    setCompletedTeam(null);
    setError(null);
  }

  if (completedTeam) {
    return (
      <main className="checkin-page checkin-page--complete">
        <section className="checkin-complete">
          <span className="complete-kicker">CHECK-IN COMPLETE</span>
          <div className="complete-check" aria-hidden="true">✓</div>
          <div className="complete-logo-stage">
            <AirlineHero
              code={completedTeam.airlineCode}
              name={completedTeam.airlineName}
              color={completedTeam.airlineColor}
              logoUrl={completedTeam.logoUrl}
            />
          </div>
          <p>랜덤 항공사 배정 완료</p>
          <h1>{completedTeam.name}</h1>
          <div className="next-station">
            <span>다음 단계</span>
            <strong>원자재 창고에서 종이를 받아 주세요</strong>
          </div>
          <button className="checkin-next" onClick={nextTeam}>다음 팀 추첨 받기</button>
        </section>
      </main>
    );
  }

  return (
    <main className="checkin-page">
      <header className="checkin-header">
        <div className="checkin-brand">
          <span>SF</span>
          <div>
            <p>SMART FACTORY AIR RACE</p>
            <strong>항공사 랜덤 체크인</strong>
          </div>
        </div>
        <div className="checkin-step"><span>01</span> 팀 등록 <i /> <span>02</span> 랜덤 추첨</div>
      </header>

      <form className="checkin-shell" onSubmit={(event) => void submit(event)}>
        <div className="checkin-intro">
          <p className="eyebrow eyebrow--dark">DRAW YOUR AIRLINE</p>
          <h1>우리 팀의 항공사를<br />랜덤으로 뽑아주세요</h1>
          <p>팀 이름을 입력하고 추첨 버튼을 누르면<br />항공사가 즉시 랜덤 배정됩니다.</p>

          <label className="checkin-name-field" htmlFor="checkin-team-name">
            <span>팀 이름</span>
            <input
              id="checkin-team-name"
              maxLength={24}
              placeholder="팀 이름을 입력하세요"
              autoFocus
              value={teamName}
              onChange={(event) => {
                setTeamName(event.target.value);
                setSelected(null);
                setError(null);
              }}
            />
          </label>

          <div className="checkin-selection-preview">
            <span>추첨 결과</span>
            {selected ? (
              <strong><i style={{ background: selected.color }} />{selected.name}</strong>
            ) : (
              <strong className="is-empty">아직 추첨하지 않았어요</strong>
            )}
          </div>
        </div>

        <div className="checkin-airlines checkin-airlines--draw">
          <div className="checkin-airlines__heading">
            <div>
              <span>RANDOM AIRLINE DRAW</span>
              <h2>운명의 항공사를 뽑아주세요</h2>
            </div>
            <b>공정한 랜덤 배정</b>
          </div>

          <div className={`random-draw-stage${selected ? " random-draw-stage--result" : ""}`}>
            {selected ? (
              <>
                <span className="random-result-kicker">YOUR AIRLINE</span>
                <div className="random-result-logo">
                  <AirlineHero
                    code={selected.code}
                    name={selected.name}
                    color={selected.color}
                    logoUrl={selected.logoUrl}
                  />
                </div>
                <strong>{selected.name}</strong>
                <small>{selected.code}</small>
              </>
            ) : (
              <>
                <span className="random-draw-orbit" aria-hidden="true">?</span>
                <h3>어떤 항공사가 나올까요?</h3>
                <p>팀 이름을 입력한 뒤 아래 버튼을 눌러주세요.</p>
              </>
            )}
          </div>

          {error && <p className="checkin-error" role="alert">{error}</p>}
          {selected ? (
            <button className="checkin-submit" type="submit" disabled={busy !== null}>
              {busy === "submit" ? "전광판에 등록 중…" : "이 항공사로 생산 시작 준비"}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className="checkin-submit checkin-submit--draw"
              type="button"
              onClick={() => void drawAirline()}
              disabled={busy !== null}
            >
              {busy === "draw" ? "항공사 추첨 중…" : "랜덤 항공사 뽑기"}
              <span aria-hidden="true">✦</span>
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
