// Worst-case data for the library's components, shaped like the demo data beside it.
// Every value is a realistic name pattern or the longest string a backend would accept.
export type Mode = "demo" | "worst" | "empty" | "one" | "huge";
export const MODES: { value: Mode; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "worst", label: "Worst case" },
  { value: "empty", label: "Empty" },
  { value: "one", label: "One" },
  { value: "huge", label: "1,284 rows" },
];

export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  amount: number;
  count: number;
  avatar?: string;
  tags: string[];
};

const DEMO: Person[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@acme.com",
    role: "Designer",
    status: "active",
    amount: 1200,
    count: 12,
    tags: ["design", "q3"],
  },
  {
    id: "2",
    name: "Sam Lee",
    email: "sam@acme.com",
    role: "Engineer",
    status: "invited",
    amount: 840,
    count: 3,
    tags: ["frontend"],
  },
  {
    id: "3",
    name: "Priya Nair",
    email: "priya@acme.com",
    role: "Product",
    status: "active",
    amount: 2310,
    count: 28,
    tags: ["q3", "urgent"],
  },
];

const WORST: Person[] = [
  {
    id: "w1",
    name: "Aleksandra Wiśniewska-Kowalczyk",
    email: "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
    role: "Senior Product Design Engineer, Platform Infrastructure",
    status: "Invitation expired 12 days ago",
    amount: 12345678.9,
    count: 1284,
    avatar: "/missing-avatar.png",
    tags: [
      "design",
      "frontend",
      "q3",
      "urgent",
      "needs-review",
      "customer-feedback-from-enterprise-onboarding",
      "design",
      "billing",
      "ops",
      "legal",
      "design-systems",
      "research",
    ],
  },
  {
    id: "w2",
    name: "Jo",
    email: "a@b.co",
    role: "",
    status: "active",
    amount: -42.5,
    count: 1,
    tags: [],
  },
  {
    id: "w3",
    name: "🦊 Fox",
    email: "first.last+billing-notifications@example.com",
    role: "Intern",
    status: "expired",
    amount: 0.1 + 0.2,
    count: 0,
    tags: ["x"],
  },
  {
    id: "w4",
    name: "Đặng Thị Ngọc Hân",
    email: "ops@sub.department.region.example.co.uk",
    role: "Benachrichtigungseinstellungen",
    status: "suspended",
    amount: 1000000,
    count: 1000000,
    tags: ["design"],
  },
  {
    id: "w5",
    name: "王秀英",
    email: "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f@example.org",
    role: "<b>Lead</b> &amp; **Owner**",
    status: "invited",
    amount: Number.NaN,
    count: 7,
    tags: [],
  },
  {
    id: "w6",
    name: "Christopher Alexander Montgomery III",
    email: "christopher@example.com",
    role: "Paramètres de confidentialité et de sécurité",
    status: "active",
    amount: 99,
    count: 99,
    tags: ["a", "b"],
  },
  {
    id: "w7",
    name: "نور الهدى عبد الرحمن",
    email: "nour@example.com",
    role: "Contractor",
    status: "active",
    amount: 5,
    count: 2,
    tags: [],
  },
  {
    id: "w8",
    name: "  Sam   Lee ",
    email: "sam.lee@example.com",
    role: "Q3 Board Deck - FINAL (revised) v12 [approved by legal].pdf",
    status: "active",
    amount: 142,
    count: 142,
    tags: [],
  },
  {
    id: "w9",
    name: "",
    email: "no-name@example.com",
    role: "",
    status: "invited",
    amount: 3,
    count: 3,
    tags: [],
  },
  {
    id: "w10",
    name: "dana",
    email: "dana@example.com",
    role: "Intern",
    status: "active",
    amount: 3,
    count: 3,
    tags: [],
  },
];

function huge(): Person[] {
  return Array.from({ length: 1284 }, (_, i) => {
    const base = WORST[i % WORST.length];
    return { ...base, id: `h${i}`, count: i + 1, amount: (i + 1) * 1234.5 };
  });
}

export function people(mode: Mode): Person[] {
  if (mode === "empty") return [];
  if (mode === "one") return [{ ...DEMO[0], count: 1 }];
  if (mode === "worst") return WORST;
  if (mode === "huge") return huge();
  return DEMO;
}

export const BAD_URL =
  "https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved";
