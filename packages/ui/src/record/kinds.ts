import {
	CheckCircle,
	ClipboardText,
	CurrencyCircleDollar,
	EnvelopeSimple,
	File,
	Flag,
	Gavel,
	NavigationArrow,
	NotePencil,
	Phone,
	Receipt,
	Signpost,
	UsersThree,
} from "phosphor-svelte";
import type { RecordFilterDef, RecordKindDef } from "#src/record/types.js";

/** The kit's event kinds, drawn in plain English. A module adds its own beside them. */
export const DEFAULT_RECORD_KINDS: RecordKindDef[] = [
	{ key: "call", label: "Call", icon: Phone },
	{ key: "meeting", label: "Meeting", icon: UsersThree },
	{ key: "email", label: "Email", icon: EnvelopeSimple },
	{ key: "form", label: "Form", icon: ClipboardText },
	{ key: "note", label: "Note", icon: NotePencil },
	{ key: "status", label: "Where we are", icon: NavigationArrow },
	{ key: "stage", label: "Stage", icon: Signpost },
	{ key: "task.done", label: "Task done", icon: CheckCircle, tone: "success" },
	{ key: "milestone.done", label: "Step done", icon: Flag, tone: "success" },
	{ key: "invoice.sent", label: "Invoice", icon: Receipt },
	{ key: "payment", label: "Payment", icon: CurrencyCircleDollar, tone: "success" },
	{ key: "decision", label: "Decision", icon: Gavel },
	{ key: "file", label: "File", icon: File },
];

/** The chips over the timeline. Kinds a record has none of are not drawn. */
export const DEFAULT_RECORD_FILTERS: RecordFilterDef[] = [
	{ key: "calls", label: "Calls", kinds: ["call", "meeting"] },
	{ key: "notes", label: "Notes", kinds: ["note"] },
	{ key: "money", label: "Money", kinds: ["invoice.sent", "payment"] },
	{ key: "stage", label: "Stage", kinds: ["stage"] },
	{ key: "status", label: "Status", kinds: ["status"] },
];
