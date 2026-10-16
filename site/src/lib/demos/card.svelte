<script lang="ts">
  import { Button } from "@heyramzi/ui/shadcn/button";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@heyramzi/ui/shadcn/card";
</script>

<Card class="w-80">
  <CardHeader>
    <CardTitle>Team plan</CardTitle>
    <CardDescription>Up to 10 seats, billed monthly.</CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-3xl font-semibold tracking-tight">$49<span class="text-sm font-normal text-muted-foreground"> / month</span></p>
  </CardContent>
  <CardFooter class="gap-2">
    <Button size="sm">Upgrade</Button>
    <Button size="sm" variant="ghost">Compare</Button>
  </CardFooter>
</Card>
