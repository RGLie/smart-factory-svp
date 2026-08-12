import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test, { after, before } from "node:test";

const port = 43000 + (process.pid % 1000);
const origin = `http://127.0.0.1:${port}`;
let server;
let serverOutput = "";

before(async () => {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
    { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js 서버가 시작되지 않았습니다.\n${serverOutput}`);
    }
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // 서버가 준비될 때까지 재시도합니다.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Next.js 서버 시작 시간이 초과되었습니다.\n${serverOutput}`);
});

after(() => {
  server?.kill("SIGTERM");
});

async function render(path = "/") {
  return fetch(`${origin}${path}`, { headers: { accept: "text/html" } });
}

test("renders the projector leaderboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>스마트 팩토리를 이겨라<\/title>/i);
  assert.match(html, /스마트 팩토리를 이겨라/);
  assert.match(html, /smart-factory-logo\.png/);
  assert.match(html, /생산 리더보드/);
  assert.match(html, /다음 팀의 항공사 선택을 기다리고 있습니다/);
  assert.doesNotMatch(html, /총 생산량/);
  assert.doesNotMatch(html, /PRODUCTION WINDOW|종이 수령|비행기 접기|활주로 통과|항공사 마킹/);
});

test("renders the mobile operator console", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /부스 운영 센터/);
  assert.match(html, /생산 타이머/);
  assert.match(html, /운영팀 기준 기록/);
  assert.match(html, /랜덤 항공사 관리/);
  assert.match(html, /로고 이미지/);
  assert.match(html, /삭제해도 이미 참가한 팀의 기록은 유지됩니다/);
  assert.match(html, /실시간 생산 입력/);
});

test("renders the laptop airline check-in", async () => {
  const response = await render("/checkin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /항공사 랜덤 체크인/);
  assert.match(html, /운명의 항공사를/);
  assert.match(html, /랜덤 항공사 뽑기/);
});

test("renders the hall of fame", async () => {
  const response = await render("/hall-of-fame");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /명예의 전당/);
  assert.match(html, /SMART FACTORY CHAMPIONS/);
  assert.match(html, /최고의 생산 기록을 세운 모든 팀을 축하합니다/);
  assert.match(html, /최종 기록을 불러오고 있습니다/);
});
