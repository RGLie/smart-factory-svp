"use client";

import Link from "next/link";
import type { Team } from "../../lib/types";
import { useBoothState } from "../../lib/use-booth-state";

const PODIUM_ORDER = [1, 0, 2] as const;
const MEDAL_LABEL = ["GOLD", "SILVER", "BRONZE"] as const;

function TeamLogo({ team }: { team: Team }) {
  if (team.logoUrl) {
    return <img src={team.logoUrl} alt={`${team.airlineName} 로고`} />;
  }

  return (
    <span className="hof-team-code" style={{ backgroundColor: team.airlineColor }} aria-label={team.airlineCode}>
      {team.airlineCode.slice(0, 4)}
    </span>
  );
}

function PodiumCard({ team, rank }: { team: Team; rank: number }) {
  return (
    <article className={`hof-winner hof-winner--rank-${rank}`} aria-label={`${rank}위 ${team.name}`}>
      {rank === 1 && <span className="hof-crown" aria-hidden="true">★</span>}
      <div className="hof-medal" aria-hidden="true"><span>{rank}</span></div>
      <p className="hof-medal-label">{MEDAL_LABEL[rank - 1]}</p>
      <div className="hof-winner-logo"><TeamLogo team={team} /></div>
      <p className="hof-winner-airline">{team.airlineName}</p>
      <h2>{team.name}</h2>
      <div className="hof-winner-score"><strong>{team.score}</strong><span>대</span></div>
      <div className="hof-podium-step"><strong>{rank}</strong><span>PLACE</span></div>
    </article>
  );
}

export default function HallOfFamePage() {
  const { state, error } = useBoothState(5000);
  const teams = state?.teams ?? [];
  const podiumTeams = teams.slice(0, 3);

  return (
    <main className="hof-page">
      <div className="hof-glow hof-glow--gold" aria-hidden="true" />
      <div className="hof-glow hof-glow--blue" aria-hidden="true" />

      <header className="hof-header">
        <Link className="hof-brand" href="/" aria-label="전광판으로 돌아가기">
          <img src="/smart-factory-logo.png" alt="" />
          <span>스마트 팩토리를 이겨라</span>
        </Link>
        <span className={`hof-final-badge${error ? " hof-final-badge--error" : ""}`}>
          <i aria-hidden="true" /> {error ? "기록 확인 중" : "FINAL RECORD"}
        </span>
      </header>

      <section className="hof-hero" aria-labelledby="hall-of-fame-title">
        <p className="hof-kicker">SMART FACTORY CHAMPIONS</p>
        <h1 id="hall-of-fame-title">명예의 전당</h1>
        <p>최고의 생산 기록을 세운 모든 팀을 축하합니다.</p>
      </section>

      {!state ? (
        <section className="hof-loading" role="status">
          <span aria-hidden="true">✈</span>
          <p>{error ? "최종 기록을 다시 불러오고 있습니다" : "최종 기록을 불러오고 있습니다"}</p>
        </section>
      ) : teams.length === 0 ? (
        <section className="hof-loading">
          <span aria-hidden="true">◇</span>
          <h2>아직 등록된 팀 기록이 없습니다</h2>
        </section>
      ) : (
        <>
          <section className={`hof-podium hof-podium--${Math.min(podiumTeams.length, 3)}`} aria-label="수상팀">
            {PODIUM_ORDER.map((teamIndex) => {
              const team = podiumTeams[teamIndex];
              return team ? <PodiumCard team={team} rank={teamIndex + 1} key={team.id} /> : null;
            })}
          </section>

          <section className="hof-records" aria-labelledby="all-records-title">
            <div className="hof-records-heading">
              <div>
                <p>FINAL RANKING</p>
                <h2 id="all-records-title">전체 참가팀 기록</h2>
              </div>
              <strong>{teams.length}<span>팀 참가</span></strong>
            </div>

            <ol className="hof-record-list">
              {teams.map((team, index) => {
                const rank = index + 1;
                return (
                  <li className={`hof-record hof-record--rank-${Math.min(rank, 4)}`} key={team.id}>
                    <span className="hof-record-rank">{String(rank).padStart(2, "0")}</span>
                    <span className="hof-record-medal" aria-hidden="true">{rank <= 3 ? ["금", "은", "동"][rank - 1] : ""}</span>
                    <span className="hof-record-logo"><TeamLogo team={team} /></span>
                    <span className="hof-record-identity">
                      <strong>{team.name}</strong>
                      <small>{team.airlineName}</small>
                    </span>
                    <span className="hof-record-score"><strong>{team.score}</strong><small>대</small></span>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      <footer className="hof-footer">
        <span>SAMSUNG CSR FAIR · SMART FACTORY</span>
        <span>모든 참가팀의 도전과 완주를 축하합니다</span>
      </footer>
    </main>
  );
}
