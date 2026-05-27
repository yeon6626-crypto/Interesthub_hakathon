const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/interesthub';

/**
 * server/.env 후보 경로 (실행 cwd에 따라 달라질 수 있음)
 * @returns {string[]}
 */
function getEnvFileCandidates() {
  const serverRoot = path.resolve(__dirname, '../..');
  return [
    path.join(serverRoot, '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server', '.env'),
  ];
}

/**
 * @returns {{ envPath: string, result: import('dotenv').DotenvConfigOutput, parsed: Record<string, string> }}
 */
function loadEnvFile() {
  const candidates = getEnvFileCandidates();
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!envPath) {
    return {
      envPath: candidates[0],
      result: { parsed: undefined, error: new Error('.env file not found') },
      parsed: {},
    };
  }

  const fileContents = fs.readFileSync(envPath, 'utf8');
  const parsed = dotenv.parse(fileContents);

  // OS/쉘에 빈 값이 이미 있으면 dotenv 기본값은 덮어쓰지 않음 → override
  const result = dotenv.config({
    path: envPath,
    override: true,
  });

  // parsed 객체 기준으로 process.env 동기화 (이중 보장)
  for (const [key, value] of Object.entries(parsed)) {
    if (value != null) {
      process.env[key] = value;
    }
  }

  return {
    envPath,
    result: result.error ? result : { ...result, parsed },
    parsed,
  };
}

const { envPath: ENV_FILE_PATH, result: dotenvResult, parsed: dotenvParsed } =
  loadEnvFile();

/**
 * @param {string} uri
 */
function maskMongoUri(uri) {
  if (!uri) return '(empty)';
  return uri.replace(/:([^:@/]+)@/, ':****@');
}

/**
 * @param {Record<string, string>} parsed
 */
function resolveMongoDbUri(parsed = dotenvParsed) {
  /** SRV(DNS) 실패 시 — Atlas 표준 연결 문자열(mongodb://) 우선 */
  const atlasStandard = String(
    process.env.MONGODB_ATLAS_STANDARD_URL ||
      parsed.MONGODB_ATLAS_STANDARD_URL ||
      ''
  ).trim();
  if (atlasStandard) return atlasStandard;

  const atlasUrl = String(
    process.env.MONGODB_ATLAS_URL || parsed.MONGODB_ATLAS_URL || ''
  ).trim();

  if (atlasUrl) return atlasUrl;

  const legacyUri = String(process.env.MONGODB_URI || parsed.MONGODB_URI || '').trim();
  if (legacyUri.startsWith('mongodb+srv://') || legacyUri.startsWith('mongodb://')) {
    if (legacyUri !== LOCAL_MONGODB_URI) return legacyUri;
  }

  return LOCAL_MONGODB_URI;
}

function logEnvStatus() {
  const atlasStandard = String(
    dotenvParsed.MONGODB_ATLAS_STANDARD_URL || ''
  ).trim();
  const atlasFromFile = String(dotenvParsed.MONGODB_ATLAS_URL || '').trim();
  const atlasFromProcess = String(process.env.MONGODB_ATLAS_URL || '').trim();
  const mongodbUri = resolveMongoDbUri();
  const usesSrv = mongodbUri.startsWith('mongodb+srv://');

  console.log('[env] cwd:', process.cwd());
  console.log('[env] .env path:', ENV_FILE_PATH);
  console.log('[env] .env exists:', fs.existsSync(ENV_FILE_PATH));

  if (dotenvResult.error) {
    console.warn('[env] .env load failed:', dotenvResult.error.message);
  } else if (!fs.existsSync(ENV_FILE_PATH)) {
    console.warn('[env] .env not found — using defaults / process.env only');
  } else {
    console.log('[env] .env loaded OK');
    console.log(
      '[env] keys in file:',
      Object.keys(dotenvParsed).length
        ? Object.keys(dotenvParsed).join(', ')
        : '(none parsed)'
    );
  }

  console.log(
    '[env] MONGODB_ATLAS_STANDARD_URL:',
    atlasStandard ? 'set (non-SRV, preferred)' : 'not set'
  );
  console.log(
    '[env] MONGODB_ATLAS_URL in file:',
    atlasFromFile ? 'yes' : 'no'
  );
  console.log(
    '[env] MONGODB_ATLAS_URL in process.env:',
    atlasFromProcess ? 'yes' : 'no'
  );
  console.log(
    '[env] MongoDB target:',
    atlasFromProcess || atlasFromFile || atlasStandard ? 'Atlas' : 'local',
    usesSrv ? '(SRV — DNS 필요)' : '',
    '→',
    maskMongoUri(mongodbUri)
  );
}

const mongodbUri = resolveMongoDbUri();
const isAtlasMongo = mongodbUri !== LOCAL_MONGODB_URI;

logEnvStatus();

const env = {
  port: Number(process.env.PORT) || 5000,
  mongodbUri,
  isAtlasMongo,
  envFilePath: ENV_FILE_PATH,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'interesthub-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = env;
