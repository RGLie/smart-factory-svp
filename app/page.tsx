"use client";

import { useEffect, useMemo, useState } from "react";
import { AirlineHero, AirlineMark } from "../components/AirlineMark";
import { formatTime, useBoothState } from "../lib/use-booth-state";

const TIMER_LABEL = {
  idle: "출발 준비",
  running: "생산 진행 중",
  paused: "잠시 멈춤",
  finished: "생산 종료",
} as const;

export default function LeaderboardPage() {
  const { state, receivedAt, error } = useBoothState(1000);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!state) return 0;
    if (state.timer.status !== "running") return state.timer.remainingSeconds;
    return Math.max(0, state.timer.remainingSeconds - (clock - receivedAt) / 1000);
  }, [clock, receivedAt, state]);

  const totalPlanes = state?.teams.reduce((sum, team) => sum + team.score, 0) ?? 0;
  const isFinished = state?.timer.status === "finished" || (state?.timer.status === "running" && remainingSeconds <= 0);
  const timerStatus = isFinished ? "finished" : state?.timer.status || "idle";
  const currentRank = state?.currentTeam
    ? state.teams.findIndex((team) => team.id === state.currentTeam?.id) + 1
    : 0;
  const leaderboardTeams = useMemo(() => {
    if (!state) return [];

    const topFive = state.teams.slice(0, 5);
    if (!state.currentTeam || topFive.some((team) => team.id === state.currentTeam?.id)) {
      return topFive;
    }

    return [...topFive, state.currentTeam];
  }, [state]);

  return (
    <main className={`display-page display-page--${timerStatus}`}>
      <div className="display-grid" aria-hidden="true" />
      <header className="display-header">
        <div className="brand-lockup">
          <img
            className="brand-logo"
            src="/smart-factory-logo.png"
            alt="스마트 팩토리 이겨라 로고"
          />
          <div>
            <h1>종이비행기 스마트 생산 레이스</h1>
          </div>
        </div>
        <div className="header-actions">
          <span className={`live-pill${error ? " live-pill--offline" : ""}`}>
            <span className="live-dot" aria-hidden="true" />
            {error ? "연결 확인 중" : "LIVE"}
          </span>
        </div>
      </header>

      <div className="display-content">
        <section className={`current-flight${state?.currentTeam ? " current-flight--active" : ""}`} aria-label="현재 생산팀">
          {state?.currentTeam ? (
            <>
              <div className="current-flight__identity">
                <p>현재 생산팀</p>
                <h2>{state.currentTeam.name}</h2>
                <span className="current-flight__airline-name">{state.currentTeam.airlineName}</span>
              </div>
              <div className="current-flight__logo-stage">
                <AirlineHero
                  code={state.currentTeam.airlineCode}
                  name={state.currentTeam.airlineName}
                  color={state.currentTeam.airlineColor}
                />
              </div>
              <div className="current-flight__stats">
                <div><span>생산량</span><strong>{state.currentTeam.score}<small>대</small></strong></div>
                <div><span>현재 순위</span><strong>{currentRank || "—"}<small>위</small></strong></div>
              </div>
            </>
          ) : (
            <div className="current-flight__waiting">
              <span className="waiting-orbit" aria-hidden="true">✈</span>
              <div>
                <h2>다음 팀의 항공사 선택을 기다리고 있습니다</h2>
                <span>선택 노트북에서 팀 이름과 항공사를 등록해 주세요.</span>
              </div>
            </div>
          )}
        </section>

        <div className="production-grid">
          <section className="timer-panel" aria-label="생산 타이머">
            <div className="timer-panel__topline">
              <span className="timer-status"><i aria-hidden="true" />{TIMER_LABEL[timerStatus]}</span>
            </div>
            <div className="timer-clock" role="timer" aria-live="off">
              {formatTime(remainingSeconds)}
            </div>
          </section>

          <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
            <div className="leaderboard-heading">
              <div>
                <h2 id="leaderboard-title">생산 리더보드</h2>
              </div>
              <div className="total-production">
                <span>총 생산량</span>
                <strong>{totalPlanes}</strong>
                <em>대</em>
              </div>
            </div>

            {!state ? (
              <div className="leaderboard-loading" role="status">
                <span className="loading-plane" aria-hidden="true">✈</span>
                <p>생산 현황을 연결하고 있습니다</p>
              </div>
            ) : (
              <>
                <ol className={`ranking-list${state.teams.length === 0 ? " ranking-list--baseline-only" : ""}`}>
                  <li className="ranking-row ranking-row--baseline" aria-label="운영팀 기준 기록">
                    <span className="rank-number baseline-rank">기준</span>
                    <AirlineMark
                      code={state.baseline.airlineCode}
                      name={state.baseline.airlineName}
                      color={state.baseline.airlineColor}
                    />
                    <div className="team-name"><strong>운영팀</strong></div>
                    <div className="score-block"><strong>{state.baseline.score}</strong><span>대</span></div>
                  </li>
                  {leaderboardTeams.map((team) => {
                    const rank = state.teams.findIndex((rankedTeam) => rankedTeam.id === team.id) + 1;

                    return (
                      <li className={`ranking-row ranking-row--${Math.min(rank, 4)}${team.id === state.currentTeam?.id ? " ranking-row--current" : ""}`} key={team.id}>
                        <span className="rank-number">{String(rank).padStart(2, "0")}</span>
                        <AirlineMark code={team.airlineCode} name={team.airlineName} color={team.airlineColor} />
                        <div className="team-name"><strong>{team.name}</strong></div>
                        <div className="score-block"><strong>{team.score}</strong><span>대</span></div>
                      </li>
                    );
                  })}
                </ol>

                {state.teams.length === 0 && (
                  <div className="empty-board">
                    <span aria-hidden="true">✈</span>
                    <h3>첫 생산팀을 기다리고 있어요</h3>
                    <p>랜덤 추첨 화면에서 팀을 등록하면<br />이곳에 실시간 순위가 표시됩니다.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

    </main>
  );
}
