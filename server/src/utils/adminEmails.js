/**
 * 관리자 이메일 화이트리스트 (쉼표 구분)
 * 예: ADMIN_EMAILS=admin@example.com,ops@example.com
 */
function getAdminEmailSet() {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * @param {string | undefined | null} email
 */
function isAdminEmail(email) {
  const adminEmails = getAdminEmailSet();
  if (adminEmails.size === 0 || !email) return false;
  return adminEmails.has(String(email).trim().toLowerCase());
}

module.exports = {
  getAdminEmailSet,
  isAdminEmail,
};
