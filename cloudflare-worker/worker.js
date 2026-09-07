/**
 * Basic 認証つきリバースプロキシ Worker
 *
 * このWorkerは、GitHub Pages上の静的サイト（ORIGIN）へのアクセスに
 * 実際のHTTP Basic認証をかけます。認証情報は Wrangler Secrets
 * (BASIC_AUTH_USER / BASIC_AUTH_PASS) として設定してください。
 * コード中にID/パスワードを直接書かないでください。
 */

const ORIGIN = "https://morimori1974.github.io/nara-nakamachi-business-map";

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function unauthorizedResponse() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Nara Business Map", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const expectedUser = env.BASIC_AUTH_USER;
    const expectedPass = env.BASIC_AUTH_PASS;

    if (!expectedUser || !expectedPass) {
      return new Response(
        "Server misconfigured: BASIC_AUTH_USER / BASIC_AUTH_PASS secrets are not set.",
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Basic ")) {
      return unauthorizedResponse();
    }

    let decoded;
    try {
      decoded = atob(authHeader.slice(6));
    } catch (e) {
      return unauthorizedResponse();
    }

    const sepIndex = decoded.indexOf(":");
    if (sepIndex === -1) return unauthorizedResponse();

    const user = decoded.slice(0, sepIndex);
    const pass = decoded.slice(sepIndex + 1);

    const userOk = timingSafeEqual(user, expectedUser);
    const passOk = timingSafeEqual(pass, expectedPass);
    if (!userOk || !passOk) {
      return unauthorizedResponse();
    }

    // 認証成功 -> GitHub Pages のコンテンツを取得して返す
    const url = new URL(request.url);
    const originUrl = ORIGIN + url.pathname + url.search;

    const originRequest = new Request(originUrl, {
      method: request.method,
      headers: request.headers,
      redirect: "follow",
    });
    // Host ヘッダはoriginにあわせて上書きされるようfetch側に任せる
    originRequest.headers.delete("host");

    const originResponse = await fetch(originRequest);

    // レスポンスをコピーして返す（GitHub Pagesのキャッシュ関連ヘッダはそのまま透過）
    const responseHeaders = new Headers(originResponse.headers);
    responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: responseHeaders,
    });
  },
};
