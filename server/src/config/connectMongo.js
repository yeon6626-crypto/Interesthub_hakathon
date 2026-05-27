const dns = require('dns');
const { promisify } = require('util');
const mongoose = require('mongoose');

const DEFAULT_PUBLIC_DNS = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];
const resolveSrv = promisify(dns.resolveSrv);

/**
 * @param {{ usePublicDns?: boolean }} options
 */
function configureDns(options = {}) {
  const { usePublicDns = false } = options;

  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }

  const flag = String(process.env.DNS_SERVERS || '').trim().toLowerCase();

  if (flag === 'system') {
    console.log('[mongo] Using Windows/system DNS (DNS_SERVERS=system)');
    return;
  }

  if (flag === 'off') {
    return;
  }

  const servers =
    flag && flag !== 'auto'
      ? flag
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : usePublicDns
        ? DEFAULT_PUBLIC_DNS
        : [];

  if (servers.length > 0) {
    dns.setServers(servers);
    console.log('[mongo] DNS servers:', servers.join(', '));
  }
}

function getMongooseOptions() {
  return {
    serverSelectionTimeoutMS: 20000,
    family: 4,
  };
}

/**
 * @param {string} srvUri mongodb+srv://...
 */
function getSrvHostname(srvUri) {
  const withoutScheme = srvUri.replace(/^mongodb\+srv:\/\//i, '');
  const hostPart = withoutScheme.split('/')[0].split('?')[0];
  const atIndex = hostPart.lastIndexOf('@');
  return atIndex >= 0 ? hostPart.slice(atIndex + 1) : hostPart;
}

/**
 * SRV DNS가 되는지 사전 확인 (로그용)
 * @param {string} srvUri
 */
async function probeSrvLookup(srvUri) {
  const host = getSrvHostname(srvUri);
  if (!host) return;

  const srvName = `_mongodb._tcp.${host}`;
  try {
    const records = await resolveSrv(srvName);
    console.log(
      `[mongo] SRV lookup OK (${records.length} host(s)) via configured DNS`
    );
  } catch (error) {
    console.warn(`[mongo] SRV lookup failed for ${srvName}:`, error.message);
  }
}

/**
 * @param {Error} error
 */
function logMongoConnectionHelp(error) {
  const message = String(error?.message || error);
  console.error('\n[mongo] 연결 실패:', message);

  if (/querySrv|ECONNREFUSED|ENOTFOUND|ETIMEOUT/i.test(message)) {
    console.error(`
[mongo] Atlas SRV DNS 오류 — Network Access(0.0.0.0/0)와 별개로 PC DNS 문제인 경우가 많습니다.

  ▶ server/.env 에 아래 한 줄 추가 후 재시작:
     DNS_SERVERS=8.8.8.8,1.1.1.1

  ▶ 또는 Atlas Connect → Drivers → 표준 연결 문자열(mongodb://)을
     MONGODB_ATLAS_STANDARD_URL 에 설정 (SRV 우회)

  ▶ VPN/보안 프로그램이 DNS(53번)를 막는지 확인
`);
  }
}

/**
 * @param {string} uri
 */
async function connectMongo(uri) {
  const isSrv = /^mongodb\+srv:\/\//i.test(uri);

  configureDns({ usePublicDns: isSrv });

  if (isSrv) {
    await probeSrvLookup(uri);
  }

  try {
    await mongoose.connect(uri, getMongooseOptions());
    return;
  } catch (firstError) {
    if (!isSrv || !/querySrv/i.test(String(firstError.message))) {
      throw firstError;
    }

    console.warn(
      '[mongo] SRV 연결 실패 — 공용 DNS(8.8.8.8)로 재시도합니다...'
    );
    dns.setServers(DEFAULT_PUBLIC_DNS);
    await probeSrvLookup(uri);
    await mongoose.connect(uri, getMongooseOptions());
  }
}

module.exports = {
  connectMongo,
  logMongoConnectionHelp,
  configureDns,
};
