export const CAREER_CARDS = [
  {
    id: 'backend-dev',
    className: '개발자',
    title: '백엔드 개발자',
    icon: '⚙️',
    rarity: 'rare',
    description:
      '서버·API·데이터베이스를 설계하고 운영하며, 안정적인 서비스 백엔드를 구축합니다.',
    skills: ['Node.js / Express', 'REST API 설계', 'DB 모델링', '인증·보안'],
    specs: ['JavaScript/TypeScript', 'SQL & NoSQL', 'Git', '클라우드 기초'],
  },
  {
    id: 'frontend-dev',
    className: '개발자',
    title: '프론트엔드 개발자',
    icon: '🎨',
    rarity: 'rare',
    description:
      '사용자가 보는 화면과 인터랙션을 구현하며, UX를 코드로 완성합니다.',
    skills: ['React / Vue', '반응형 UI', '상태 관리', '웹 접근성'],
    specs: ['HTML/CSS', 'JavaScript', 'Figma 협업', '성능 최적화'],
  },
  {
    id: 'data-scientist',
    className: '분석가',
    title: '데이터 사이언티스트',
    icon: '📊',
    rarity: 'epic',
    description:
      '데이터를 수집·분석해 인사이트를 도출하고, 예측 모델을 만듭니다.',
    skills: ['Python 분석', '머신러닝', '시각화', '통계적 사고'],
    specs: ['Pandas/NumPy', 'SQL', 'Jupyter', '비즈니스 이해'],
  },
  {
    id: 'ux-designer',
    className: '디자이너',
    title: 'UX 디자이너',
    icon: '✨',
    rarity: 'rare',
    description:
      '사용자 리서치와 프로토타이핑으로 직관적인 제품 경험을 설계합니다.',
    skills: ['사용자 리서치', '와이어프레임', '프로토타입', 'Usability 테스트'],
    specs: ['Figma', '디자인 시스템', '협업 커뮤니케이션', '접근성 가이드'],
  },
  {
    id: 'devops',
    className: '엔지니어',
    title: 'DevOps 엔지니어',
    icon: '🚀',
    rarity: 'epic',
    description:
      '배포·모니터링·인프라 자동화로 개발과 운영 사이를 연결합니다.',
    skills: ['CI/CD', '컨테이너', '클라우드 인프라', '장애 대응'],
    specs: ['Docker/K8s', 'AWS/GCP', 'Linux', 'IaC(Terraform)'],
  },
  {
    id: 'mobile-dev',
    className: '개발자',
    title: '모바일 앱 개발자',
    icon: '📱',
    rarity: 'common',
    description: 'iOS/Android 앱을 개발하고 스토어 배포까지 담당합니다.',
    skills: ['네이티브/크로스플랫폼', '앱 UI 구현', '푸시·결제 연동'],
    specs: ['Swift/Kotlin 또는 React Native', '앱 스토어 가이드', '성능 튜닝'],
  },
  {
    id: 'ai-engineer',
    className: '연구원',
    title: 'AI 엔지니어',
    icon: '🤖',
    rarity: 'epic',
    description:
      'LLM·컴퓨터 비전 등 AI 모델을 서비스에 적용하고 최적화합니다.',
    skills: ['딥러닝', '프롬프트 엔지니어링', 'MLOps', '모델 평가'],
    specs: ['Python', 'PyTorch/TensorFlow', 'GPU 서빙', '데이터 파이프라인'],
  },
  {
    id: 'game-dev',
    className: '크리에이터',
    title: '게임 개발자',
    icon: '🎮',
    rarity: 'rare',
    description:
      '게임 로직·그래픽·사운드를 구현해 플레이 경험을 만듭니다.',
    skills: ['게임 엔진', '물리·충돌', '멀티플레이', '밸런싱'],
    specs: ['Unity/Unreal', 'C#/C++', '3D·2D 에셋 파이프라인'],
  },
  {
    id: 'pm',
    className: '기획자',
    title: '프로덕트 매니저',
    icon: '📋',
    rarity: 'common',
    description:
      '제품 방향을 정하고 팀을 조율해 사용자 가치를 전달합니다.',
    skills: ['로드맵 기획', '우선순위 결정', '스테이크홀더 소통'],
    specs: ['데이터 기반 의사결정', 'Agile/Scrum', '문서화', '시장 분석'],
  },
  {
    id: 'security',
    className: '수호자',
    title: '보안 엔지니어',
    icon: '🛡️',
    rarity: 'epic',
    description:
      '시스템 취약점을 분석하고 침해 사고를 예방·대응합니다.',
    skills: ['침투 테스트', '보안 아키텍처', '암호화', '컴플라이언스'],
    specs: ['네트워크 보안', 'OWASP', '로그 분석', '인증 체계'],
  },
  {
    id: 'renewable-researcher',
    className: '연구원',
    title: '재생에너지 연구원',
    icon: '🌱',
    rarity: 'rare',
    description:
      '태양광·풍력 등 친환경 에너지 기술을 연구·개선합니다.',
    skills: ['에너지 시스템 설계', '효율 분석', '환경 영향 평가'],
    specs: ['전력전자', '재생에너지 공학', '실험·시뮬레이션'],
  },
  {
    id: 'embedded',
    className: '엔지니어',
    title: '임베디드 엔지니어',
    icon: '🔌',
    rarity: 'common',
    description:
      '하드웨어에 맞춘 펌웨어와 IoT 시스템을 개발합니다.',
    skills: ['마이크로컨트롤러', 'RTOS', '센서 연동', '저전력 설계'],
    specs: ['C/C++', '회로 기초', '디버깅', '통신 프로토콜'],
  },
]

export const GACHA_COST = 500
export const GACHA_DRAW_COUNT = 5

export function drawRandomCards(count = GACHA_DRAW_COUNT) {
  const pool = [...CAREER_CARDS]
  const drawn = []

  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length)
    drawn.push(pool.splice(index, 1)[0])
  }

  return drawn
}
