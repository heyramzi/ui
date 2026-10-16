<script lang="ts">
  import type { Icon } from "#lib/registry.js";
  import {
    ArrowsHorizontal,
    Article,
    BezierCurve,
    CaretDown,
    ChartBar,
    ChartBarHorizontal,
    ChartLine,
    ChartLineUp,
    ChartPie,
    Chat,
    Chats,
    Columns,
    CursorClick,
    DotsThree,
    Gauge,
    Hash,
    Image,
    Kanban,
    Keyboard,
    List,
    ListChecks,
    MonitorPlay,
    NotePencil,
    Palette,
    Presentation,
    Pulse,
    Quotes,
    RadioButton,
    Robot,
    SealCheck,
    SidebarSimple,
    Sparkle,
    SquaresFour,
    Square,
    Stack,
    Sun,
    Tabs,
    Tag,
    TextAa,
    Textbox,
    Tray,
    UserCircle,
    UsersThree,
    WaveSine,
    Wrench,
  } from "phosphor-svelte";

  let { icon, class: className = "size-5" }: { icon: Icon; class?: string } = $props();
  const map = { area: ChartLineUp, line: ChartLine, bar: ChartBar, pie: ChartPie, ring: RadioButton, gauge: Gauge, activity: Pulse, dashboard: SquaresFour, hash: Hash, spline: WaveSine, click: CursorClick, tag: Tag, form: Textbox, square: Square, tabs: Tabs, move: ArrowsHorizontal, sparkles: Sparkle, type: TextAa, kanban: Kanban, list: ListChecks, gantt: ChartBarHorizontal, dot: RadioButton, statusicon: SealCheck, avatar: Robot, cast: UsersThree, deck: Presentation, spotlight: Sun, compare: Columns, beam: BezierCurve, animate: Stack, reveal: Image, dialog: Chat, accordion: List, select: CaretDown, avataricon: UserCircle, prompt: NotePencil, conversation: Chats, thinking: DotsThree, typing: Keyboard, tradeicon: Wrench, brand: Palette, testimonial: Quotes, reviewpage: MonitorPlay, inbox: Tray, sidepanel: SidebarSimple, editor: Article };
  const Cmp = $derived(map[icon]);
</script>

<Cmp class={className} />
