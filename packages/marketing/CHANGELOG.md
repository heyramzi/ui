# Changelog

## Unreleased

### Breaking changes

* feat(marketing)!: remove `VideoEmbed`; `TestimonialVideoPlayer` replaces it and takes `src` where `VideoEmbed` took `url`. It plays YouTube, Vimeo and Loom links, Mux playback ids and file videos. `nativeControls` shows the browser's controls (what `VideoEmbed` did without `playOnly`), `rounded` is on by default, and `title` names the embed frame. A link that is not a known embed now plays as a file video instead of rendering nothing.

## [1.1.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v1.0.3...marketing-v1.1.0) (2026-10-01)


### Features

* **packages:** devtools, review ui, and studio library ([c0beedf](https://github.com/heyramzi/vibe-kit/commit/c0beedffd09b1e482e565e61fe498a15542ece7c))

## [1.0.3](https://github.com/heyramzi/vibe-kit/compare/marketing-v1.0.2...marketing-v1.0.3) (2026-09-28)


### Bug Fixes

* **utils,marketing:** #src/*.js resolves to the .ts file, so Vite apps load them ([53f0e51](https://github.com/heyramzi/vibe-kit/commit/53f0e51760c20526bb54d64cc69385b9864e2bdc))

## [1.0.2](https://github.com/heyramzi/vibe-kit/compare/marketing-v1.0.1...marketing-v1.0.2) (2026-09-28)


### Bug Fixes

* **marketing:** every #src import names its file, so apps resolve them ([df1c4fa](https://github.com/heyramzi/vibe-kit/commit/df1c4fa19770c17b8eb52cd6d06d1d56dc4d181e))

## [1.0.1](https://github.com/heyramzi/vibe-kit/compare/marketing-v1.0.0...marketing-v1.0.1) (2026-09-28)


### Bug Fixes

* **marketing:** imagegen carries the wawoff2 types to the apps again ([f180920](https://github.com/heyramzi/vibe-kit/commit/f1809203f6d3e6855065526659e1cb16d0e3d904))

## [1.0.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.15.2...marketing-v1.0.0) (2026-09-21)


### ⚠ BREAKING CHANGES

* **marketing:** remove Swetrix

### Code Refactoring

* **marketing:** remove Swetrix ([6c4faaf](https://github.com/heyramzi/vibe-kit/commit/6c4faaf1607f1c747e3bbdcc0535e94f29a3daeb))

## [0.15.2](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.15.1...marketing-v0.15.2) (2026-09-21)


### Bug Fixes

* **marketing:** internal imports are relative ([076b7f9](https://github.com/heyramzi/vibe-kit/commit/076b7f9f004cc9f0d18671b01cf1f8643c29dab8))

## [0.15.1](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.15.0...marketing-v0.15.1) (2026-09-21)


### Bug Fixes

* **marketing:** the Sentry helper imports relatively ([cb384ae](https://github.com/heyramzi/vibe-kit/commit/cb384aeb123f355c637451aa41dad7a3b3fbca91))

## [0.15.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.14.0...marketing-v0.15.0) (2026-09-21)


### Features

* **marketing:** le client Umami sait enregistrer un site, et le CLI aussi ([5847618](https://github.com/heyramzi/vibe-kit/commit/58476180e32acba22b38651097809b5a64a51406))
* **marketing:** Sentry error capture that runs anywhere ([6d300ba](https://github.com/heyramzi/vibe-kit/commit/6d300baae8a19ce2eac068919dd54680b20ce8ff))
* **ui:** les trente-deux transitions gratuites et les scripts de synchronisation ([34ea17b](https://github.com/heyramzi/vibe-kit/commit/34ea17b7f9a8fffbbd2f882040fddc76298839ca))


### Bug Fixes

* gate after path aliases ([0085be5](https://github.com/heyramzi/vibe-kit/commit/0085be500c58074d1adcae408763e8196fa74430))
* mirror # aliases in tsconfig paths for tsc ([0f967e7](https://github.com/heyramzi/vibe-kit/commit/0f967e7c4166b651e06e72a3cf72f68fc9451a6f))

## [0.14.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.13.1...marketing-v0.14.0) (2026-09-01)


### Features

* **marketing:** the traffic dashboard says which pages the traffic went to ([5b8823e](https://github.com/heyramzi/vibe-kit/commit/5b8823e90e20bd12710abc96281b3b4d9b74e52a))
* **slide-deck:** the surface rebuilt on a measured shape, and FONT.display ([b57c501](https://github.com/heyramzi/vibe-kit/commit/b57c501d6f886b71045c4e6f0f20ad49773d5501))

## [0.13.1](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.13.0...marketing-v0.13.1) (2026-08-25)


### Bug Fixes

* **ai:** deep-import phosphor icons instead of the barrel ([0d36623](https://github.com/heyramzi/vibe-kit/commit/0d3662311af4d5ad33d152cc7610d2566abbc114))
* **marketing:** Umami names the event-data property `propertyName` ([a2c4d93](https://github.com/heyramzi/vibe-kit/commit/a2c4d93de9784ff73a2ccee19fe5aa793fc5e9b6))

## [0.13.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.12.0...marketing-v0.13.0) (2026-08-17)


### Features

* **marketing:** mux testimonial player, plus superpowers doc updates ([ab31c4e](https://github.com/heyramzi/vibe-kit/commit/ab31c4e604ca5ec27e215f6129e7765ab1551287))
* **marketing:** one Umami reporting client and a shared traffic dashboard ([7d38e7d](https://github.com/heyramzi/vibe-kit/commit/7d38e7dc00f1b24e01da645e40699ac395563fd5))

## [0.12.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.11.0...marketing-v0.12.0) (2026-08-13)


### Features

* **marketing:** resolve Mux playback ids in the testimonial video player ([#98](https://github.com/heyramzi/vibe-kit/issues/98)) ([3bac873](https://github.com/heyramzi/vibe-kit/commit/3bac8730e47d4219813a1fb85769c85f62f1f773))

## [0.11.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.10.0...marketing-v0.11.0) (2026-06-16)


### Features

* **packages:** add descriptions to ai, auth, marketing, ui, utils manifests ([2e6630b](https://github.com/heyramzi/vibe-kit/commit/2e6630be49a6b97ec505e1bf6b8f011a4eaf5627))


### Bug Fixes

* **ci:** make release-please changelog-path package-relative ([af35ed4](https://github.com/heyramzi/vibe-kit/commit/af35ed48c39349ec1581073be236c24d675e94d4))

## [0.10.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.9.0...marketing-v0.10.0) (2026-06-01)


### Features

* **marketing:** add postPageview and buildPageviewBody for Swetrix pageview ingest ([82d1ce0](https://github.com/heyramzi/vibe-kit/commit/82d1ce052f422e0d8401ceaf6a2a4af84128efbd))

## [0.9.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.8.0...marketing-v0.9.0) (2026-06-01)


### Features

* **analytics:** swetrix native SvelteKit integration via npm package ([250ae2e](https://github.com/heyramzi/vibe-kit/commit/250ae2ea6a932c70dd7168e7bbb6112aff650c4b))
* **marketing/testimonials:** bump grid masonry to 4 columns at xl breakpoint ([bb1bbc5](https://github.com/heyramzi/vibe-kit/commit/bb1bbc5ddb728ff16f1507c321f6d47989f28542))
* **marketing:** add ./resend subpath with createResendLeadClient ([b80df41](https://github.com/heyramzi/vibe-kit/commit/b80df41c69a0836916ea58ffadc991b39ad92d71))
* **marketing:** add errorsOnly flag + umami protocol module ([449e6c4](https://github.com/heyramzi/vibe-kit/commit/449e6c43d8f2388a294093e897d2ee7d59a99c55))
* **marketing:** add filename/lineno/colno fields to swetrix error protocol ([0bd722e](https://github.com/heyramzi/vibe-kit/commit/0bd722e719a63e29a5130bb2d3076f4364a1d0f9))
* **marketing:** add playOnly mode to VideoEmbed with centered play button ([94029e2](https://github.com/heyramzi/vibe-kit/commit/94029e2d38ae4e3fb48869fe918e2f4e0704e53b))
* **marketing:** add Swetrix analytics SDK as parallel entrypoint ([a324cfb](https://github.com/heyramzi/vibe-kit/commit/a324cfb5004ce713701d1f7cd4d76d732fa71709))
* **marketing:** add swetrix/protocol + swetrix/extension entrypoints ([be4bc36](https://github.com/heyramzi/vibe-kit/commit/be4bc368ae70905e9d0b2615b684ba443ecff192))
* **marketing:** add testimonials package with SSR Svelte widgets ([9d4578d](https://github.com/heyramzi/vibe-kit/commit/9d4578d5fa19292f830d270aff00adc6de3e0647))
* **marketing:** add trackServerError for server-side error reporting ([4ea70a8](https://github.com/heyramzi/vibe-kit/commit/4ea70a80ce30911cadef433df816d1c38a131e26))
* **marketing:** bold markdown rendering, captioned video player, per-card show more in testimonials ([2261d01](https://github.com/heyramzi/vibe-kit/commit/2261d01c4e18c34db92a33252ae4165e4ce92cc3))
* **marketing:** expose full umami data-* options on script and unified adapter ([0cc6015](https://github.com/heyramzi/vibe-kit/commit/0cc6015d1abc53d8b53d4123707b29813b5afeec))
* **marketing:** unified analytics layer with pluggable adapters ([83d1493](https://github.com/heyramzi/vibe-kit/commit/83d149352a0e550421d39f98423ed71c7eecbd9f))


### Bug Fixes

* **marketing:** consolidate Window.umami declaration to a single source ([ef15a67](https://github.com/heyramzi/vibe-kit/commit/ef15a673e4bca2464d17694c7be15260e111d097))
* **workspace:** use workspace: protocol for cross-package peer deps ([cba21a1](https://github.com/heyramzi/vibe-kit/commit/cba21a1673444b3c0f7e3bf8d9cfebe6c0a11564))

## [0.4.0](https://github.com/heyramzi/vibe-kit/compare/marketing-v0.3.0...marketing-v0.4.0) (2026-05-03)


### Features

* **marketing:** add filename/lineno/colno fields to swetrix error protocol ([0bd722e](https://github.com/heyramzi/vibe-kit/commit/0bd722e719a63e29a5130bb2d3076f4364a1d0f9))
* **marketing:** add Swetrix analytics SDK as parallel entrypoint ([a324cfb](https://github.com/heyramzi/vibe-kit/commit/a324cfb5004ce713701d1f7cd4d76d732fa71709))
* **marketing:** add swetrix/protocol + swetrix/extension entrypoints ([be4bc36](https://github.com/heyramzi/vibe-kit/commit/be4bc368ae70905e9d0b2615b684ba443ecff192))
* **marketing:** add trackServerError for server-side error reporting ([4ea70a8](https://github.com/heyramzi/vibe-kit/commit/4ea70a80ce30911cadef433df816d1c38a131e26))

## [1.2.0](https://github.com/heyramzi/ui/compare/marketing-v1.1.0...marketing-v1.2.0) (2026-10-06)

### Features

* feat: move vibe-kit UI packages here, hub home page, private repo with password


## [1.3.0](https://github.com/heyramzi/ui/compare/marketing-v1.2.0...marketing-v1.3.0) (2026-10-07)

### Features

* feat(review): agent dock, layout library, pace pill and a pill radius token


## [2.0.0](https://github.com/heyramzi/ui/compare/marketing-v1.3.0...marketing-v2.0.0) (2026-10-09)

### Breaking Changes

* Removed exports: `.`, `./analytics`, `./analytics/client`, `./analytics/types`, `./analytics/umami/dashboard`, `./analytics/umami/svelte`, `./analytics/unified/types`, `./metadata`, `./resend`, `./testimonials/mux`.
* `./analytics/unified` is one module now. Apps importing `./analytics/client` stay on 1.x until they call `window.umami.track` themselves; the server side is `./analytics/server`.


## [2.0.1](https://github.com/heyramzi/ui/compare/marketing-v2.0.0...marketing-v2.0.1) (2026-10-09)

### Bug Fixes

* fix(ui,marketing): accept any @heyramzi/utils 1.x from 1.3.3


## [2.1.0](https://github.com/heyramzi/ui/compare/marketing-v2.0.1...marketing-v2.1.0) (2026-10-16)

### Features

* feat(marketing): UpSys deck tokens in brand/deck


## [3.0.0](https://github.com/heyramzi/ui/compare/marketing-v2.1.0...marketing-v3.0.0) (2026-10-16)

### Features

* initial publish from this repo


## [3.1.0](https://github.com/heyramzi/ui/compare/marketing-v3.0.0...marketing-v3.1.0) (2026-10-19)

### Features

* feat(marketing): server trackers await the send and return Promise<boolean>

