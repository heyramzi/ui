import type { BotAvatarFace, BotAvatarProps, BotAvatarType } from './vendor/types';

/** The body shapes an agent can be drawn as. */
export type AgentShape = BotAvatarType;

export type {
  BotAvatarFace as AgentFace,
  BotAvatarState as AgentState,
  BotAvatarShading as AgentShading,
  BotAvatarSquashEase as AgentSquashEase,
  BotAvatarHat as AgentHat,
  BotAvatarGlasses as AgentGlasses,
  BotAvatarPreset as AgentPreset,
} from './vendor/types';

export {
  botAvatarPresets as agentPresets,
  botAvatarTypes as agentShapes,
  botAvatarFaces as agentFaces,
  botAvatarStates as agentStates,
  botAvatarPalette as agentPalette,
  stateLabels as agentStateLabels,
} from './vendor/presets';

/** One member of a cast: a name, a role, and the face they draw. */
export type Agent = {
  /** Stable key. Falls back to `name` when missing. */
  id?: string;
  /** Display name. */
  name: string;
  /** What they do. Shown under the name, read out with it. */
  role?: string;
  /** Body shape. Defaults to the avatar's own. */
  shape?: AgentShape;
  /** Body colour. Defaults to the shape's palette colour. */
  color?: string;
  /** Optional section heading. Agents sharing a group render together. */
  group?: string;
};

/* The vendored props carry an open `Record<string, unknown>` index signature
   so the canvas can forward loose attributes. Strip it before Omit, otherwise
   every named prop collapses to `unknown`. */
type KnownProps<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

/**
 * Props for `<AgentAvatar>`. Every engine prop from the bot avatar is
 * available; `shape`, `color`, `name` and `role` are the plain ones.
 */
export type AgentAvatarProps = Omit<
  KnownProps<BotAvatarProps>,
  'type' | 'face' | 'ink' | 'size' | 'className' | 'style'
> & {
  /** Display name, for the default aria-label. */
  name?: string;
  /** What the agent does, read out with the name. */
  role?: string;
  /** Body shape. Default `clover`. */
  shape?: AgentShape;
  /** Face kind. Default `eyes`. */
  face?: BotAvatarFace;
  /** Face ink. Default `#1E1A33`. */
  ink?: string;
  /** Rendered size in px. Omit to fill 75% of the slot. */
  size?: number;
  class?: string;
  style?: string;
  onclick?: (event: MouseEvent) => void;
  'aria-label'?: string;
};
