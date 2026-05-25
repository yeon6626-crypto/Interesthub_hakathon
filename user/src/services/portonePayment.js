/** 포트원 V2 대표 상점 ID (Interesthub) */
export const PORTONE_STORE_ID = 'store-708b7f28-dc35-4361-b7b2-ecc978abdc53'

/** 포트원 V2 채널 키 (inicis_v2 · Interesthub) */
export const PORTONE_CHANNEL_KEY = 'channel-key-4d52a984-f5ae-48a4-b3fd-2f7fb92d2a21'

const DEFAULT_CUSTOMER_NAME = '김동연'
const DEFAULT_CUSTOMER_EMAIL = 'yeon6626@gmail.com'
const DEFAULT_CUSTOMER_PHONE = '010-0000-0000'

/**
 * @param {object} pkg diaPackages 항목
 * @param {{ nickname?: string, name?: string, email?: string } | null | undefined} user
 * @returns {Promise<{ success: true, payment: object } | { success: false, message: string }>}
 */
export async function requestDiaPackagePayment(pkg, user) {
  const PortOne = window.PortOne

  if (!PortOne?.requestPayment) {
    return {
      success: false,
      message: '포트원 V2 결제 모듈을 불러올 수 없습니다.',
    }
  }

  const customerName =
    user?.nickname || user?.name || DEFAULT_CUSTOMER_NAME
  const customerEmail = user?.email || DEFAULT_CUSTOMER_EMAIL

  try {
    const payment = await PortOne.requestPayment({
      storeId: PORTONE_STORE_ID,
      channelKey: PORTONE_CHANNEL_KEY,
      paymentId: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      orderName: pkg.name,
      totalAmount: pkg.priceKrw,
      currency: 'CURRENCY_KRW',
      payMethod: 'CARD',
      customer: {
        name: customerName,
        fullName: customerName,
        email: customerEmail,
        phoneNumber: user?.phoneNumber || DEFAULT_CUSTOMER_PHONE,
      },
    })

    if (payment?.code !== undefined) {
      return {
        success: false,
        message: payment.message || '결제에 실패했습니다.',
      }
    }

    return { success: true, payment }
  } catch (err) {
    return {
      success: false,
      message: err?.message || '결제가 취소되었습니다.',
    }
  }
}
