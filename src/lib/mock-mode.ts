import { useSyncExternalStore } from "react";

const KEY_MODE = "ip-mock-mode";
const KEY_DATA = "ip-mock-data-v1";
const EVT = "ip-mock-mode-changed";

export type MockMaterial = {
  id: string;
  name: string;
  description: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[] | null;
  created_at: string;
  url: string;
  class_id: string | null;
  student_id: string | null;
  school_id: string;
  time_range_start: string | null;
  time_range_end: string | null;
  duration_seconds: number | null;
  synced_at: string | null;
  sync_error: string | null;
  classes?: { name: string } | null;
  students?: { full_name: string } | null;
};

export type MockSuggestion = {
  id: string;
  type: "reforco" | "emocional" | "encaminhamento" | "engajamento" | "outro";
  title: string;
  description: string;
  status: "pending" | "applied" | "scheduled" | "discarded";
  created_at: string;
  school_id: string;
  class_id: string | null;
  student_id: string | null;
  classes?: { name: string } | null;
  students?: { full_name: string } | null;
};

export type MockEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  school_id: string;
  class_id: string | null;
  classes?: { name: string } | null;
};

export type MockAnnouncement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  school_id: string | null;
  schools?: { name: string } | null;
};

export type MockClass = {
  id: string;
  name: string;
  grade: string;
  year: number;
  students: { id: string; risk: "low" | "medium" | "high" }[];
};

export type MockStudent = {
  id: string;
  full_name: string;
  class_id: string;
  class_name: string;
  grade: string;
  risk: "low" | "medium" | "high";
  attendance_rate: number;
  has_pei: boolean;
  guardian_name: string | null;
  guardian_phone: string | null;
  birth_date: string | null;
  skills: { label: string; value: number }[];
  observations: {
    id: string;
    content: string;
    type: "text" | "audio" | "behavior" | "academic";
    created_at: string;
    author: string;
  }[];
};

export type MockData = {
  materials: MockMaterial[];
  suggestions: MockSuggestion[];
  events: MockEvent[];
  announcements: MockAnnouncement[];
  classes: MockClass[];
  students: MockStudent[];
  stats: {
    classCount: number;
    studentCount: number;
    highRisk: number;
  };
};

const SCHOOL_ID = "mock-school-1";

function seed(): MockData {
  const now = Date.now();
  const day = 86400000;
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  const classes: MockClass[] = [
    { id: "c1", name: "5º A", grade: "5º ano", year: 2026, students: [
      { id: "s1", risk: "high" }, { id: "s2", risk: "medium" }, { id: "s3", risk: "low" },
      { id: "s4", risk: "low" }, { id: "s5", risk: "low" }, { id: "s6", risk: "medium" },
    ]},
    { id: "c2", name: "4º B", grade: "4º ano", year: 2026, students: [
      { id: "s7", risk: "high" }, { id: "s8", risk: "low" }, { id: "s9", risk: "low" },
      { id: "s10", risk: "medium" }, { id: "s11", risk: "low" },
    ]},
    { id: "c3", name: "3º C", grade: "3º ano", year: 2026, students: [
      { id: "s12", risk: "low" }, { id: "s13", risk: "low" }, { id: "s14", risk: "high" },
    ]},
  ];

  const studentNames: Record<string, string> = {
    s1: "Ana Beatriz Silva", s2: "Bruno Ferreira Costa", s3: "Camila Rocha Lima",
    s4: "Daniel Souza Alves", s5: "Eduarda Martins Prado", s6: "Felipe Barros Nogueira",
    s7: "Lucas Mendes", s8: "Marina Ribeiro", s9: "Nicolas Almeida",
    s10: "Olívia Cardoso", s11: "Pedro Henrique Ramos",
    s12: "Sofia Vasconcelos", s13: "Thiago Moreira", s14: "Rafael Nunes",
  };
  const guardians: Record<string, [string, string]> = {
    s1: ["Cláudia Silva", "(11) 99812-4501"],
    s2: ["Roberto Costa", "(11) 99777-3320"],
    s7: ["Fernanda Mendes", "(11) 99231-8890"],
    s14: ["Vera Nunes", "(11) 98122-7710"],
  };
  const obsBank: Record<string, MockStudent["observations"]> = {
    s1: [
      { id: "o1", type: "behavior", author: "Prof. Márcia",
        content: "Ana chegou muito cansada hoje; disse que não dormiu bem novamente. Conversei em particular após a aula.",
        created_at: iso(-day * 1) },
      { id: "o2", type: "audio", author: "Coord. Rita",
        content: "Áudio anexado da mãe relatando conflitos familiares. Acionar rede de proteção se persistir.",
        created_at: iso(-day * 2) },
      { id: "o3", type: "academic", author: "Prof. Márcia",
        content: "Melhora na leitura em voz alta esta semana. Continua com dificuldade em interpretação.",
        created_at: iso(-day * 5) },
    ],
    s7: [
      { id: "o4", type: "academic", author: "Prof. João",
        content: "Erros recorrentes em frações equivalentes na avaliação bimestral. Encaminhado para reforço.",
        created_at: iso(-day * 2) },
      { id: "o5", type: "behavior", author: "Prof. João",
        content: "Muito participativo nas atividades em grupo; gosta de liderar debates.",
        created_at: iso(-day * 6) },
    ],
    s14: [
      { id: "o6", type: "academic", author: "Prof. Carla",
        content: "Dificuldade persistente na leitura em voz alta; sugerido avaliação fonoaudiológica.",
        created_at: iso(-day * 3) },
    ],
  };
  const skillsFor = (risk: "low" | "medium" | "high") => {
    const base = risk === "high" ? 45 : risk === "medium" ? 65 : 80;
    const jitter = (n: number) => Math.max(20, Math.min(98, base + n));
    return [
      { label: "Leitura", value: jitter(6) },
      { label: "Escrita", value: jitter(-4) },
      { label: "Matemática", value: jitter(2) },
      { label: "Interpretação", value: jitter(-8) },
      { label: "Socioemocional", value: jitter(10) },
    ];
  };
  const students: MockStudent[] = classes.flatMap((c) =>
    c.students.map((st, idx): MockStudent => {
      const [gName, gPhone] = guardians[st.id] ?? [null, null];
      const attendance = st.risk === "high" ? 68 + idx : st.risk === "medium" ? 82 + idx : 92 + (idx % 5);
      return {
        id: st.id,
        full_name: studentNames[st.id] ?? `Aluno ${st.id}`,
        class_id: c.id,
        class_name: c.name,
        grade: c.grade,
        risk: st.risk,
        attendance_rate: Math.min(99, attendance),
        has_pei: st.id === "s1" || st.id === "s14",
        guardian_name: gName,
        guardian_phone: gPhone,
        birth_date: iso(-day * (365 * (10 + idx) + 30)),
        skills: skillsFor(st.risk),
        observations: obsBank[st.id] ?? [],
      };
    }),
  );

  const materials: MockMaterial[] = [
    {
      id: "m1", name: "Áudio da mãe da Ana - situação em casa",
      description: "Mãe relata dificuldades familiares que estão afetando o sono da aluna.",
      mime_type: "audio/mpeg", size_bytes: 1_240_000, tags: ["família", "emocional"],
      created_at: iso(-day * 1), url: "mock/audio-ana.mp3",
      class_id: "c1", student_id: "s1", school_id: SCHOOL_ID,
      time_range_start: iso(-day * 2), time_range_end: iso(-day * 1),
      duration_seconds: 184, synced_at: iso(-day * 1), sync_error: null,
      classes: { name: "5º A" }, students: { full_name: "Ana Beatriz Silva" },
    },
    {
      id: "m2", name: "Atividade de matemática - fração",
      description: "Prova bimestral do Lucas com erros recorrentes em frações equivalentes.",
      mime_type: "image/jpeg", size_bytes: 2_800_000, tags: ["matemática", "reforço"],
      created_at: iso(-day * 2), url: "mock/prova-lucas.jpg",
      class_id: "c2", student_id: "s7", school_id: SCHOOL_ID,
      time_range_start: null, time_range_end: null,
      duration_seconds: null, synced_at: null, sync_error: "Ingest 502: gateway",
      classes: { name: "4º B" }, students: { full_name: "Lucas Mendes" },
    },
    {
      id: "m3", name: "Redação sobre férias - turma 5A",
      description: "Compilado das redações escritas em sala.",
      mime_type: "application/pdf", size_bytes: 540_000, tags: ["português"],
      created_at: iso(-day * 3), url: "mock/redacoes.pdf",
      class_id: "c1", student_id: null, school_id: SCHOOL_ID,
      time_range_start: null, time_range_end: null,
      duration_seconds: null, synced_at: iso(-day * 3), sync_error: null,
      classes: { name: "5º A" }, students: null,
    },
    {
      id: "m4", name: "Foto do mural coletivo",
      description: "Trabalho colaborativo sobre sustentabilidade.",
      mime_type: "image/png", size_bytes: 3_400_000, tags: ["projeto"],
      created_at: iso(-day * 4), url: "mock/mural.png",
      class_id: "c3", student_id: null, school_id: SCHOOL_ID,
      time_range_start: null, time_range_end: null,
      duration_seconds: null, synced_at: iso(-day * 4), sync_error: null,
      classes: { name: "3º C" }, students: null,
    },
    {
      id: "m5", name: "Áudio - reunião com responsáveis",
      description: "Gravação da reunião mensal com pais e responsáveis do 4º B.",
      mime_type: "audio/mpeg", size_bytes: 5_600_000, tags: ["reunião"],
      created_at: iso(-day * 5), url: "mock/reuniao.mp3",
      class_id: "c2", student_id: null, school_id: SCHOOL_ID,
      time_range_start: iso(-day * 5), time_range_end: iso(-day * 5 + 3600_000),
      duration_seconds: 2450, synced_at: iso(-day * 5), sync_error: null,
      classes: { name: "4º B" }, students: null,
    },
    ...Array.from({ length: 12 }).map((_, i): MockMaterial => ({
      id: `m${i + 6}`, name: `Registro complementar ${i + 1}`,
      description: "Material adicional utilizado para validação do catálogo.",
      mime_type: i % 3 === 0 ? "audio/mpeg" : i % 3 === 1 ? "image/jpeg" : "application/pdf",
      size_bytes: 200_000 + i * 15_000, tags: i % 2 ? ["extra"] : ["extra", "validação"],
      created_at: iso(-day * (6 + i)), url: `mock/extra-${i + 1}`,
      class_id: classes[i % 3].id, student_id: null, school_id: SCHOOL_ID,
      time_range_start: null, time_range_end: null,
      duration_seconds: i % 3 === 0 ? 60 + i * 5 : null,
      synced_at: i % 2 ? iso(-day * (6 + i)) : null, sync_error: null,
      classes: { name: classes[i % 3].name }, students: null,
    })),
  ];

  const suggestions: MockSuggestion[] = [
    { id: "sg1", type: "reforco", title: "Reforço de frações para Lucas",
      description: "Aplicar 3 sessões curtas de exercícios direcionados.",
      status: "pending", created_at: iso(-day * 0.5),
      school_id: SCHOOL_ID, class_id: "c2", student_id: "s7",
      classes: { name: "4º B" }, students: { full_name: "Lucas Mendes" } },
    { id: "sg2", type: "emocional", title: "Acolhimento individual - Ana",
      description: "Conversa breve com a orientadora após relato familiar.",
      status: "pending", created_at: iso(-day * 1),
      school_id: SCHOOL_ID, class_id: "c1", student_id: "s1",
      classes: { name: "5º A" }, students: { full_name: "Ana Beatriz Silva" } },
    { id: "sg3", type: "engajamento", title: "Projeto colaborativo - 3º C",
      description: "Ampliar o mural com participação de outras turmas.",
      status: "pending", created_at: iso(-day * 2),
      school_id: SCHOOL_ID, class_id: "c3", student_id: null,
      classes: { name: "3º C" }, students: null },
    { id: "sg4", type: "encaminhamento", title: "Encaminhar para fonoaudiologia",
      description: "Aluno com dificuldade recorrente na leitura em voz alta.",
      status: "applied", created_at: iso(-day * 4),
      school_id: SCHOOL_ID, class_id: "c3", student_id: "s14",
      classes: { name: "3º C" }, students: { full_name: "Rafael Nunes" } },
    { id: "sg5", type: "reforco", title: "Grupo de leitura semanal",
      description: "Grupo de 4 alunos com dificuldade em interpretação.",
      status: "scheduled", created_at: iso(-day * 3),
      school_id: SCHOOL_ID, class_id: "c1", student_id: null,
      classes: { name: "5º A" }, students: null },
    { id: "sg6", type: "outro", title: "Revisar plano da semana",
      description: "Sugestão descartada porque já está no cronograma.",
      status: "discarded", created_at: iso(-day * 6),
      school_id: SCHOOL_ID, class_id: null, student_id: null,
      classes: null, students: null },
  ];

  const events: MockEvent[] = [
    { id: "e1", title: "Reunião pedagógica", description: "Alinhamento semanal.",
      location: "Sala dos professores", starts_at: iso(day * 1),
      school_id: SCHOOL_ID, class_id: null, classes: null },
    { id: "e2", title: "Conselho de classe 5º A", description: null,
      location: "Auditório", starts_at: iso(day * 3),
      school_id: SCHOOL_ID, class_id: "c1", classes: { name: "5º A" } },
    { id: "e3", title: "Feira de ciências", description: "Apresentação dos projetos.",
      location: "Pátio", starts_at: iso(day * 7),
      school_id: SCHOOL_ID, class_id: null, classes: null },
    { id: "e4", title: "Reunião de pais - 4º B", description: null,
      location: "Sala 12", starts_at: iso(day * 10),
      school_id: SCHOOL_ID, class_id: "c2", classes: { name: "4º B" } },
  ];

  const announcements: MockAnnouncement[] = [
    { id: "a1", title: "Recesso de emenda", body: "Não haverá aula na sexta.",
      created_at: iso(-day * 1), school_id: SCHOOL_ID, schools: { name: "Escola Municipal ANA" } },
    { id: "a2", title: "Novo protocolo de registros", body: "Sempre incluir intervalo de tempo.",
      created_at: iso(-day * 3), school_id: SCHOOL_ID, schools: { name: "Escola Municipal ANA" } },
    { id: "a3", title: "Bem-vindo ao app", body: "Explore o modo demo para conhecer o app.",
      created_at: iso(-day * 7), school_id: null, schools: null },
  ];

  const studentCount = classes.reduce((n, c) => n + c.students.length, 0);
  const highRisk = classes.reduce((n, c) => n + c.students.filter((s) => s.risk === "high").length, 0);

  return {
    materials, suggestions, events, announcements, classes, students,
    stats: { classCount: classes.length, studentCount, highRisk },
  };
}

function safeRead(): MockData {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY_DATA);
    if (!raw) {
      const fresh = seed();
      localStorage.setItem(KEY_DATA, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as MockData;
  } catch {
    return seed();
  }
}

function persist(data: MockData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_DATA, JSON.stringify(data));
  window.dispatchEvent(new Event(EVT));
}

export function getMockData(): MockData {
  return safeRead();
}

export function resetMockData(): MockData {
  const fresh = seed();
  persist(fresh);
  return fresh;
}

/** Exporta os dados mock atuais como string JSON (pretty). */
export function exportMockData(): string {
  return JSON.stringify(safeRead(), null, 2);
}

/**
 * Importa dados mock a partir de uma string JSON. Faz uma validação
 * mínima da forma esperada e persiste. Lança em caso de JSON inválido
 * ou estrutura incompatível.
 */
export function importMockData(raw: string): MockData {
  const parsed = JSON.parse(raw) as Partial<MockData>;
  const required: (keyof MockData)[] = [
    "materials", "suggestions", "events", "announcements", "classes", "students", "stats",
  ];
  for (const k of required) {
    if (!(k in parsed)) throw new Error(`Campo obrigatório ausente: ${k}`);
  }
  const data = parsed as MockData;
  persist(data);
  return data;
}

export function isMockModeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY_MODE);
  // Default: ON — validação sem depender da API
  return v === null ? true : v === "1";
}

export function setMockMode(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_MODE, on ? "1" : "0");
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useMockMode() {
  return useSyncExternalStore(subscribe, isMockModeEnabled, () => true);
}