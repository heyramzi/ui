<script lang="ts">
  import type { Icon } from "#lib/registry.js";
  import ChartArea from "@lucide/svelte/icons/chart-area";
  import ChartLine from "@lucide/svelte/icons/chart-line";
  import ChartColumn from "@lucide/svelte/icons/chart-column";
  import ChartPie from "@lucide/svelte/icons/chart-pie";
  import CircleDot from "@lucide/svelte/icons/circle-dot";
  import Gauge from "@lucide/svelte/icons/gauge";
  import Activity from "@lucide/svelte/icons/activity";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import Hash from "@lucide/svelte/icons/hash";
  import ChartSpline from "@lucide/svelte/icons/chart-spline";
  import MousePointerClick from "@lucide/svelte/icons/mouse-pointer-click";
  import Tag from "@lucide/svelte/icons/tag";
  import TextCursorInput from "@lucide/svelte/icons/text-cursor-input";
  import Square from "@lucide/svelte/icons/square";
  import PanelTop from "@lucide/svelte/icons/panel-top";
  import MoveHorizontal from "@lucide/svelte/icons/move-horizontal";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Type from "@lucide/svelte/icons/type";
  import Kanban from "@lucide/svelte/icons/kanban";
  import BadgeCheck from "@lucide/svelte/icons/badge-check";
  import Bot from "@lucide/svelte/icons/bot";
  import Users from "@lucide/svelte/icons/users";
  import Presentation from "@lucide/svelte/icons/presentation";
  import Sun from "@lucide/svelte/icons/sun";
  import Columns2 from "@lucide/svelte/icons/columns-2";
  import Spline from "@lucide/svelte/icons/spline";
  import Group from "@lucide/svelte/icons/group";
  import Image from "@lucide/svelte/icons/image";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import List from "@lucide/svelte/icons/list";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import CircleUserRound from "@lucide/svelte/icons/circle-user-round";
  import SquarePen from "@lucide/svelte/icons/square-pen";
  import MessagesSquare from "@lucide/svelte/icons/messages-square";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Send from "@lucide/svelte/icons/send";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import Wrench from "@lucide/svelte/icons/wrench";
  import PenTool from "@lucide/svelte/icons/pen-tool";
  import Brush from "@lucide/svelte/icons/brush";
  import Palette from "@lucide/svelte/icons/palette";
  import Quote from "@lucide/svelte/icons/quote";
  import MonitorPlay from "@lucide/svelte/icons/monitor-play";

  let { icon, class: className = "size-5" }: { icon: Icon; class?: string } = $props();
  const map = { area: ChartArea, line: ChartLine, bar: ChartColumn, pie: ChartPie, ring: CircleDot, gauge: Gauge, activity: Activity, dashboard: LayoutDashboard, hash: Hash, spline: ChartSpline, click: MousePointerClick, tag: Tag, form: TextCursorInput, square: Square, tabs: PanelTop, move: MoveHorizontal, sparkles: Sparkles, type: Type, kanban: Kanban, dot: CircleDot, statusicon: BadgeCheck, avatar: Bot, cast: Users, deck: Presentation, spotlight: Sun, compare: Columns2, beam: Spline, animate: Group, reveal: Image, dialog: MessageSquare, accordion: List, select: ChevronDown, avataricon: CircleUserRound, prompt: SquarePen, conversation: MessagesSquare, thinking: Ellipsis, composer: Send, typing: Keyboard, tradeicon: Wrench, drawboard: PenTool, drawtools: Brush, brand: Palette, testimonial: Quote, reviewpage: MonitorPlay };
  const Cmp = $derived(map[icon]);
</script>

<Cmp class={className} />
