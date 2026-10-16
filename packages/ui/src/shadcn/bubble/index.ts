import Content from "#src/shadcn/bubble/bubble-content.svelte";
import Group from "#src/shadcn/bubble/bubble-group.svelte";
import Reactions, {
  bubbleReactionsVariants,
  type BubbleReactionsAlign,
  type BubbleReactionsSide,
} from "#src/shadcn/bubble/bubble-reactions.svelte";
import Root, { bubbleVariants, type BubbleVariant } from "#src/shadcn/bubble/bubble.svelte";

export {
  Root,
  Group,
  Content,
  Reactions,
  bubbleVariants,
  bubbleReactionsVariants,
  type BubbleVariant,
  type BubbleReactionsSide,
  type BubbleReactionsAlign,
  //
  Root as Bubble,
  Group as BubbleGroup,
  Content as BubbleContent,
  Reactions as BubbleReactions,
};
