# Forge iPhone preview

Forge's first native build is an offline **exercise-library preview**. It packages
the existing searchable guides, form and anatomy illustrations, and safety cues
in a Capacitor iOS project. It does not connect to the Forge API or expose sign-in,
personal data entry, meal photos, or synchronized workouts. The web build keeps
its existing invitation and consent controls.

The preview uses `io.gnosislab.forge.preview`, a separate identifier from any
future store app. Its UI and assets ship inside the app; no live web URL or
credentials are needed to open it. Preview artwork and metadata are temporary.

## Build from the repository root

With Node.js 22 or later and pnpm 9.15.0 on your PATH:

```sh
pnpm install --frozen-lockfile
pnpm --filter @forge/ios prepare:preview
```

This creates the web bundle and copies it into the Xcode project. You can run
that part on Windows, Linux, or macOS. On a Mac with Xcode installed, run
`pnpm --filter @forge/ios open:xcode`, select an iPhone simulator, and run the
`App` scheme. The preview needs no Apple developer membership to run in the
simulator.

The **iOS preview** GitHub Actions workflow compiles an unsigned simulator app
on macOS and, on success, retains a `forge-ios-simulator` artifact. Download and
extract it on a Mac, then use `xcrun simctl install booted App.app` with an iPhone
simulator running. This artifact cannot be installed on a physical iPhone or
uploaded to TestFlight. Linux browser CI separately tests the built web bundle;
that test is not native device acceptance.

## Before a full TestFlight build

- Confirm Apple Developer enrollment is active before configuring TestFlight.
- Configure the release app identifier, App Store Connect record, and signing
  on the owner's Apple team. Keep signing secrets outside Git.
- Validate native browser-based sign-in and secure token handling, a deployed
  HTTPS backend, and the existing server-side invitation and consent gates.
- Validate camera/barcode access, local data handling, account isolation, and
  sign-in/sign-out on a physical iPhone. Verify store requirements for privacy,
  account deletion, and reviewer access before submission.
- Complete [web beta deployment and acceptance](./public-release.md) before
  using real tester data. This preview does not change those release gates.
