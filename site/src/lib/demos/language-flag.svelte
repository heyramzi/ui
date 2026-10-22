<script lang="ts">
  import { LanguageFlag } from "@heyramzi/ui/components/language-flag";

  const flag = (body: string) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">${body}</svg>`)}`;

  const flags = {
    en: flag('<rect width="30" height="20" fill="#fff"/><g fill="#b22234"><rect width="30" height="2.2"/><rect y="4.4" width="30" height="2.2"/><rect y="8.8" width="30" height="2.2"/><rect y="13.2" width="30" height="2.2"/><rect y="17.6" width="30" height="2.4"/></g><rect width="13" height="10.8" fill="#3c3b6e"/>'),
    fr: flag('<rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ed2939"/>'),
    es: flag('<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'),
  };
</script>

<div class="flex flex-col items-start gap-4">
  <div class="flex items-center gap-4">
    <LanguageFlag language="en" {flags} />
    <LanguageFlag language="fr" {flags} />
    <LanguageFlag language="es" {flags} />
  </div>
  <div class="flex items-center gap-4">
    <LanguageFlag language="en" {flags} size="md" showLabel />
    <LanguageFlag language="fr" {flags} size="md" showLabel />
    <LanguageFlag language="de" {flags} size="md" showLabel />
  </div>
</div>
