<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@heyramzi/ui/shadcn/tabs";
  let tab = $state("overview");
</script>

<Tabs bind:value={tab} class="w-80">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" class="pt-4 text-sm text-muted-foreground">A sliding indicator follows the active tab.</TabsContent>
  <TabsContent value="activity" class="pt-4 text-sm text-muted-foreground">Nothing here yet.</TabsContent>
  <TabsContent value="members" class="pt-4 text-sm text-muted-foreground">Two people have access.</TabsContent>
</Tabs>
